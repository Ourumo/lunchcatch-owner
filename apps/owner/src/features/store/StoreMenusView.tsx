import { ImageOff } from 'lucide-react';

import { MAX_MENUS } from '@owner/api/signupFlow';
import type { StoreMenu } from '@owner/api/store';

import { StoreViewLayout } from './StoreViewLayout';
import { useStoreView } from './useStoreView';

const MenuItem = ({ description, imageUrl, name, price }: StoreMenu) => (
  <li className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-3">
    {imageUrl ? (
      <img
        alt=""
        className="size-18 shrink-0 rounded-lg object-cover"
        src={imageUrl}
      />
    ) : (
      <span
        aria-hidden="true"
        className="flex size-18 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-disabled"
      >
        <ImageOff className="size-6" />
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-body-mobile font-semibold break-keep text-text-primary">
        {name}
      </p>
      <p className="mt-0.5 text-body-sm-mobile text-text-secondary">
        {price.toLocaleString('ko-KR')}원
      </p>
      {/* 고치는 시트가 없어 긴 설명도 목록에서 모두 보여준다 */}
      {description && (
        <p className="mt-0.5 text-caption-mobile break-keep text-text-secondary">
          {description}
        </p>
      )}
    </div>
  </li>
);

// 가게 관리 > 대표 메뉴. 입점 신청 때 등록한 대표 메뉴(선택, 최대 3개)를 보여주기만 한다
export const StoreMenusView = () => {
  const view = useStoreView();

  return (
    <StoreViewLayout title="대표 메뉴" view={view}>
      {({ menus }) => (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-caption-web font-medium text-text-primary">
              대표 메뉴
            </h2>
            <span className="text-caption-mobile text-text-secondary">
              {menus.length}/{MAX_MENUS}
            </span>
          </div>
          {menus.length > 0 ? (
            <ul aria-label="대표 메뉴" className="flex flex-col gap-3">
              {menus.map((menu) => (
                <MenuItem key={menu.id} {...menu} />
              ))}
            </ul>
          ) : (
            <p className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-subtle px-4 text-center text-body-sm-mobile break-keep text-text-secondary">
              등록한 대표 메뉴가 없어요
            </p>
          )}
        </section>
      )}
    </StoreViewLayout>
  );
};
