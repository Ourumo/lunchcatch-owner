import { Link } from 'react-router';

import type { Campaign } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';
import {
  formatShortDate,
  getCampaignTitle,
} from '@owner/components/campaignFormat';
import { CurrentCampaignCard } from '@owner/components/CurrentCampaignCard/CurrentCampaignCard';

const NEW_CAMPAIGN_PATH = '/campaigns/new';

const isCurrent = ({ status }: Campaign) =>
  status === 'ACTIVE' || status === 'PAUSED';

// 진행 중 캠페인이 없을 때 안내할 다음 캠페인. 시작 대기가 있으면 가장 먼저 시작하는 것을,
// 없으면 가장 최근에 만든 작성 중 캠페인을 고른다 (목록은 등록 시각 최신순으로 온다)
const getNextCampaign = (campaigns: Campaign[]) => {
  const scheduled = campaigns
    .filter(({ status }) => status === 'SCHEDULED')
    .sort((a, b) => a.budget.startDate.localeCompare(b.budget.startDate));

  return scheduled[0] ?? campaigns.find(({ status }) => status === 'DRAFT');
};

interface NoCurrentNoticeProps {
  title: string;
  description: string;
  action: { label: string; to: string; isPrimary?: boolean };
}

// 브랜드 컬러는 캠페인 만들기에만 쓰고, 다른 안내는 중립색으로 둔다
const NoCurrentNotice = ({
  action,
  description,
  title,
}: NoCurrentNoticeProps) => (
  <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border-subtle bg-bg-surface px-4 py-6 text-center">
    <p className="text-body-mobile font-bold break-keep text-text-primary">
      {title}
    </p>
    <p className="text-caption-mobile break-keep text-text-secondary">
      {description}
    </p>
    <Link
      className={[
        'mt-3 flex h-10 items-center rounded-full px-4 text-body-sm-mobile font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
        action.isPrimary
          ? 'bg-action-primary text-text-inverse hover:bg-action-primary-hover'
          : 'border border-border-subtle bg-bg-surface text-text-primary hover:bg-surface-subtle',
      ].join(' ')}
      to={action.to}
    >
      {action.label}
    </Link>
  </div>
);

const getNoCurrentNotice = (next?: Campaign): NoCurrentNoticeProps => {
  if (next?.status === 'SCHEDULED') {
    return {
      title: `다음 캠페인이 ${formatShortDate(next.budget.startDate)}에 시작돼요`,
      description: '시작일 00:00부터 점심 손님에게 노출돼요.',
      action: { label: '캠페인 보기', to: `/campaigns/${next.id}` },
    };
  }

  if (next?.status === 'DRAFT') {
    return {
      title: '작성 중인 캠페인이 있어요',
      description:
        next.reviewFailReasons.length > 0
          ? '자동 검수를 통과하지 못했어요. 포스터를 고친 뒤 다시 활성화를 요청해 주세요.'
          : '남은 단계를 마치고 활성화를 요청하면 시작 대기 상태가 돼요.',
      // 등록 화면은 저장된 입력값을 불러와 첫 단계부터 보여준다
      action: { label: '이어서 작성하기', to: `/campaigns/${next.id}/edit` },
    };
  }

  return {
    title: '진행 중인 캠페인이 없어요',
    description: '새 캠페인을 만들어 주변 직장인에게 가게를 알려 보세요.',
    action: { label: '캠페인 만들기', to: NEW_CAMPAIGN_PATH, isPrimary: true },
  };
};

export interface HomeCampaignSectionProps {
  campaigns: Campaign[];
  menus: StoreMenu[];
}

// 진행 중인 캠페인. 카드를 누르면 상세로 가고, 전체 목록은 가운데 캠페인 탭으로 가므로 "전체 보기"는 두지 않는다
export const HomeCampaignSection = ({
  campaigns,
  menus,
}: HomeCampaignSectionProps) => {
  const current = campaigns.find(isCurrent);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-body-mobile font-bold text-text-primary">
        진행 중인 캠페인
      </h2>
      {current ? (
        <CurrentCampaignCard
          campaign={current}
          title={getCampaignTitle(current.coupon, menus)}
        />
      ) : (
        <NoCurrentNotice {...getNoCurrentNotice(getNextCampaign(campaigns))} />
      )}
    </section>
  );
};
