import { useState } from 'react';

import { MAX_INTERIOR_IMAGES } from '@owner/api/signupFlow';
import {
  type StoreImage,
  type StoreImagesValues,
  updateStoreImages,
} from '@owner/api/store';
import { ImageUploadSlot } from '@owner/components/ImageUploadSlot/ImageUploadSlot';

import { StoreEditLayout } from './StoreEditLayout';
import { useStoreEdit } from './useStoreEdit';

// 사진 목록을 순서대로 그대로 비교한다. 같은 주소, 같은 파일이면 바뀌지 않은 것으로 본다
const isSameImages = (a: StoreImagesValues, b: StoreImagesValues) =>
  a.logoImage === b.logoImage &&
  a.interiorImages.length === b.interiorImages.length &&
  a.interiorImages.every((image, index) => image === b.interiorImages[index]);

const isValidImages = ({ interiorImages, logoImage }: StoreImagesValues) =>
  Boolean(logoImage) && interiorImages.length <= MAX_INTERIOR_IMAGES;

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

interface ImagesFieldsProps {
  values: StoreImagesValues;
  onChange: (values: StoreImagesValues) => void;
}

// 입점 등록의 매장 사진 단계와 같은 모양. 입력 화면을 공용 컴포넌트로 나누기 전까지 매장 이미지 칸 처리는 복사해 둔다.
// 이미 올라간 사진(주소)과 새로 고른 사진(File)이 섞여도 순서대로 보여준다
const ImagesFields = ({ onChange, values }: ImagesFieldsProps) => {
  const { interiorImages, logoImage } = values;
  const remainingCount = MAX_INTERIOR_IMAGES - interiorImages.length;
  // 남은 자리보다 많이 고르면 앞에서부터 남은 자리만큼만 넣고 알린다
  const [isOverLimit, setIsOverLimit] = useState(false);

  const updateInteriorImages = (nextImages: StoreImage[]) => {
    setIsOverLimit(false);
    onChange({ ...values, interiorImages: nextImages });
  };

  const addInteriorImages = (files: File[]) => {
    updateInteriorImages([
      ...interiorImages,
      ...files.slice(0, remainingCount),
    ]);
    setIsOverLimit(files.length > remainingCount);
  };

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-caption-web font-medium text-text-primary">
          대표 이미지
        </h2>
        {/* 필수 1장이라 지울 수 없고 눌러서 바꾸기만 한다 */}
        <ImageUploadSlot
          image={logoImage}
          label="대표 이미지"
          onSelect={([file]) => onChange({ ...values, logoImage: file })}
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
            {interiorImages.length}/{MAX_INTERIOR_IMAGES}
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
            최대 {MAX_INTERIOR_IMAGES}장까지 등록할 수 있어요
          </p>
        )}
      </section>
    </div>
  );
};

// 가게 관리 > 매장 사진 수정. 대표 이미지(필수 1장)와 매장 이미지(선택, 최대 3장)를 고친다
export const StoreImagesEdit = () => {
  const edit = useStoreEdit({
    select: (store): StoreImagesValues => ({
      logoImage: store.logoImageUrl,
      interiorImages: store.interiorImageUrls,
    }),
    isEqual: isSameImages,
    isValid: isValidImages,
    save: updateStoreImages,
  });

  return (
    <StoreEditLayout edit={edit} title="매장 사진">
      {edit.values && (
        <ImagesFields onChange={edit.setValues} values={edit.values} />
      )}
    </StoreEditLayout>
  );
};
