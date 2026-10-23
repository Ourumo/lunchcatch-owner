import { useEffect, useState } from 'react';

import { type Campaign, getCampaign } from '@owner/api/campaign';
import { getCampaignPoster } from '@owner/api/poster';
import { getMyStore, type StoreMenu } from '@owner/api/store';

type CampaignDetailState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'success';
      campaign: Campaign;
      menus: StoreMenu[];
      // 서버가 만든 완성 포스터 HTML. 아직 만들지 않았으면 'none', 불러오지 못했으면 null
      posterHtml: string | 'none' | null;
    };

// 캠페인과 함께, 메뉴 이름에 필요한 가게 메뉴와 서버가 만든 포스터를 불러온다.
// 메뉴나 포스터를 못 받아도 캠페인 내용은 보여줄 수 있으므로 캠페인 조회 실패만 오류로 본다
export const useCampaignDetail = (id: string) => {
  const [state, setState] = useState<CampaignDetailState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaign(id), getMyStore(), getCampaignPoster(id)]).then(
      ([campaignResult, storeResult, posterResult]) => {
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
          posterHtml: posterResult.ok
            ? (posterResult.data?.html ?? 'none')
            : null,
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

  // 중단, 종료처럼 캠페인을 바꾼 뒤 다시 불러온다. 지금 화면을 그대로 둔 채 결과가 오면 바꾼다
  const reload = () => {
    setRequestId((value) => value + 1);
  };

  return { reload, retry, state };
};
