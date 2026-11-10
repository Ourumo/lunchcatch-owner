// 목 서버가 받은 사진을 보관할 형태로 바꾼다.
// 사진을 새로고침 뒤에도 보여 주려면 sessionStorage에 글자(data URL)로 저장해야 하는데, 탭마다 약 5MB까지라
// 앱이 이미 줄여 올린 사진(긴 변 1600px)을 한 번 더 줄인다. 로고 1장, 매장 3장, 메뉴 3장을 넣어도 넉넉하다

// 긴 변 최대 크기. 화면에 보이는 사진 칸보다 충분히 크다
const MAX_SIDE = 640;
const QUALITY = 0.8;

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// 사진을 줄여 data URL로 돌려준다. 투명한 부분이 있는 PNG도 그대로 보이도록 WebP로 저장하고,
// 브라우저가 WebP로 저장하지 못하면 PNG로 저장된다. 줄이지 못하면 받은 사진을 그대로 쓴다
export const toStoredImageUrl = async (blob: Blob) => {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return canvas.toDataURL('image/webp', QUALITY);
  } catch {
    return blobToDataUrl(blob);
  }
};
