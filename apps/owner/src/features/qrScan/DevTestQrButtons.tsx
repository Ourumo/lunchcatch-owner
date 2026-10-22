import { mockRedeemCases } from '@owner/api/redeem';

interface DevTestQrButtonsProps {
  onScan: (token: string) => void;
}

// 개발 모드에서만 보이는 테스트 QR. 카메라 없이 결과 화면을 확인한다. API를 연동하면 mock과 함께 지운다
export const DevTestQrButtons = ({ onScan }: DevTestQrButtonsProps) => (
  <div className="relative z-10 mt-auto flex flex-col gap-2 px-page pb-6">
    <p className="text-caption-mobile">개발용 테스트 QR</p>
    <div className="flex flex-wrap gap-2">
      {mockRedeemCases.map(({ createToken, label }) => (
        <button
          className="h-8 rounded-full bg-bg-surface/20 px-3 text-caption-mobile focus-visible:outline-2 focus-visible:outline-white"
          key={label}
          onClick={() => onScan(createToken())}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);
