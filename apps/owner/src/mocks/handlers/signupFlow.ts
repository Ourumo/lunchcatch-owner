import { http } from 'msw/http';

import { getDb, updateDb } from '@owner/mocks/db';
import {
  checkCurrentStep,
  checkOnboardingOwner,
  checkPreviousSteps,
  checkVersion,
  completeStep,
  isOnboardingDone,
} from '@owner/mocks/onboarding';
import { fail, ok, unauthenticated } from '@owner/mocks/response';
import type { MockBusinessHour } from '@owner/mocks/seed';

// 입점 신청 단계 저장과 가게 최종 등록 (api/signupFlow.ts)
//
// 단계를 저장할 때마다 서버는 입점 진행 버전(version)을 1 올려 돌려주고, 화면은 그 값을 다음 저장에 보낸다.
// 목 서버도 같은 규칙으로 버전 · 이어갈 단계를 관리해, 화면의 이어하기 · 충돌 처리 코드가 그대로 동작한다.
// 화면이 다시 불러오는 진행 상태는 가게 정보 조회(GET /v1/owner/store, handlers/store.ts)에 함께 담긴다

interface VersionBody {
  version: number;
}

interface StoreBasicBody extends VersionBody {
  name: string;
  categoryCode: string;
  representativeName: string;
  businessRegistrationNumber: string;
  phone: string;
}

interface LocationBody extends VersionBody {
  kakaoPlaceId: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
}

interface HoursBody {
  // 영업 중인 가게의 영업시간 수정은 버전을 보내지 않는다
  version?: number;
  businessHours: {
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
    lastOrderTime?: string | null;
  }[];
}

// 서버는 사업자등록번호를 Mock으로 확인하고, 0000000000만 확인 실패로 본다
const FAILED_BUSINESS_NUMBER = '0000000000';

// 가게 기본 정보를 처음 저장하면 가게가 생긴다. 시연 계정의 가게(1)와 겹치지 않게 둔다
const NEW_STORE_ID = 2;

const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

// 서버는 보내지 않은 요일을 휴무로 저장한다
const toBusinessHours = (
  hours: HoursBody['businessHours'],
): MockBusinessHour[] =>
  WEEKDAYS.map((dayOfWeek) => {
    const hour = hours.find((current) => current.dayOfWeek === dayOfWeek);

    return {
      dayOfWeek,
      openTime: hour?.openTime ?? null,
      closeTime: hour?.closeTime ?? null,
      isClosed: !hour,
      breakStartTime: hour?.breakStartTime ?? null,
      breakEndTime: hour?.breakEndTime ?? null,
      lastOrderTime: hour?.lastOrderTime ?? null,
    };
  });

const versionResponse = () => ok({ version: getDb().store.onboarding.version });

