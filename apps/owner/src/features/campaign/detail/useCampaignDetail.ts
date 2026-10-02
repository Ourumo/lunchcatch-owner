import { useEffect, useState } from 'react';

import { type Campaign, getCampaign } from '@owner/api/campaign';
import { getPosterTemplates, type PosterTemplate } from '@owner/api/poster';
import { getMyStore, type StoreMenu } from '@owner/api/store';

type CampaignDetailState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'success';
      campaign: Campaign;
      menus: StoreMenu[];
      templates: PosterTemplate[];
    };

// 캠페인과 함께, 메뉴 이름과 포스터 미리보기에 필요한 가게 메뉴와 템플릿을 불러온다.
// 메뉴나 템플릿을 못 받아도 캠페인 내용은 보여줄 수 있으므로 캠페인 조회 실패만 오류로 본다
export const useCampaignDetail = (id: string) => {
  const [state, setState] = useState<CampaignDetailState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaign(id), getMyStore(), getPosterTemplates()]).then(
      ([campaignResult, storeResult, templatesResult]) => {
        if (ignore) {
          return;
        }

        if (!campaignResult.ok) {
          setState({ status: 'error', message: campaignResult.message });
          return;
        }

        setState({
          status: 'success',
          campaign: campaignResult.data,
          menus: storeResult.ok ? storeResult.data.menus : [],
          templates: templatesResult.ok ? templatesResult.data : [],
        });
      },
    );

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [id, requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((value) => value + 1);
  };

  return { retry, state };
};
