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
  STORE_IMAGE_SUPERSEDED_CODE,
  type StoreImageType,
} from '@owner/api/storeImages';
import { StoreImagesFields } from '@owner/ui/StoreImagesFields/StoreImagesFields';

import { useSignupFlow } from '../useSignupFlow';

const STORE_IMAGE_LIMIT_MESSAGE =
  '사진을 더 올릴 수 없어요. 잠시 후 다시 시도해 주세요.';
// 업로드 주소를 받는 순간 서버가 기존 대표 이미지를 빼므로, 바꾸다 실패하면 가게에 대표 이미지가 없다.
// 주소를 받기 전에 실패했어도 다시 올려야 다음으로 넘어가므로 같은 안내를 쓴다
const LOGO_FAILED_MESSAGE = '대표 이미지가 비었어요. 다시 올려 주세요.';

// 그 파일의 칸인지. 이미 가게에 붙어 있던 사진(saved)은 파일이 없어 고른 사진이 아니다
const isImageOf = (image: ImageValue | null, file: File) =>
  image !== null && image.status !== 'saved' && image.file === file;

// 대표 이미지(필수 1장)와 매장 이미지(선택, 최대 3장) 등록.
// 사진은 고르자마자 올리고 업로드 확인까지 해 바로 가게에 붙인다 ("다음"에서는 올리지 않는다)
export const ImagesStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { interiorImages, logoImage } = values.images;
  const isInteriorUploading = interiorImages.some(isImageUploading);
  const isInteriorLimited = interiorImages.some(
    (image) =>
      image.status === 'failed' && image.code === STORE_IMAGE_LIMIT_CODE,
  );

  // 그 파일의 칸만 바꾼다. 올리는 동안 다른 칸도 바뀌므로 그때의 최신 값에서 고르고,
  // 다른 사진으로 바꿨거나 다시 불러오기로 칸이 없어졌으면 아무것도 바꾸지 않는다
  const replaceInteriorImage = (file: File, nextImage: ImageValue) =>
    updateStepValues('images', ({ interiorImages: currentImages }) => ({
      interiorImages: currentImages.map((image) =>
        isImageOf(image, file) ? nextImage : image,
      ),
    }));

  const replaceLogoImage = (file: File, nextImage: ImageValue) =>
    updateStepValues('images', ({ logoImage: currentImage }) =>
      isImageOf(currentImage, file) ? { logoImage: nextImage } : {},
    );

  const uploadStoreImage = async (
    imageType: StoreImageType,
    image: UploadableImage,
    replace: (file: File, nextImage: ImageValue) => void,
  ) => {
    const { file } = image;

    replace(file, { status: 'uploading', file, progress: 0 });

    const uploadedImage = await uploadImage(image, {
      prepare: (request) => prepareStoreImageUpload(imageType, request),
      confirm: confirmStoreImageUpload,
      onProgress: (progress) =>
        replace(file, { status: 'uploading', file, progress }),
    });

    replace(file, uploadedImage);
  };

  // 서버가 업로드 주소를 발급한 순서대로 매장 사진 자리를 잡으므로 한 장씩 차례로 올린다.
  // 올리는 중에는 추가와 다시 시도를 막아 한 번에 하나만 돈다. 앞 단계로 가도 끝까지 올린다
  const uploadInteriorImages = async (images: UploadableImage[]) => {
    for (const image of images) {
      await uploadStoreImage('INTERIOR', image, replaceInteriorImage);
    }
  };

  // 대표 이미지는 다시 올리면 바뀌어 올리는 중에도 다른 사진을 고를 수 있다.
  // 먼저 올리던 사진은 칸에서 빠져 결과를 반영하지 않고, 서버도 마지막 업로드만 확인해 준다
  const uploadLogoImage = (image: UploadableImage) =>
    uploadStoreImage('LOGO', image, replaceLogoImage);

  // 새로 고른 사진은 뒤에 selected로 붙어 온다. 실패한 칸을 뺄 때도 불린다
  const handleInteriorImagesChange = (images: ImageValue[]) => {
    const addedImages = images.filter(
      (image): image is UploadableImage =>
        image.status === 'selected' && !interiorImages.includes(image),
    );

    updateStepValues('images', { interiorImages: images });
    void uploadInteriorImages(addedImages);
  };

  const handleLogoSelect = (image: ImageValue) => {
    if (image.status !== 'selected') {
      return;
    }

    updateStepValues('images', { logoImage: image });
    void uploadLogoImage(image);
  };

  const handleRetry = (image: ImageValue) => {
    if (image.status !== 'failed') {
      return;
    }

    if (image === logoImage) {
      // 다른 곳에서 더 나중에 받은 업로드가 있으면 이 업로드는 확인할 수 없어 주소부터 새로 받는다
      void uploadLogoImage(
        image.code === STORE_IMAGE_SUPERSEDED_CODE
          ? { ...image, upload: undefined }
          : image,
      );
      return;
    }

    if (interiorImages.includes(image)) {
      void uploadInteriorImages([image]);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님이 가게를 찾을 때 보여지는 사진이에요. 맛있고 깔끔한 첫인상을 위해
        밝고 선명한 사진을 골라주세요.
      </p>
      {/* 대표 이미지는 필수 1장이라 지우지 않고, 눌러서 다른 사진으로 바꾸기만 한다 */}
      <StoreImagesFields
        interiorDisabled={isInteriorUploading}
        interiorErrorMessage={
          isInteriorLimited ? STORE_IMAGE_LIMIT_MESSAGE : undefined
        }
        interiorImages={interiorImages}
        logoErrorMessage={
          logoImage?.status === 'failed' ? LOGO_FAILED_MESSAGE : undefined
        }
        logoImage={logoImage}
        maxInteriorImages={MAX_INTERIOR_IMAGES}
        onInteriorImagesChange={handleInteriorImagesChange}
        onLogoSelect={handleLogoSelect}
        onRetry={handleRetry}
      />
    </div>
  );
};
