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
