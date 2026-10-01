import { useId, useState } from 'react';
import { BottomSheet, Checkbox } from '@repo/ui';
import { ChevronRight } from 'lucide-react';

import {
  ownerTerms,
  type TermsItem,
  type TermsStepValues,
} from '@owner/api/signupFlow';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

const getTermsLabel = ({ required, title }: TermsItem) =>
  required ? `[필수] ${title}` : `${title} (선택)`;

// 약관 전체 동의, 약관별 동의, 약관 상세 보기
export const TermsStep = () => {
  const allAgreeDescriptionId = useId();
  const { updateStepValues, values } = useSignupFlow();
  const [openedTerms, setOpenedTerms] = useState<TermsItem | null>(null);
  const { terms } = values;
  const isAllAgreed = ownerTerms.every((item) => terms[item.id]);

  const handleAllAgreeChange = (checked: boolean) => {
    const nextTerms: TermsStepValues = { ...terms };
    ownerTerms.forEach((item) => {
      nextTerms[item.id] = checked;
    });
    updateStepValues('terms', nextTerms);
  };

  return (
    <section className="flex flex-col gap-3 px-page py-5">
      <div className="flex flex-col gap-2 rounded-xl bg-bg-surface p-5">
        <h2 className="text-h3-mobile font-bold text-text-primary">
          서비스 이용을 위해 약관에 동의해주세요
        </h2>
        <p className="type-body-sm text-text-secondary">
          필수 항목에 모두 동의해야 다음 단계로 진행할 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-surface-brand p-5">
        <Checkbox
          aria-describedby={allAgreeDescriptionId}
          checked={isAllAgreed}
          className="font-bold"
          label="약관 전체 동의"
          onChange={(event) => handleAllAgreeChange(event.target.checked)}
        />
        <p
          className="pl-6 type-caption text-text-primary"
          id={allAgreeDescriptionId}
        >
          선택 약관을 포함해 한 번에 동의합니다.
        </p>
      </div>

      <ul className="flex flex-col rounded-xl bg-bg-surface py-2">
        {ownerTerms.map((item) => (
          <li className="flex items-center gap-2 py-1 pr-2 pl-5" key={item.id}>
            <Checkbox
              checked={terms[item.id]}
              className="min-w-0 flex-1 py-2"
              label={getTermsLabel(item)}
              onChange={(event) =>
                updateStepValues('terms', { [item.id]: event.target.checked })
              }
            />
            <button
              aria-label={`${item.title} 자세히 보기`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={() => setOpenedTerms(item)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </li>
        ))}
      </ul>

      <BottomSheet
        isOpen={openedTerms !== null}
        onClose={() => setOpenedTerms(null)}
        title={openedTerms?.title}
      >
        {/* 내용이 길어도 시트가 화면을 넘지 않도록 내용 영역만 스크롤한다 */}
        <div
          aria-label={`${openedTerms?.title ?? '약관'} 내용`}
          className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto"
          role="region"
          tabIndex={0}
        >
          <p className="type-caption text-text-secondary">
            버전 {openedTerms?.version}
          </p>
          {openedTerms?.sections.map((section) => (
            <section className="flex flex-col gap-1" key={section.heading}>
              <h3 className="text-body-sm-mobile font-semibold text-text-primary">
                {section.heading}
              </h3>
              <ul className="list-disc pl-5 type-body-sm text-text-primary">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </BottomSheet>
    </section>
  );
};
