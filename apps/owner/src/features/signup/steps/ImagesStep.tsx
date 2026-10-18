import { MAX_INTERIOR_IMAGES } from '@owner/api/signupFlow';
import { StoreImagesFields } from '@owner/components/StoreImagesFields/StoreImagesFields';

import { useSignupFlow } from '../useSignupFlow';

// 대표 이미지(필수 1장)와 매장 이미지(선택, 최대 3장) 등록
export const ImagesStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { interiorImages, logoImage } = values.images;

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님이 가게를 찾을 때 보여지는 사진이에요. 맛있고 깔끔한 첫인상을 위해
        밝고 선명한 사진을 골라주세요.
      </p>
      <StoreImagesFields
        interiorImages={interiorImages}
        logoImage={logoImage}
        maxInteriorImages={MAX_INTERIOR_IMAGES}
        onInteriorImagesChange={(images) =>
          updateStepValues('images', { interiorImages: images })
        }
        onLogoRemove={() => updateStepValues('images', { logoImage: null })}
        onLogoSelect={(file) => updateStepValues('images', { logoImage: file })}
      />
    </div>
  );
};