export const signupFlowHandlers = [
  // ① 약관 동의. 한 번만 받는다. 이미 동의했으면 409 TERMS-001
  http.put('*/v1/owner/terms-agreements', () => {
    const rejected = checkOnboardingOwner();

    if (rejected) return rejected;

    const isAgreed = getDb().store.onboarding.steps.some(
      ({ completed, step }) => step === 'TERMS' && completed,
    );

    if (isAgreed) {
      return fail(409, 'TERMS-001', '이미 약관에 동의했습니다.');
    }

    updateDb((db) => completeStep(db, 'TERMS'));

    return versionResponse();
  }),

  // ② 가게 기본 정보. 처음 저장하면 가게가 생기고, 다시 저장하면 덮어쓴다.
  // 사업자등록번호 확인에 실패하면 서버처럼 200으로 답하되 저장하지 않고 버전도 그대로 둔다
  http.put<never, StoreBasicBody>(
    '*/v1/owner/store/basic',
    async ({ request }) => {
      const body = await request.json();
      const rejected =
        checkOnboardingOwner() ??
        checkVersion(body.version) ??
        checkPreviousSteps('STORE_INFO');

      if (rejected) return rejected;

      if (body.businessRegistrationNumber === FAILED_BUSINESS_NUMBER) {
        return ok({
          version: getDb().store.onboarding.version,
          verificationStatus: 'FAILED',
        });
      }

      updateDb((db) => {
        db.store.storeId ??= NEW_STORE_ID;
        db.store.name = body.name;
        db.store.businessCategory = body.categoryCode;
        db.store.representativeName = body.representativeName;
        db.store.businessRegistrationNumber = body.businessRegistrationNumber;
        db.store.phone = body.phone;
        completeStep(db, 'STORE_INFO');
      });

      return ok({
        version: getDb().store.onboarding.version,
        verificationStatus: 'VERIFIED',
      });
    },
  ),

  // ③ 매장 위치. 카카오 장소 검색에서 고른 장소 ID, 도로명 주소, 좌표를 저장한다
  http.put<never, LocationBody>(
    '*/v1/owner/store/location',
    async ({ request }) => {
      const body = await request.json();
      const rejected =
        checkOnboardingOwner() ??
        checkVersion(body.version) ??
        checkPreviousSteps('LOCATION');

      if (rejected) return rejected;

      updateDb((db) => {
        db.store.kakaoPlaceId = body.kakaoPlaceId;
        db.store.roadAddress = body.roadAddress;
        db.store.latitude = body.latitude;
        db.store.longitude = body.longitude;
        completeStep(db, 'LOCATION');
      });

      return versionResponse();
    },
  ),

  // ④ 영업시간. 입점 신청과 영업 중인 가게의 영업시간 수정(가게 관리)이 같은 요청을 쓴다.
  // 입점 신청 중이면 버전 · 앞 단계를 검사하고 단계를 마친다. 영업 중이면 덮어쓰기만 한다
  http.put<never, HoursBody>('*/v1/owner/store/hours', async ({ request }) => {
    const body = await request.json();
    const { isLoggedIn, status } = getDb().owner;

    if (!isLoggedIn) return unauthenticated();

    if (status === 'ACTIVE') {
      updateDb((db) => {
        db.store.businessHours = toBusinessHours(body.businessHours);
      });

      return ok({ version: getDb().store.onboarding.version });
    }

    const rejected = checkVersion(body.version) ?? checkPreviousSteps('HOURS');

    if (rejected) return rejected;

    updateDb((db) => {
      db.store.businessHours = toBusinessHours(body.businessHours);
      completeStep(db, 'HOURS');
    });

    return versionResponse();
  }),

  // ⑤ 사진 단계 완료. 사진은 고를 때마다 올려 이미 가게에 붙어 있어 단계 완료만 받는다.
  // 대표 이미지(로고)가 없으면 409 STORE-010
  http.post<never, VersionBody>(
    '*/v1/owner/store-images\\:complete',
    async ({ request }) => {
      const body = await request.json();
      const rejected =
        checkOnboardingOwner() ??
        checkVersion(body.version) ??
        checkCurrentStep('IMAGES');

      if (rejected) return rejected;

      if (!getDb().store.logoImage) {
        return fail(409, 'STORE-010', '대표 이미지를 먼저 등록해 주세요.');
      }

      updateDb((db) => completeStep(db, 'IMAGES'));

      return versionResponse();
    },
  ),

  // ⑥ 대표 메뉴 단계 완료. 메뉴가 없어도 받는다. 사진이 없는 메뉴가 있으면 409 STORE-013.
  // 마지막 단계라 최종 등록이 실패해 다시 보내도 받는다 (마친 뒤에도 지금 단계가 MENU로 남는다)
  http.post<never, VersionBody>(
    '*/v1/owner/store-menus\\:complete',
    async ({ request }) => {
      const body = await request.json();
      const rejected =
        checkOnboardingOwner() ??
        checkVersion(body.version) ??
        checkCurrentStep('MENU');

      if (rejected) return rejected;

      if (getDb().store.menus.some(({ image }) => !image)) {
        return fail(409, 'STORE-013', '사진이 없는 메뉴가 있습니다.');
      }

      updateDb((db) => completeStep(db, 'MENU'));

      return versionResponse();
    },
  ),

  // 가게 최종 등록. 모든 단계를 마쳤으면 점주를 영업 중(ACTIVE)으로 바꾼다. 관리자 승인 단계는 없다.
  // 필요한 단계가 남았으면 409 STORE-015, 이미 영업 중이면 403 OWNER-002
  http.post<never, VersionBody>(
    '*/v1/owner/store\\:complete',
    async ({ request }) => {
      const body = await request.json();
      const rejected = checkOnboardingOwner() ?? checkVersion(body.version);

      if (rejected) return rejected;

      if (!isOnboardingDone(getDb())) {
        return fail(409, 'STORE-015', '입점 신청에 필요한 단계가 남았습니다.');
      }

      updateDb((db) => {
        db.owner.status = 'ACTIVE';
        db.store.onboarding.resumeStep = null;
      });

      return ok({ ownerStatus: 'ACTIVE' });
    },
  ),
];
