import { useState } from 'react';

import { MAX_INTERIOR_IMAGES } from '@owner/api/signupFlow';
import { ImageUploadSlot } from '@owner/components/ImageUploadSlot/ImageUploadSlot';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

// 대표 이미지(필수 1장)와 매장 이미지(선택, 최대 3장) 등록
export const ImagesStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { logoImage, interiorImages } = values.images;
  const remainingCount = MAX_INTERIOR_IMAGES - interiorImages.length;
  // 남은 자리보다 많이 고르면 앞에서부터 남은 자리만큼만 넣고 알린다
  const [isOverLimit, setIsOverLimit] = useState(false);

  const updateInteriorImages = (nextImages: File[]) => {
    setIsOverLimit(false);
    updateStepValues('images', { interiorImages: nextImages });
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
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님이 가게를 찾을 때 보여지는 사진이에요. 맛있고 깔끔한 첫인상을 위해
        밝고 선명한 사진을 골라주세요.
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="text-caption-web font-medium text-text-primary">
          대표 이미지
        </h3>
        <ImageUploadSlot
          size="lg"
          image={logoImage}
          label="대표 이미지"
          onRemove={() => updateStepValues('images', { logoImage: null })}
          onSelect={([file]) => updateStepValues('images', { logoImage: file })}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-caption-web font-medium text-text-primary">
            매장 이미지{' '}
            <span className="font-normal text-text-secondary">(선택)</span>
          </h3>
          <span className="text-caption-mobile text-text-secondary">
            {interiorImages.length}/{MAX_INTERIOR_IMAGES}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {interiorImages.map((image, index) => (
            <ImageUploadSlot
              size="sm"
              image={image}
              // 순서만 의미가 있어 자리 번호로 구분한다
              key={index}
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
            />
          ))}
          {remainingCount > 0 && (
            <ImageUploadSlot
              size="sm"
              image={null}
              label="매장 이미지 추가"
              multiple
              onSelect={addInteriorImages}
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
