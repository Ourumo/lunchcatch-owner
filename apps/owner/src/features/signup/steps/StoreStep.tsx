import { useId, useState } from 'react';
import { Input } from '@repo/ui';

import {
  isValidBusinessNumber,
  isValidPhone,
  storeCategories,
} from '@owner/api/signupFlow';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

const PHONE_MAX_LENGTH = 11;
const BUSINESS_NUMBER_LENGTH = 10;

type TouchableField = 'name' | 'ownerName' | 'phone' | 'registrationNumber';

const toDigits = (value: string, maxLength: number) =>
  value.replace(/\D/g, '').slice(0, maxLength);

// 02-123-4567, 02-1234-5678, 031-123-4567, 010-1234-5678
const formatPhone = (digits: string) => {
  const areaLength = digits.startsWith('02') ? 2 : 3;
  const rest = digits.slice(areaLength);
  // 국번 뒤가 8자리면 4-4, 그보다 짧으면 3-4로 나눈다
  const middleLength = rest.length > 7 ? 4 : 3;

  return [
    digits.slice(0, areaLength),
    rest.slice(0, middleLength),
    rest.slice(middleLength),
  ]
    .filter(Boolean)
    .join('-');
};

// 000-00-00000
const formatBusinessNumber = (digits: string) =>
  [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5)]
    .filter(Boolean)
    .join('-');

// 상호명, 대표자 성명, 전화번호, 업종, 사업자등록번호 입력
export const StoreStep = () => {
  const categoryName = useId();
  const { updateStepValues, values } = useSignupFlow();
  const { business, store } = values;
  // 입력 중에는 오류를 보여주지 않고, 필드를 벗어난 뒤부터 보여준다
  const [touched, setTouched] = useState<Record<TouchableField, boolean>>({
    name: false,
    ownerName: false,
    phone: false,
    registrationNumber: false,
  });

  const errors: Record<TouchableField, string | undefined> = {
    name: store.name.trim() ? undefined : '상호명을 입력해주세요',
    ownerName: store.ownerName.trim()
      ? undefined
      : '대표자 성명을 입력해주세요',
    phone: !store.phone
      ? '전화번호를 입력해주세요'
      : isValidPhone(store.phone)
        ? undefined
        : '전화번호를 정확히 입력해주세요',
    registrationNumber: !business.registrationNumber
      ? '사업자등록번호를 입력해주세요'
      : isValidBusinessNumber(business.registrationNumber)
        ? undefined
        : '사업자등록번호 10자리를 입력해주세요',
  };
  const getVisibleError = (field: TouchableField) =>
    touched[field] ? errors[field] : undefined;

  const handleBlur = (field: TouchableField) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <Input
        autoComplete="organization"
        errorMessage={getVisibleError('name')}
        label="상호명"
        onBlur={handleBlur('name')}
        onChange={(event) =>
          updateStepValues('store', { name: event.target.value })
        }
        placeholder="예) 맛있고 든든한 뚝배기집"
        required
        value={store.name}
      />
      <Input
        autoComplete="name"
        errorMessage={getVisibleError('ownerName')}
        label="대표자 성명"
        onBlur={handleBlur('ownerName')}
        onChange={(event) =>
          updateStepValues('store', { ownerName: event.target.value })
        }
        placeholder="예) 홍길동"
        required
        value={store.ownerName}
      />
      <Input
        autoComplete="tel"
        errorMessage={getVisibleError('phone')}
        inputMode="numeric"
        label="전화번호"
        onBlur={handleBlur('phone')}
        onChange={(event) =>
          updateStepValues('store', {
            phone: toDigits(event.target.value, PHONE_MAX_LENGTH),
          })
        }
        placeholder="예) 02-1234-5678"
        required
        type="tel"
        value={formatPhone(store.phone)}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-caption-web font-medium text-text-primary">
          업종 카테고리
        </legend>
        <div className="flex flex-wrap gap-2">
          {storeCategories.map((category) => (
            <label className="cursor-pointer" key={category.value}>
              {/* 화살표 키로 칩 사이를 옮겨 고를 수 있도록 라디오를 숨겨서 쓴다 */}
              <input
                checked={store.category === category.value}
                className="peer sr-only"
                name={categoryName}
                onChange={() =>
                  updateStepValues('store', { category: category.value })
                }
                required
                type="radio"
                value={category.value}
              />
              {/* 약관 동의 체크박스처럼 고른 항목은 반전 색으로 채운다. 고를 때 칩 크기가 바뀌지 않도록 색만 바꾼다 */}
              <span className="flex h-10 items-center rounded-full border border-border-subtle bg-bg-surface px-4 text-body-sm-mobile text-text-primary peer-checked:border-bg-inverse peer-checked:bg-bg-inverse peer-checked:text-text-on-inverse peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary">
                {category.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Input
        errorMessage={getVisibleError('registrationNumber')}
        inputMode="numeric"
        label="사업자등록번호"
        onBlur={handleBlur('registrationNumber')}
        onChange={(event) =>
          updateStepValues('business', {
            registrationNumber: toDigits(
              event.target.value,
              BUSINESS_NUMBER_LENGTH,
            ),
          })
        }
        placeholder="예) 000-00-00000"
        required
        value={formatBusinessNumber(business.registrationNumber)}
      />
    </div>
  );
};
