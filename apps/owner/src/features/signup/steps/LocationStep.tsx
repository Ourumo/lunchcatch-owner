import { type FormEvent, useRef, useState } from 'react';
import { Input } from '@repo/ui';
import { MapPin, RotateCcw, Search } from 'lucide-react';

import { searchStorePlaces, type StorePlace } from '@owner/api/signupFlow';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; places: StorePlace[] }
  | { status: 'error'; message: string };

// 주소나 상호명으로 검색해 가게 위치를 고르면 지도와 주소 칸에 보여준다
export const LocationStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { place } = values.location;
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  // 검색을 연달아 하면 마지막 검색 결과만 보여준다
  const latestSearchId = useRef(0);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    const searchId = ++latestSearchId.current;
    setSearch({ status: 'loading' });
    const result = await searchStorePlaces(query);

    if (searchId !== latestSearchId.current) {
      return;
    }

    setSearch(
      result.ok
        ? { status: 'done', places: result.data }
        : {
            status: 'error',
            message: result.message ?? '검색하지 못했어요. 다시 시도해주세요.',
          },
    );
  };

  const selectPlace = (selected: StorePlace) => {
    updateStepValues('location', { place: selected });
    setSearch({ status: 'idle' });
  };

  // 검색어를 지우고 검색창을 벗어나면 펼쳐 둔 검색 결과를 닫는다
  const handleBlur = () => {
    if (query.trim()) {
      return;
    }

    // 진행 중인 검색이 끝나도 결과를 다시 펼치지 않도록 무효화한다
    latestSearchId.current += 1;
    setSearch({ status: 'idle' });
  };

  return (
    <div className="flex flex-col gap-4 px-page pt-6 pb-8">
      {/* 검색 결과는 검색창 바로 아래에 펼쳐 지도 위에 겹쳐 보여준다 */}
      <div className="relative">
        <form onSubmit={handleSearch} role="search">
          <Input
            aria-label="가게 주소 또는 상호명 검색"
            enterKeyHint="search"
            leadingIcon={<Search className="size-full" strokeWidth={2} />}
            onBlur={handleBlur}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="주소 또는 상호명으로 검색"
            type="search"
            value={query}
          />
        </form>

        {search.status !== 'idle' && (
          <div
            aria-live="polite"
            className="absolute top-full right-0 left-0 z-10 mt-1 max-h-72 overflow-auto rounded-md border border-border-subtle bg-bg-surface shadow-sm"
          >
            {search.status === 'loading' && (
              <p className="px-4 py-3 text-body-sm-mobile text-text-secondary">
                검색 중이에요
              </p>
            )}
            {search.status === 'error' && (
              <p className="px-4 py-3 text-body-sm-mobile text-status-danger-fg">
                {search.message}
              </p>
            )}
            {search.status === 'done' &&
              (search.places.length === 0 ? (
                <p className="px-4 py-3 text-body-sm-mobile text-text-secondary">
                  검색 결과가 없어요. 주소나 상호명을 다시 확인해주세요.
                </p>
              ) : (
                <ul aria-label="검색 결과" className="flex flex-col">
                  {search.places.map((item) => (
                    <li
                      className="border-b border-border-subtle last:border-b-0"
                      key={item.kakaoPlaceId}
                    >
                      <button
                        className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
                        onClick={() => selectPlace(item)}
                        type="button"
                      >
                        <span className="text-body-sm-mobile font-semibold text-text-primary">
                          {item.placeName}
                        </span>
                        <span className="text-caption-mobile text-text-secondary">
                          {item.roadAddress}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        )}
      </div>

      {/* 카카오 지도 연동 전까지 위치 표시 자리만 둔다 */}
      <div
        aria-hidden="true"
        className="flex aspect-4/3 items-center justify-center rounded-xl border border-border-subtle bg-surface-subtle"
      >
        <MapPin
          className={`size-10 ${place ? 'text-action-primary' : 'text-text-disabled'}`}
          strokeWidth={1.5}
        />
      </div>

      <section
        aria-label="선택한 가게 위치"
        className="rounded-xl bg-bg-surface px-5 py-4"
      >
        {place ? (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-body-mobile font-semibold break-keep text-text-primary">
                {place.roadAddress}
              </p>
              <p className="mt-1 text-body-sm-mobile break-keep text-text-secondary">
                {place.placeName}
              </p>
              <p className="text-body-sm-mobile break-keep text-text-secondary">
                {place.address}
              </p>
            </div>
            <button
              aria-label="선택한 가게 위치 초기화"
              className="-mt-2 -mr-3 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md px-3 text-caption-mobile font-medium text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={() => updateStepValues('location', { place: null })}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              초기화
            </button>
          </div>
        ) : (
          <p className="text-body-sm-mobile text-text-secondary">
            주소나 상호명으로 검색해 가게 위치를 선택해주세요
          </p>
        )}
      </section>
    </div>
  );
};
