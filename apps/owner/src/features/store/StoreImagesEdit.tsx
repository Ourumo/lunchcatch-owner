import { MAX_INTERIOR_IMAGES } from '@owner/api/signupFlow';
import { type StoreImagesValues, updateStoreImages } from '@owner/api/store';
import { StoreImagesFields } from '@owner/ui/StoreImagesFields/StoreImagesFields';

import { StoreEditLayout } from './StoreEditLayout';
import { useStoreEdit } from './useStoreEdit';

// 사진 목록을 순서대로 그대로 비교한다. 같은 주소, 같은 파일이면 바뀌지 않은 것으로 본다
const isSameImages = (a: StoreImagesValues, b: StoreImagesValues) =>
  a.logoImage === b.logoImage &&
  a.interiorImages.length === b.interiorImages.length &&
  a.interiorImages.every((image, index) => image === b.interiorImages[index]);

const isValidImages = ({ interiorImages, logoImage }: StoreImagesValues) =>
  Boolean(logoImage) && interiorImages.length <= MAX_INTERIOR_IMAGES;

// 가게 관리 > 매장 사진 수정. 대표 이미지(필수 1장)와 매장 이미지(선택, 최대 3장)를 고친다. 입력 화면은 입점 등록과 같은 것을 쓴다
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
  const { setValues, values } = edit;

  return (
    <StoreEditLayout edit={edit} title="매장 사진">
      {values && (
        <div className="px-page pt-6 pb-8">
          <StoreImagesFields
            interiorImages={values.interiorImages}
            logoImage={values.logoImage}
            maxInteriorImages={MAX_INTERIOR_IMAGES}
            onInteriorImagesChange={(interiorImages) =>
              setValues({ ...values, interiorImages })
            }
            onLogoSelect={(logoImage) => setValues({ ...values, logoImage })}
          />
        </div>
      )}
    </StoreEditLayout>
  );
};
