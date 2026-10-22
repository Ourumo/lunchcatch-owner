import type { CampaignValues } from '@owner/api/campaign';

// 등록 중 포인트를 충전하러 결제 화면으로 갈 때 작성 중인 값을 잠시 저장해 둔다.
// 결제창이 페이지를 옮기면 앱을 처음부터 다시 그려, 아직 저장하지 않은 단계(예: 하루 예산)의 입력값이 사라지기 때문이다.
// 상태 관리 라이브러리를 쓰지 않는 규칙에 따라 sessionStorage에 두고, 같은 캠페인을 다시 불러올 때 한 번만 꺼낸다

const STORAGE_KEY = 'owner:campaign-form-draft';

// 결제는 결제 요청 뒤 10분 안에 승인해야 하므로, 이보다 오래 지난 값은 충전과 상관없이 남은 값으로 보고 쓰지 않는다
const MAX_AGE_MS = 30 * 60 * 1000;

interface StoredDraft {
  campaignId: string;
  values: CampaignValues;
  savedAt: number;
}

export const saveCampaignDraft = (
  campaignId: string,
  values: CampaignValues,
) => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        campaignId,
        values,
        savedAt: Date.now(),
      } satisfies StoredDraft),
    );
  } catch {
    // 저장하지 못하면 돌아왔을 때 서버에 저장된 단계까지의 값으로 이어 쓴다
  }
};

// 같은 캠페인의 값이 있으면 꺼내고 지운다. 다른 캠페인이거나 오래됐으면 지우기만 한다.
// 사생활 보호 모드 등으로 읽지 못하면 서버에 저장된 값을 쓰면 되므로 오류를 넘긴다
export const takeCampaignDraft = (
  campaignId: string,
): CampaignValues | undefined => {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);

    if (!value) {
      return undefined;
    }

    sessionStorage.removeItem(STORAGE_KEY);

    const stored = JSON.parse(value) as StoredDraft;

    return stored.campaignId === campaignId &&
      Date.now() - stored.savedAt <= MAX_AGE_MS
      ? stored.values
      : undefined;
  } catch {
    return undefined;
  }
};
