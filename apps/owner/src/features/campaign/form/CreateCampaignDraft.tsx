import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@repo/ui';

import {
  getCampaigns,
  isUpcomingCampaign,
  MAX_UPCOMING_CAMPAIGNS,
} from '@owner/api/campaign';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import {
  campaignSteps,
  getCampaignEditPath,
  NEW_CAMPAIGN_ID,
} from './campaignSteps';

const LIST_PATH = '/campaigns';

interface CreateFailure {
  message?: string;
  // 준비 중 캠페인 제한에 걸렸는지. 다시 시도해도 같은 결과라 목록으로만 안내한다
  isLimited: boolean;
}

const RETRY_MESSAGE = '잠시 후 다시 시도해 주세요.';
const UPCOMING_LIMIT_MESSAGE =
  '다음 캠페인은 1개만 준비할 수 있습니다. 시작 대기인 캠페인을 정리한 뒤 만들어 주세요.';

// 새 캠페인 등록을 시작하면 준비 중 캠페인을 먼저 확인하고 첫 단계로 이동한다.
// 서버는 1단계를 저장할 때 그 가게의 DRAFT가 있으면 쿠폰 조건을 덮어쓰므로, 작성 중인 DRAFT가 있으면 그 DRAFT를 이어서 쓴다.
// 시작 대기 캠페인이 있으면 준비 중 캠페인 제한(MAX_UPCOMING_CAMPAIGNS)을 이 화면에서 안내한다
export const CreateCampaignDraft = () => {
  const navigate = useNavigate();
  const [failure, setFailure] = useState<CreateFailure>();
  // 개발 모드(StrictMode)에서 effect가 두 번 실행돼도 한 번만 확인한다
  const isRequestedRef = useRef(false);

  const create = () => {
    setFailure(undefined);
    getCampaigns().then((result) => {
      if (!result.ok) {
        setFailure({ message: result.message, isLimited: false });
        return;
      }

      const draft = result.data.find(({ status }) => status === 'DRAFT');

      if (
        !draft &&
        result.data.filter(isUpcomingCampaign).length >= MAX_UPCOMING_CAMPAIGNS
      ) {
        setFailure({ message: UPCOMING_LIMIT_MESSAGE, isLimited: true });
        return;
      }

      // 뒤로 가기로 이 화면에 돌아와 다시 확인하지 않게 기록을 바꿔치기한다
      navigate(
        getCampaignEditPath(draft?.id ?? NEW_CAMPAIGN_ID, campaignSteps[0]),
        { replace: true },
      );
    });
  };

  useEffect(() => {
    if (isRequestedRef.current) {
      return;
    }

    isRequestedRef.current = true;
    create();
  });

  return (
    <>
      <TopBar onBack={() => navigate(LIST_PATH)} title="캠페인 만들기" />
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
        {failure ? (
          <>
            <p className="text-body-mobile font-bold text-text-primary">
              {failure.isLimited
                ? '이미 준비 중인 캠페인이 있어요'
                : '캠페인 작성을 시작하지 못했어요'}
            </p>
            <p className="text-body-sm-mobile break-keep text-text-secondary">
              {failure.message ?? RETRY_MESSAGE}
            </p>
            {failure.isLimited ? (
              <Link
                className="mt-2 inline-flex h-11 items-center rounded-md bg-action-primary px-5 text-body-sm-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                to={LIST_PATH}
              >
                캠페인 목록으로
              </Link>
            ) : (
              <div className="mt-2 flex gap-2">
                <Button onClick={create} variant="secondary">
                  다시 시도
                </Button>
                <Link
                  className="inline-flex min-h-10 items-center rounded-md px-4 text-body-sm-mobile font-medium text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                  to={LIST_PATH}
                >
                  목록으로
                </Link>
              </div>
            )}
          </>
        ) : (
          <p
            aria-busy="true"
            className="text-body-sm-mobile text-text-secondary"
          >
            새 캠페인을 준비하고 있어요
          </p>
        )}
      </main>
    </>
  );
};
