// 사진 파일 검사. 사진 칸(ImageUploadSlot)과 메뉴 목록의 사진 등록 버튼이 함께 쓴다

// 요구사항: jpg, png만, 10MB 이하
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const getImageFileError = (file: File) => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'jpg, png 파일만 등록할 수 있어요';
  }

  if (file.size > MAX_FILE_SIZE) {
    return '10MB 이하 사진만 등록할 수 있어요';
  }

  return undefined;
};
