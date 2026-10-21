import {
  type ImageValue,
  isImageUploading,
  type UploadableImage,
  uploadImage,
} from '@owner/api/imageUpload';
import { MAX_INTERIOR_IMAGES } from '@owner/api/signupFlow';
import {
  confirmStoreImageUpload,
  prepareStoreImageUpload,
  STORE_IMAGE_LIMIT_CODE,
} from '@owner/api/storeImages';
import { StoreImagesFields } from '@owner/ui/StoreImagesFields/StoreImagesFields';

import { useSignupFlow } from '../useSignupFlow';

const STORE_IMAGE_LIMIT_MESSAGE =
  '사진을 더 올릴 수 없어요. 잠시 후 다시 시도해 주세요.';

// 대표 이미지(필수 1장)와 매장 이미지(선택, 최대 3장) 등록.
// 매장 사진은 고르자마자 올리고 업로드 확인까지 해 바로 가게에 붙인다 ("다음"에서는 올리지 않는다)
export const ImagesStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { interiorImages, logoImage } = values.images;
  const isInteriorUploading = interiorImages.some(isImageUploading);
  const isInteriorLimited = interiorImages.some(
    (image) =>
      image.status === 'failed' && image.code === STORE_IMAGE_LIMIT_CODE,
  );

  // 그 파일의 칸만 바꾼다. 올리는 동안 다른 칸도 바뀌므로 그때의 최신 값에서 고르고,
  // 다시 불러오기로 칸이 없어졌으면 아무것도 바꾸지 않는다
  const replaceInteriorImage = (file: File, nextImage: ImageValue) =>
    updateStepValues('images', ({ interiorImages: currentImages }) => ({
      interiorImages: currentImages.map((image) =>
        image.status !== 'saved' && image.file === file ? nextImage : image,
      ),
    }));

  // 서버가 업로드 주소를 발급한 순서대로 매장 사진 자리를 잡으므로 한 장씩 차례로 올린다.
  // 올리는 중에는 추가와 다시 시도를 막아 한 번에 하나만 돈다. 앞 단계로 가도 끝까지 올린다
  const uploadInteriorImages = async (images: UploadableImage[]) => {
    for (const image of images) {
      const { file } = image;

      replaceInteriorImage(file, { status: 'uploading', file, progress: 0 });

      const uploadedImage = await uploadImage(image, {
        prepare: (request) => prepareStoreImageUpload('INTERIOR', request),
        confirm: confirmStoreImageUpload,
        onProgress: (progress) =>
          replaceInteriorImage(file, { status: 'uploading', file, progress }),
      });

      replaceInteriorImage(file, uploadedImage);
    }
  };

  // 새로 고른 사진은 뒤에 selected로 붙어 온다. 실패한 칸을 뺄 때도 불린다
  const handleInteriorImagesChange = (images: ImageValue[]) => {
    const addedImages = images.filter(
      (image): image is UploadableImage =>
        image.status === 'selected' && !interiorImages.includes(image),
    );

    updateStepValues('images', { interiorImages: images });
    void uploadInteriorImages(addedImages);
  };

  const handleRetry = (image: ImageValue) => {
    if (image.status === 'failed' && interiorImages.includes(image)) {
      void uploadInteriorImages([image]);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님이 가게를 찾을 때 보여지는 사진이에요. 맛있고 깔끔한 첫인상을 위해
        밝고 선명한 사진을 골라주세요.
      </p>
      <StoreImagesFields
        interiorDisabled={isInteriorUploading}
        interiorErrorMessage={
          isInteriorLimited ? STORE_IMAGE_LIMIT_MESSAGE : undefined
        }
        interiorImages={interiorImages}
        logoImage={logoImage}
        maxInteriorImages={MAX_INTERIOR_IMAGES}
        onInteriorImagesChange={handleInteriorImagesChange}
        onLogoRemove={() => updateStepValues('images', { logoImage: null })}
        onLogoSelect={(image) =>
          updateStepValues('images', { logoImage: image })
        }
        onRetry={handleRetry}
      />
    </div>
  );
};
