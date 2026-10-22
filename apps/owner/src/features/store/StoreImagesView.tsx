import { MAX_INTERIOR_IMAGES } from '@owner/api/signupFlow';

import { StoreViewLayout } from './StoreViewLayout';
import { useStoreView } from './useStoreView';

const EMPTY_BOX_CLASS_NAME =
  'flex items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-subtle px-4 text-center text-body-sm-mobile break-keep text-text-secondary';

// 가게 관리 > 매장 사진. 입점 신청 때 등록한 대표 이미지(1장)와 매장 이미지(최대 3장)를 보여주기만 한다
export const StoreImagesView = () => {
  const view = useStoreView();

  return (
    <StoreViewLayout title="매장 사진" view={view}>
      {({ interiorImageUrls, logoImageUrl }) => (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-caption-web font-medium text-text-primary">
              대표 이미지
            </h2>
            {logoImageUrl ? (
              <img
                alt="대표 이미지"
                className="aspect-video w-full rounded-xl border border-border-subtle object-cover"
                src={logoImageUrl}
              />
            ) : (
              <p className={`aspect-video ${EMPTY_BOX_CLASS_NAME}`}>
                등록한 대표 이미지가 없어요
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-caption-web font-medium text-text-primary">
                매장 이미지
              </h2>
              <span className="text-caption-mobile text-text-secondary">
                {interiorImageUrls.length}/{MAX_INTERIOR_IMAGES}
              </span>
            </div>
            {interiorImageUrls.length > 0 ? (
              <ul aria-label="매장 이미지" className="grid grid-cols-3 gap-2">
                {interiorImageUrls.map((url, index) => (
                  <li key={url}>
                    <img
                      alt={`매장 이미지 ${index + 1}`}
                      className="aspect-square w-full rounded-xl border border-border-subtle object-cover"
                      src={url}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`h-20 ${EMPTY_BOX_CLASS_NAME}`}>
                등록한 매장 이미지가 없어요
              </p>
            )}
          </section>
        </>
      )}
    </StoreViewLayout>
  );
};
