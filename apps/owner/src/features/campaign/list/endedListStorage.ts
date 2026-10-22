import type { Campaign } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';

// 지난 캠페인 전체 목록을 상세에 갔다가 뒤로 돌아왔을 때 그대로 복원하려고 저장해 두는 값.
// 상태 관리 라이브러리를 쓰지 않는 규칙에 따라 sessionStorage에 두고, 기록 항목(location.key)이 같을 때만 꺼낸다.
// 캠페인 탭의 "전체 보기"로 새로 들어오면 새 기록 항목이라 처음부터 불러온다.
// 쌓이지 않도록 마지막으로 본 목록 하나만 둔다

const LIST_STORAGE_KEY = 'owner:ended-campaigns';
const SCROLL_STORAGE_KEY = 'owner:ended-campaigns:scroll';

// 오래 지난 목록은 그사이 캠페인이 종료됐을 수 있어 복원하지 않는다
const MAX_AGE_MS = 30 * 60 * 1000;

export interface EndedListSnapshot {
  campaigns: Campaign[];
  menus: StoreMenu[];
  nextCursor: string | null;
}

interface StoredList extends EndedListSnapshot {
  historyKey: string;
  savedAt: number;
}

interface StoredScroll {
  historyKey: string;
  y: number;
}

// 사생활 보호 모드나 저장 공간 부족으로 읽고 쓰지 못해도 목록은 처음부터 불러오면 되므로 오류를 넘긴다
const readJson = <T>(key: string): T | null => {
  try {
    const value = sessionStorage.getItem(key);

    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장하지 못하면 돌아왔을 때 처음부터 불러온다
  }
};

export const readEndedList = (historyKey: string): EndedListSnapshot | null => {
  const stored = readJson<StoredList>(LIST_STORAGE_KEY);

  if (
    !stored ||
    stored.historyKey !== historyKey ||
    Date.now() - stored.savedAt > MAX_AGE_MS
  ) {
    return null;
  }

  const { campaigns, menus, nextCursor } = stored;

  return { campaigns, menus, nextCursor };
};

export const saveEndedList = (
  historyKey: string,
  snapshot: EndedListSnapshot,
) => {
  writeJson(LIST_STORAGE_KEY, {
    ...snapshot,
    historyKey,
    savedAt: Date.now(),
  } satisfies StoredList);
};

export const readEndedListScroll = (historyKey: string) => {
  const stored = readJson<StoredScroll>(SCROLL_STORAGE_KEY);

  return stored?.historyKey === historyKey ? stored.y : null;
};

export const saveEndedListScroll = (historyKey: string, y: number) => {
  writeJson(SCROLL_STORAGE_KEY, { historyKey, y } satisfies StoredScroll);
};
