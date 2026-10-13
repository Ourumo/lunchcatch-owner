import { useState } from 'react';

import { ImageUploadSlot } from '@owner/components/ImageUploadSlot/ImageUploadSlot';

// 입점 등록은 새로 고른 파일만, 가게 관리는 파일과 이미 올라간 사진 주소를 함께 쓴다
type StoreImage = File | string;

// 사진 칸의 key. 칸이 들고 있는 파일 오류 문구가 삭제로 칸이 당겨져도 원래 사진에 남도록 자리 번호 대신 사진마다 고정한다.
// 이미 올라간 사진은 주소를 쓰고, 새로 고른 파일은 주소가 없어 처음 볼 때 번호를 붙인다
const fileKeys = new WeakMap<File, string>();
let nextFileKey = 0;

const getImageKey = (image: StoreImage) => {
  if (typeof image === 'string') {
    return image;
  }

  let key = fileKeys.get(image);

  if (!key) {
    key = `file-${nextFileKey}`;
    nextFileKey += 1;
    fileKeys.set(image, key);
  }

  return key;
};

export interface StoreImagesFieldsProps<TImage extends StoreImage> {
  // 가게 대표 이미지(로고). 필수 1장
  logoImage: TImage | null;
  // 매장 이미지. 선택, 최대 maxInteriorImages장
  interiorImages: TImage[];
  maxInteriorImages: number;
  onLogoSelect: (file: File) => void;
  // 넘기면 대표 이미지를 지울 수 있다. 가게 관리는 필수 1장이라 넘기지 않고 눌러서 바꾸기만 한다
  onLogoRemove?: () => void;
  // 새로 고른 사진은 File로, 원래 있던 사진은 그대로 순서대로 넘긴다
  onInteriorImagesChange: (images: (TImage | File)[]) => void;
}

// 대표 이미지와 매장 이미지 입력. 입점 등록과 가게 관리가 함께 쓴다.
// 이미 올라간 사진(주소)과 새로 고른 사진(File)이 섞여도 순서대로 보여준다.
// 최대 장수는 api의 값을 쓰는 쪽에서 넘긴다 (components는 api의 값을 가져오지 않는다)
export const StoreImagesFields = <TImage extends StoreImage>({
  interiorImages,
  logoImage,
  maxInteriorImages,
  onInteriorImagesChange,
  onLogoRemove,
  onLogoSelect,
}: StoreImagesFieldsProps<TImage>) => {
  const remainingCount = maxInteriorImages - interiorImages.length;
  // 남은 자리보다 많이 고르면 앞에서부터 남은 자리만큼만 넣고 알린다
  const [isOverLimit, setIsOverLimit] = useState(false);

  const updateInteriorImages = (nextImages: (TImage | File)[]) => {
    setIsOverLimit(false);
    onInteriorImagesChange(nextImages);
  };

  const addInteriorImages = (files: File[]) => {
    updateInteriorImages([
      ...interiorImages,
      ...files.slice(0, remainingCount),
    ]);
    setIsOverLimit(files.length > remainingCount);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-caption-web font-medium text-text-primary">
          대표 이미지
        </h2>
        <ImageUploadSlot
          image={logoImage}
          label="대표 이미지"
          onRemove={onLogoRemove}
          onSelect={([file]) => onLogoSelect(file)}
          size="lg"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-caption-web font-medium text-text-primary">
            매장 이미지{' '}
            <span className="font-normal text-text-secondary">(선택)</span>
          </h2>
          <span className="text-caption-mobile text-text-secondary">
            {interiorImages.length}/{maxInteriorImages}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {interiorImages.map((image, index) => (
            <ImageUploadSlot
              image={image}
              key={getImageKey(image)}
              label={`매장 이미지 ${index + 1}`}
              onRemove={() =>
                updateInteriorImages(
                  interiorImages.filter(
                    (_, imageIndex) => imageIndex !== index,
                  ),
                )
              }
              onSelect={([file]) =>
                updateInteriorImages(
                  interiorImages.map((current, imageIndex) =>
                    imageIndex === index ? file : current,
                  ),
                )
              }
              size="sm"
            />
          ))}
          {remainingCount > 0 && (
            <ImageUploadSlot
              image={null}
              label="매장 이미지 추가"
              multiple
              onSelect={addInteriorImages}
              size="sm"
            />
          )}
        </div>
        {isOverLimit && (
          <p
            className="ml-1 text-caption-mobile text-text-secondary"
            role="status"
          >
            최대 {maxInteriorImages}장까지 등록할 수 있어요
          </p>
        )}
      </section>
    </div>
  );
};
