// 목 모드(VITE_USE_MOCK=true) 전용 시연 QR. 손님 앱이 없어 찍을 쿠폰 QR이 없으므로,
// 처리 결과를 골라 누르면 그 결과가 나오는 QR 값으로 사용 처리를 보낸다. 카메라를 허용하지 않아도 쓸 수 있다.
// 결과는 목 서버가 QR 값으로 정한다. 값을 바꾸면 src/mocks/handlers/couponUsage.ts의 DEMO_QR_TOKENS도 함께 바꾼다
export const isDemoQrEnabled = import.meta.env.VITE_USE_MOCK === 'true';

const DEMO_QR_TOKENS = {
  expired: '00000000-0000-4000-8000-000000000001',
  alreadyUsed: '00000000-0000-4000-8000-000000000002',
  otherStore: '00000000-0000-4000-8000-000000000003',
  notUsableTime: '00000000-0000-4000-8000-000000000004',
  // 응답 없음은 누를 때마다 새 QR이어야 해서 앞부분만 정하고 뒤 11자리는 랜덤으로 채운다
  noResponsePrefix: '00000000-0000-4000-8000-5',
};

const DEMO_QR_CASES: { label: string; createToken: () => string }[] = [
  // 누를 때마다 새 쿠폰 QR이라 매번 성공한다
  { label: '성공', createToken: () => crypto.randomUUID() },
  { label: '만료된 QR', createToken: () => DEMO_QR_TOKENS.expired },
  { label: '이미 사용한 쿠폰', createToken: () => DEMO_QR_TOKENS.alreadyUsed },
  { label: '다른 가게 쿠폰', createToken: () => DEMO_QR_TOKENS.otherStore },
  { label: '사용 시간 아님', createToken: () => DEMO_QR_TOKENS.notUsableTime },
  // 처음에는 응답을 받지 못하고, 같은 QR로 다시 시도하면 처리된다. 누를 때마다 새 QR이라 매번 실패부터 시작한다
  {
    label: '응답 없음',
    createToken: () =>
      `${DEMO_QR_TOKENS.noResponsePrefix}${crypto.randomUUID().slice(-11)}`,
  },
  // 쿠폰 QR 모양(UUID)이 아니라 서버에 보내지 않고 화면에서 거른다
  { label: '쿠폰 QR 아님', createToken: () => 'https://example.com' },
];

interface DemoQrCasesProps {
  onScan: (qrToken: string) => void;
}

export const DemoQrCases = ({ onScan }: DemoQrCasesProps) => (
  <section
    aria-labelledby="demo-qr-title"
    className="relative z-10 mt-auto flex flex-col gap-2 px-page pb-8"
  >
    <h2 className="text-caption-mobile font-bold" id="demo-qr-title">
      시연용 QR · 처리 결과를 골라 주세요
    </h2>
    <div className="flex flex-wrap gap-2">
      {DEMO_QR_CASES.map(({ createToken, label }) => (
        <button
          className="h-9 rounded-full bg-white/20 px-3.5 text-body-sm-mobile font-medium focus-visible:outline-2 focus-visible:outline-white"
          key={label}
          onClick={() => onScan(createToken())}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  </section>
);
