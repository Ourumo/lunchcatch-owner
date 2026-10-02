import { type ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button } from '@repo/ui';

import {
  type CampaignStatus,
  type CampaignValues,
  getCampaign,
} from '@owner/api/campaign';
import { TopBar } from '@owner/components/TopBar/TopBar';

import {
  CampaignFormContext,
  type CampaignFormContextValue,
} from './campaignFormContext';

const LIST_PATH = '/campaigns';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'loaded'; campaignStatus: CampaignStatus };

interface CampaignFormProviderProps {
  campaignId: string;
  children: ReactNode;
}

// 서버에 저장된 DRAFT를 불러와 등록 단계의 입력값을 한곳에 모은다.
// 단계를 오가도 값이 유지되고, 새로고침하거나 목록에서 다시 들어와도 저장된 단계부터 이어서 쓸 수 있다
export const CampaignFormProvider = ({
  campaignId,
  children,
}: CampaignFormProviderProps) => {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [values, setValues] = useState<CampaignValues | null>(null);
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getCampaign(campaignId).then((result) => {
      if (ignore) {
        return;
      }

      if (!result.ok) {
        setLoadState({ status: 'error', message: result.message });
        return;
      }

      const { budget, coupon, poster, status, target } = result.data;
      setValues({ budget, coupon, poster, target });
      setLoadState({ status: 'loaded', campaignStatus: status });
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignId, requestId]);

  const retry = () => {
    setLoadState({ status: 'loading' });
    setRequestId((value) => value + 1);
  };

  if (loadState.status === 'loaded' && values) {
    // 작성 중인 캠페인만 수정할 수 있으므로 다른 상태면 상세 화면으로 보낸다
    if (loadState.campaignStatus !== 'DRAFT') {
      return <Navigate replace to={`${LIST_PATH}/${campaignId}`} />;
    }

    const updateStepValues: CampaignFormContextValue['updateStepValues'] = (
      stepKey,
      patch,
    ) => {
      setValues((prev) =>
        prev ? { ...prev, [stepKey]: { ...prev[stepKey], ...patch } } : prev,
      );
    };

    const setPoster: CampaignFormContextValue['setPoster'] = (poster) => {
      setValues((prev) => (prev ? { ...prev, poster } : prev));
    };

    return (
      <CampaignFormContext
        value={{ campaignId, setPoster, updateStepValues, values }}
      >
        {children}
      </CampaignFormContext>
    );
  }

  return (
    <>
      <TopBar onBack={() => navigate(LIST_PATH)} title="캠페인 만들기" />
      {loadState.status === 'error' ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
          <p className="text-body-mobile font-bold text-text-primary">
            작성 중인 캠페인을 불러오지 못했어요
          </p>
          <p className="text-body-sm-mobile text-text-secondary">
            {loadState.message ?? '잠시 후 다시 시도해 주세요.'}
          </p>
          <div className="mt-2 flex gap-2">
            <Button onClick={retry} variant="secondary">
              다시 시도
            </Button>
            <Link
              className="inline-flex min-h-10 items-center rounded-md px-4 text-body-sm-mobile font-medium text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              to={LIST_PATH}
            >
              목록으로
            </Link>
          </div>
        </main>
      ) : (
        <main
          aria-busy="true"
          className="flex flex-1 flex-col gap-3 px-page pt-5"
        >
          <span className="sr-only">작성 중인 캠페인을 불러오는 중</span>
          {[48, 120, 120].map((height, index) => (
            <div
              aria-hidden="true"
              className="animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
              key={index}
              style={{ height }}
            />
          ))}
        </main>
      )}
    </>
  );
};
