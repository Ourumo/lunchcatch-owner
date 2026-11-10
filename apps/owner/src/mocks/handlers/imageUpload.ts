import { http, HttpResponse } from 'msw/http';

import { getDb, updateDb } from '@owner/mocks/db';
import { toStoredImageUrl } from '@owner/mocks/image';
import { fail } from '@owner/mocks/response';
import type { MockUpload } from '@owner/mocks/seed';

// 사진 업로드 공통 (api/imageUpload.ts)
//
// 진짜 흐름: ① 서버에 업로드 주소 발급 → ② 받은 S3 주소로 사진 PUT → ③ 서버에 업로드 확인
// 목 흐름:   ① S3 주소 대신 이 페이지 주소의 /mock-upload/{업로드 ID}를 준다
//            ② 그 주소로 온 PUT을 아래 핸들러가 받아 사진을 줄여 db에 보관한다 (S3로는 아무것도 나가지 않는다)
//            ③ 확인하면 보관한 사진을 가게 · 메뉴에 붙인다
// 화면은 받은 주소로 평소처럼 올리므로 진행률 표시, 실패 뒤 다시 올리기 코드가 그대로 동작한다.
// 로컬 개발에서는 화면이 업로드 주소 앞에 /s3-upload를 붙여 보내는데(vite.config.ts 프록시), 주소 앞의 `*`가 그것까지 받는다

// 업로드 주소 발급. 업로드를 기록하고 주소를 돌려준다
export const createUpload = (upload: Omit<MockUpload, 'url' | 'confirmed'>) => {
  const uploadId = `mock-upload-${getDb().nextId}`;

  updateDb((db) => {
    db.nextId += 1;
    db.uploads[uploadId] = { ...upload, url: null, confirmed: false };
  });

  return {
    uploadId,
    uploadUrl: `${window.location.origin}/mock-upload/${uploadId}`,
  };
};

// 업로드 확인 전 검사. 사진을 아직 받지 못했으면 서버가 S3에서 파일을 찾지 못한 것과 같이 거절한다
export const findUploadedImage = (uploadId: string) => {
  const upload = getDb().uploads[uploadId];

  if (!upload) {
    return {
      error: fail(404, 'UPLOAD-001', '업로드를 찾을 수 없습니다.'),
    } as const;
  }

  if (!upload.url) {
    return {
      error: fail(409, 'UPLOAD-002', '업로드한 파일을 찾을 수 없습니다.'),
    } as const;
  }

  return { upload, url: upload.url } as const;
};

export const imageUploadHandlers = [
  // 가짜 S3. S3처럼 본문 없이 200으로 답한다
  http.put<{ uploadId: string }>(
    '*/mock-upload/:uploadId',
    async ({ params, request }) => {
      if (!getDb().uploads[params.uploadId]) {
        return new HttpResponse(null, { status: 403 });
      }

      const url = await toStoredImageUrl(await request.blob());

      updateDb((db) => {
        const upload = db.uploads[params.uploadId];

        if (upload) {
          upload.url = url;
        }
      });

      return new HttpResponse(null, { status: 200 });
    },
  ),
];
