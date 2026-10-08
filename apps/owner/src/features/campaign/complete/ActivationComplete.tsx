import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarCheck } from 'lucide-react';

import { type Campaign, getCampaign } from '@owner/api/campaign';
import { getMyStore, type StoreMenu } from '@owner/api/store';
import {
  formatPeriod,
  formatShortDate,
  getCampaignTitle,
  getDaysFromToday,
} from '@owner/components/campaignFormat';
import type { GoBackState } from '@owner/hooks/useGoBack';

export interface ActivationCompleteProps {
  campaignId: string;
}

// 활성화 요청이 자동 검수를 통과해 시작 대기(SCHEDULED)가 된 뒤의 안내 화면
export const ActivationComplete = ({ campaignId }: ActivationCompleteProps) => {
  const [campaign, setCampaign] = useState<Campaign>();
  const [menus, setMenus] = useState<StoreMenu[]>([]);

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaign(campaignId), getMyStore()]).then(
      ([campaignResult, storeResult]) => {
        if (ignore) {
          return;
        }

        if (campaignResult.ok) {
          setCampaign(campaignResult.data);
        }

        if (storeResult.ok) {
          setMenus(storeResult.data.menus);
        }
      },
    );

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  const startDate = campaign?.budget.startDate;
  const daysUntilStart = startDate ? getDaysFromToday(startDate) : 0;

  return (
    <main className="flex flex-1 flex-col px-page pt-16 pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-surface-brand">
          <CalendarCheck
            aria-hidden="true"
            className="size-9 text-action-primary"
          />
        </span>
        <h1 className="mt-5 text-h1 font-bold text-text-primary">
          활성화 요청을 마쳤어요
        </h1>
        <p className="mt-2 text-body-sm-mobile break-keep text-text-secondary">
          자동 검수를 통과해 시작을 기다리고 있어요.
        </p>

        {campaign && startDate && (
          <dl className="mt-8 flex w-full flex-col gap-2.5 rounded-xl border border-border-subtle bg-bg-surface p-4 text-left text-body-sm-mobile">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">캠페인</dt>
              <dd className="font-medium text-text-primary">
                {getCampaignTitle(campaign.coupon, menus)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">집행 기간</dt>
              <dd className="font-medium text-text-primary">
                {formatPeriod(startDate, campaign.budget.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">노출 시작</dt>
              <dd className="font-bold text-text-brand">
                {formatShortDate(startDate)} 00:00
                {daysUntilStart > 0 && ` (${daysUntilStart}일 뒤)`}
              </dd>
            </div>
          </dl>
        )}

        <p className="mt-4 text-caption-mobile break-keep text-text-secondary">
          시작일 00:00에 잔액에서 그날 쓸 포인트를 예약해요. 잔액이 모자라면
          노출이 멈출 수 있으니 미리 충전해 두세요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          className="flex h-12 items-center justify-center rounded-md bg-action-primary text-body-sm-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          replace
          // 등록 단계 기록이 남아 있어 상세에서 뒤로 가면 목록으로 가게 한다
          state={{ backTo: '/campaigns' } satisfies GoBackState}
          to={`/campaigns/${campaignId}`}
        >
          캠페인 상세 보기
        </Link>
        <Link
          className="flex h-12 items-center justify-center rounded-md text-body-sm-mobile font-medium text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          replace
          to="/campaigns"
        >
          캠페인 목록으로
        </Link>
      </div>
    </main>
  );
};
