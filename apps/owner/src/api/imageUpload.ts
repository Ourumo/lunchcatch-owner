import axios from 'axios';

import { ApiError } from './client';
import type { ApiResult } from './types';

// 가게·메뉴 사진 업로드 (docs/requirements-owner.md "가게 이미지 및 대표 메뉴 등록/수정")

// 사진 칸 하나의 값. 새로 고른 사진은 파일과 업로드 상태를 함께 들고,
// 이미 가게·메뉴에 붙은 사진은 서버가 준 주소만 든다
export type ImageValue =
  // 고르기만 하고 아직 올리지 않았다
  | { status: 'selected'; file: File }
  // S3에 올리는 중. progress는 0~100
  | { status: 'uploading'; file: File; progress: number }
  // 올리지 못했다
  | { status: 'failed'; file: File }
  // S3에 올렸다. 업로드 확인을 불러야 가게·메뉴에 붙는다
  | { status: 'uploaded'; file: File; uploadId: string }
  // 이미 가게·메뉴에 붙은 사진
  | { status: 'saved'; url: string };

export const toSavedImage = (url: string): ImageValue => ({
  status: 'saved',
  url,
});

// 같은 사진인지. 새로 고른 사진은 업로드 상태가 바뀌어도 같은 파일이면 같은 사진으로 본다
export const isSameImage = (a: ImageValue | null, b: ImageValue | null) => {
  if (a === null || b === null) {
    return a === b;
  }

  return a.status === 'saved'
    ? b.status === 'saved' && a.url === b.url
    : b.status !== 'saved' && a.file === b.file;
};

// 긴 변이 이보다 크면 줄여서 올린다
const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.85;

// 서버가 받는 크기만큼 올리는 데 시간이 걸려 API 요청(10초)보다 길게 기다린다
const UPLOAD_TIMEOUT_MS = 120_000;

// 긴 변을 MAX_IMAGE_SIDE로 줄인다. 형식(jpg, png)은 그대로 두고 jpg는 JPEG_QUALITY로 저장한다.
// 이미 작으면 다시 저장하지 않고 원본을 그대로 쓴다. 회전 정보(EXIF)는 그릴 때 반영된다
const resizeImage = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);

  try {
    const longSide = Math.max(bitmap.width, bitmap.height);

    if (longSide <= MAX_IMAGE_SIDE) {
      return file;
    }

    const scale = MAX_IMAGE_SIDE / longSide;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('사진을 줄이지 못했습니다')),
        file.type,
        file.type === 'image/jpeg' ? JPEG_QUALITY : undefined,
      );
    });
  } finally {
    bitmap.close();
  }
};

// 개발에서는 S3 버킷의 CORS가 localhost를 허용하지 않아 Vite 프록시(/s3-upload)를 거쳐 올린다 (vite.config.ts)
const toUploadRequestUrl = (uploadUrl: string) => {
  if (!import.meta.env.DEV) {
    return uploadUrl;
  }

  const { pathname, search } = new URL(uploadUrl);

  return `/s3-upload${pathname}${search}`;
};

// 업로드 주소 발급 요청. 이미지 종류마다 주소만 다르고 내용은 같다
export interface PrepareUploadRequest {
  originalFilename: string;
  contentType: string;
  // 줄인 뒤의 크기(byte). 10MB 이하
  fileSize: number;
}

export interface PrepareUploadResponse {
  uploadId: string;
  // 10분 안에 써야 한다
  uploadUrl: string;
}

export interface UploadImageOptions {
  // 이미지 종류별 업로드 주소 발급 API. 서버가 거절하면 ApiError를 던진다
  prepare: (request: PrepareUploadRequest) => Promise<PrepareUploadResponse>;
  // 0~100
  onProgress?: (progress: number) => void;
}

// 사진 한 장을 줄여 S3에 올리고 uploadId를 돌려준다. jpg·png, 10MB 이하인지는 사진 칸에서 먼저 거른다.
// 업로드 확인(confirmUpload)은 부르지 않는다. 확인해야 가게·메뉴에 붙으므로 저장할 때 이미지 종류별로 부른다.
// 실패하면 서버가 거절한 이유(code)를 함께 돌려준다. 다시 시도할 때는 업로드 주소부터 새로 받는다
export const uploadImage = async (
  file: File,
  { onProgress, prepare }: UploadImageOptions,
): Promise<ApiResult<string>> => {
  try {
    const image = await resizeImage(file);
    const { uploadId, uploadUrl } = await prepare({
      originalFilename: file.name,
      contentType: file.type,
      fileSize: image.size,
    });

    // 서명에 Content-Type과 크기가 들어가므로 발급 요청에 보낸 값 그대로 올린다
    await axios.put(toUploadRequestUrl(uploadUrl), image, {
      headers: { 'Content-Type': file.type },
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: ({ loaded, total }) => {
        if (total) {
          onProgress?.((loaded / total) * 100);
        }
      },
    });

    return { ok: true, data: uploadId };
  } catch (error) {
    return error instanceof ApiError
      ? { ok: false, code: error.code ?? undefined }
      : { ok: false };
  }
};
