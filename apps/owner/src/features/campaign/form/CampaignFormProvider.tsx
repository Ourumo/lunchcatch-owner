import { type ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button } from '@repo/ui';

import {
  type Campaign,
  type CampaignStatus,
  type CampaignValues,
  createInitialCampaignValues,
  getCampaign,
} from '@owner/api/campaign';
import {
  getPlatformSettings,
  type PlatformSettings,
} from '@owner/api/platform';
import { getCampaignPoster } from '@owner/api/poster';
import type { ApiResult } from '@owner/api/types';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { takeCampaignDraft } from './campaignDraftStorage';
import {
  CampaignFormContext,
  type CampaignFormContextValue,
} from './campaignFormContext';
import { NEW_CAMPAIGN_ID } from './campaignSteps';

const LIST_PATH = '/campaigns';

// 새 캠페인은 1단계를 처음 저장할 때 서버가 DRAFT를 만들므로, 그 전까지는 기본값으로 쓴다.
// 이어서 쓰는 캠페인은 저장된 포스터를 함께 받아 2단계를 채운다. 캠페인 조회는 포스터를 주지 않는다.
// 포스터를 받지 못하면 빈 포스터 위에 덮어쓰지 않도록 불러오기 실패로 본다.
// 작성 중이 아니면 상세로 보내므로 포스터 결과는 보지 않는다
const loadCampaign = async (
  campaignId: string,
): Promise<ApiResult<Pick<Campaign, keyof CampaignValues | 'status'>>> => {
  if (campaignId === NEW_CAMPAIGN_ID) {
    return {
      ok: true,
      data: { ...createInitialCampaignValues(), status: 'DRAFT' },
    };
  }

  const [campaignResult, posterResult] = await Promise.all([
    getCampaign(campaignId),
    getCampaignPoster(campaignId),
  ]);

  if (!campaignResult.ok || campaignResult.data.status !== 'DRAFT') {
    return campaignResult;
  }

  if (!posterResult.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    data: { ...campaignResult.data, poster: posterResult.data?.poster ?? null },
  };
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'loaded';
      campaignStatus: CampaignStatus;
      platformSettings: PlatformSettings;
    };

interface CampaignFormProviderProps {
  campaignId: string;
  children: ReactNode;
}

// 서버에 저장된 DRAFT와 플랫폼 설정값을 불러와 등록 단계의 입력값을 한곳에 모은다.
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

    Promise.all([loadCampaign(campaignId), getPlatformSettings()]).then(
      ([campaignResult, settingsResult]) => {
        if (ignore) {
          return;
        }

        if (!campaignResult.ok) {
          setLoadState({ status: 'error', message: campaignResult.message });
          return;
        }

        // 최소 하루 예산 없이는 4단계 진행 여부를 판단할 수 없으므로 함께 실패로 본다
        if (!settingsResult.ok) {
          setLoadState({ status: 'error', message: settingsResult.message });
          return;
        }

        const { budget, coupon, poster, status, target } = campaignResult.data;
        // 충전하러 결제 화면에 다녀왔으면 떠나기 전에 작성 중이던 값으로 이어 쓴다 (campaignDraftStorage)
        setValues(
          takeCampaignDraft(campaignId) ?? { budget, coupon, poster, target },
        );
        setLoadState({
          status: 'loaded',
          campaignStatus: status,
          platformSettings: settingsResult.data,
        });
      },
    );

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignId, requestId]);

  const retry = () => {
    setLoadState({ status: 'loading' });
    setRequestId((value) => value + 1);
  };

  const reload = () => setRequestId((value) => value + 1);

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
      setValues((prev) =>
        prev
          ? {
              ...prev,
              poster:
                typeof poster === 'function' ? poster(prev.poster) : poster,
            }
          : prev,
      );
    };

    return (
      <CampaignFormContext
        value={{
          campaignId,
          platformSettings: loadState.platformSettings,
          reload,
          setPoster,
          updateStepValues,
          values,
        }}
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
            <SkeletonBlock height={height} key={index} />
          ))}
        </main>
      )}
    </>
  );
};
