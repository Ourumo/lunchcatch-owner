import axios from 'axios';

import { ApiError } from './client';

// 가게·메뉴 사진 업로드 (docs/requirements-owner.md "가게 이미지 및 대표 메뉴 등록/수정")

// 업로드 주소를 받은 업로드. 실패한 뒤 다시 시도할 때 받은 주소와 줄인 사진을 그대로 쓴다
export interface UploadTicket {
  uploadId: string;
  uploadUrl: string;
  // 업로드 주소를 받은 시각(ms). 주소는 10분 동안만 쓸 수 있다
  issuedAt: number;
  // 줄인 사진. 서명에 크기가 들어가므로 다시 올릴 때도 이것을 그대로 올린다
  blob: Blob;
  // S3에 다 올렸는지. 올렸으면 다시 시도할 때 업로드 확인만 부른다
  isUploaded: boolean;
}

// 사진 칸 하나의 값. 새로 고른 사진은 파일과 업로드 상태를 함께 들고,
// 이미 가게·메뉴에 붙은 사진은 서버가 준 주소만 든다
export type ImageValue =
  // 고르기만 하고 아직 올리지 않았다
  | { status: 'selected'; file: File }
  // 업로드 주소 발급부터 업로드 확인까지 하는 중. progress는 S3에 올린 정도(0~100)
  | { status: 'uploading'; file: File; progress: number }
  // 올리지 못했다. upload가 있으면 다시 시도할 때 이어서 하고, code는 서버가 거절한 이유다
  | { status: 'failed'; file: File; upload?: UploadTicket; code?: string }
  // 업로드 확인까지 마쳐 가게·메뉴에 붙었다. 확인 응답에 주소가 없어 고른 파일로 보여준다
  | { status: 'attached'; file: File }
  // 이미 가게·메뉴에 붙은 사진
  | { status: 'saved'; url: string };

// 올릴 수 있는 칸(새로 고른 사진, 실패한 사진)과 다 올린 뒤의 칸
export type UploadableImage = Extract<
  ImageValue,
  { status: 'selected' | 'failed' }
>;
export type UploadedImage = Extract<
  ImageValue,
  { status: 'attached' | 'failed' }
>;

// 고르자마자 올리는 화면에서 업로드가 끝나지 않은 사진 (차례를 기다리거나 올리는 중)
export const isImageUploading = (image: ImageValue) =>
  image.status === 'selected' || image.status === 'uploading';

// 가게·메뉴에 붙은 사진
export const isImageAttached = (image: ImageValue) =>
  image.status === 'attached' || image.status === 'saved';

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

// 업로드 주소는 10분 동안 쓸 수 있다. 다시 올리는 동안 만료되지 않게 1분 여유를 두고, 지나면 주소부터 새로 받는다
const UPLOAD_URL_REUSE_MS = 9 * 60_000;

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
  // 이미지 종류별 업로드 확인 API. 서버가 S3에 올라간 것을 확인해야 가게·메뉴에 붙는다. 거절하면 ApiError를 던진다
  confirm: (uploadId: string) => Promise<void>;
  // 0~100
  onProgress?: (progress: number) => void;
}

// 지난 업로드를 이어서 쓸 수 있는지. 업로드 주소가 만료되기 전이거나, S3에 다 올려 확인만 남았으면 쓴다
const canReuseUpload = (upload: UploadTicket | undefined) =>
  upload !== undefined &&
  (upload.isUploaded || Date.now() - upload.issuedAt < UPLOAD_URL_REUSE_MS);

// 사진 한 장을 줄여 S3에 올리고 업로드 확인까지 한 뒤, 끝난 칸의 값(attached 또는 failed)을 돌려준다.
// jpg·png, 10MB 이하인지는 사진 칸에서 먼저 거른다.
// 실패한 칸을 다시 넘기면 실패한 곳부터 다시 한다. 업로드 주소를 새로 받을 때마다 서버가 자리를 잡아
// (매장 사진은 3장) 받은 주소를 되도록 다시 쓴다:
// S3에 다 올렸으면 확인만, 주소를 받은 지 10분이 안 됐으면 그 주소로 다시 올리고, 아니면 주소부터 새로 받는다
export const uploadImage = async (
  image: UploadableImage,
  { confirm, onProgress, prepare }: UploadImageOptions,
): Promise<UploadedImage> => {
  const { file } = image;
  let upload =
    image.status === 'failed' && canReuseUpload(image.upload)
      ? image.upload
      : undefined;

  try {
    if (!upload) {
      const blob = await resizeImage(file);
      const { uploadId, uploadUrl } = await prepare({
        originalFilename: file.name,
        contentType: file.type,
        fileSize: blob.size,
      });

      upload = {
        uploadId,
        uploadUrl,
        issuedAt: Date.now(),
        blob,
        isUploaded: false,
      };
    }

    if (!upload.isUploaded) {
      // 서명에 Content-Type과 크기가 들어가므로 발급 요청에 보낸 값 그대로 올린다
      await axios.put(toUploadRequestUrl(upload.uploadUrl), upload.blob, {
        headers: { 'Content-Type': file.type },
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: ({ loaded, total }) => {
          if (total) {
            onProgress?.((loaded / total) * 100);
          }
        },
      });

      upload = { ...upload, isUploaded: true };
    }

    await confirm(upload.uploadId);

    return { status: 'attached', file };
  } catch (error) {
    // S3가 주소를 거절하면(403, 만료 등) 그 주소로는 다시 올릴 수 없어 다음 시도에서 주소부터 새로 받는다
    const isUploadUrlRejected =
      axios.isAxiosError(error) && error.response?.status === 403;

    return {
      status: 'failed',
      file,
      upload: isUploadUrlRejected ? undefined : upload,
      code: error instanceof ApiError ? (error.code ?? undefined) : undefined,
    };
  }
};
