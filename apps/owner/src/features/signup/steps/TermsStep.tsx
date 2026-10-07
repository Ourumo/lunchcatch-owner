import { useId, useState } from 'react';
import { BottomSheet, Checkbox } from '@repo/ui';
import { ChevronRight } from 'lucide-react';

import {
  ownerTerms,
  type TermsItem,
  type TermsStepValues,
} from '@owner/api/signupFlow';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

const termsGroups = [
  { legend: '필수', items: ownerTerms.filter((item) => item.required) },
  { legend: '선택', items: ownerTerms.filter((item) => !item.required) },
].filter((group) => group.items.length > 0);

// 모두 동의하기, 필수·선택 약관별 동의, 약관 상세 보기
export const TermsStep = () => {
  const allAgreeId = useId();
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
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <h2 className="text-h1 leading-snug font-bold text-text-primary">
        사장님, 시작하기 전에
        <br />
        약관에 동의해주세요
      </h2>

      {/* 카드 어디를 눌러도 체크되도록 체크박스 줄과 설명 줄을 모두 같은 입력의 라벨로 둔다 */}
      <div className="flex flex-col rounded-xl bg-surface-brand">
        <Checkbox
          checked={isAllAgreed}
          className="w-full cursor-pointer px-5 pt-5 pb-1"
          id={allAgreeId}
          label="모두 동의하기"
          onChange={(event) => handleAllAgreeChange(event.target.checked)}
          size="lg"
          variant="inverse"
        />
        <label
          className="cursor-pointer pr-5 pb-5 pl-14 type-body-sm text-text-primary"
          htmlFor={allAgreeId}
        >
          선택 항목까지 한 번에 동의해요
        </label>
      </div>

      {termsGroups.map((group) => (
        <fieldset className="flex flex-col" key={group.legend}>
          <legend className="mb-1 text-caption-mobile font-semibold text-text-secondary">
            {group.legend}
          </legend>
          <ul className="flex flex-col">
            {group.items.map((item) => (
              <li className="flex items-center gap-2" key={item.id}>
                <Checkbox
                  checked={terms[item.id]}
                  className="min-h-12 min-w-0 flex-1 cursor-pointer"
                  label={item.title}
                  onChange={(event) =>
                    updateStepValues('terms', {
                      [item.id]: event.target.checked,
                    })
                  }
                  size="md"
                  variant="inverse"
                />
                <button
                  aria-label={`${item.title} 자세히 보기`}
                  className="-mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
                  onClick={() => setOpenedTerms(item)}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}

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
    </div>
  );
};
