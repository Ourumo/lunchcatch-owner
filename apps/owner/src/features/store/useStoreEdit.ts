import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';

import { getMyStore, type MyStore } from '@owner/api/store';
import type { ApiResult } from '@owner/api/types';
import { useGoBack } from '@owner/hooks/useGoBack';

import { STORE_PATH } from './storePaths';

const DEFAULT_SAVE_ERROR_MESSAGE =
  '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

type StoreLoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; store: MyStore };

export interface UseStoreEditOptions<T> {
  // 가게 정보에서 이 화면이 고치는 값을 꺼낸다
  select: (store: MyStore) => T;
  // 처음 값과 지금 값이 같으면 저장할 게 없다
  isEqual: (a: T, b: T) => boolean;
  isValid: (values: T) => boolean;
  save: (values: T) => Promise<ApiResult<unknown>>;
}

// 영업시간 수정 화면의 상태.
// 가게 정보를 불러와 처음 값과 지금 값을 비교하고, 저장하면 가게 관리로 돌아간다.
// 바꾼 채로 나가려 하면 상단 뒤로 가기든 브라우저 뒤로 가기든 막고 확인을 받는다
export const useStoreEdit = <T>({
  isEqual,
  isValid,
  save,
  select,
}: UseStoreEditOptions<T>) => {
  const goBack = useGoBack(STORE_PATH);
  const [state, setState] = useState<StoreLoadState>({ status: 'loading' });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);
  // 고치기 전이면 undefined. 그동안은 불러온 값을 그대로 보여준다
  const [draft, setDraft] = useState<T>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  // 저장에 성공해 돌아갈 때는 나가기 확인을 띄우지 않는다
  const isLeavingRef = useRef(false);

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore) {
        setState(
          result.ok
            ? { status: 'success', store: result.data }
            : { status: 'error' },
        );
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [requestId]);

  const initialValues =
    state.status === 'success' ? select(state.store) : undefined;
  const values = draft ?? initialValues;
  const isDirty =
    initialValues !== undefined &&
    values !== undefined &&
    !isEqual(initialValues, values);
  const canSave = isDirty && values !== undefined && isValid(values);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isLeavingRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  const setValues = (nextValues: T) => {
    setDraft(nextValues);
    setSaveError(undefined);
  };

  const handleSave = async () => {
    if (!canSave || isSaving || values === undefined) {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    const result = await save(values);

    if (!result.ok) {
      setIsSaving(false);
      setSaveError(result.message ?? DEFAULT_SAVE_ERROR_MESSAGE);
      return;
    }

    isLeavingRef.current = true;
    goBack();
  };

  return {
    blocker,
    canSave,
    goBack,
    handleSave,
    isSaving,
    retry,
    saveError,
    setValues,
    status: state.status,
    values,
  };
};

export type StoreEdit<T> = ReturnType<typeof useStoreEdit<T>>;
