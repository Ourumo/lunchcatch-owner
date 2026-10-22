import { useEffect, useRef, useState } from 'react';
import { Button } from '@repo/ui';
import { X } from 'lucide-react';

import { redeemCoupon, type RedeemedCoupon } from '@owner/api/redeem';
import type { ApiResult } from '@owner/api/types';

import { RedeemResult } from './RedeemResult';
import { type CameraErrorStatus, useCamera } from './useCamera';
import { useQrDetector } from './useQrDetector';

type ScanState =
  | { status: 'scanning' }
  | { status: 'processing' }
  | { status: 'done'; result: ApiResult<RedeemedCoupon> };

const cameraErrorContents: Record<
  CameraErrorStatus,
  { title: string; description: string; showSettingsGuide: boolean }
> = {
  denied: {
    title: '카메라 권한이 필요해요',
    description: '손님의 쿠폰 QR을 읽으려면 카메라를 허용해 주세요.',
    showSettingsGuide: true,
  },
  unavailable: {
    title: '카메라를 켤 수 없어요',
    description:
      '쓸 수 있는 카메라를 찾지 못했어요. 다른 앱이 카메라를 쓰고 있다면 닫고 다시 시도해 주세요.',
    showSettingsGuide: false,
  },
  insecure: {
    title: '카메라를 켤 수 없어요',
    description: '보안 연결(HTTPS) 주소에서만 카메라를 쓸 수 있어요.',
    showSettingsGuide: false,
  },
};

interface CameraErrorProps {
  status: CameraErrorStatus;
  onRetry: () => void;
}

// 카메라를 켜지 못했을 때. 닫기 버튼은 화면 위에 따로 있다
const CameraError = ({ onRetry, status }: CameraErrorProps) => {
  const { description, showSettingsGuide, title } = cameraErrorContents[status];

  return (
    <div className="flex flex-1 flex-col justify-center gap-4 px-page pb-16">
      <h2 className="text-h3-mobile font-bold">{title}</h2>
      <p className="text-body-mobile break-keep">{description}</p>
      {showSettingsGuide && (
        <ul className="flex flex-col gap-2 rounded-xl bg-white/10 p-4 text-body-sm-mobile break-keep">
          <li>
            <strong className="font-bold">iPhone (Safari)</strong>
            <br />
            주소창의 가가 버튼 → 웹사이트 설정 → 카메라 → 허용
          </li>
          <li>
            <strong className="font-bold">Android (Chrome)</strong>
            <br />
            주소창 왼쪽 아이콘 → 권한 → 카메라 허용
          </li>
        </ul>
      )}
      {status !== 'insecure' && (
        <Button className="mt-2 w-full" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
};

interface QrScanProps {
  onClose: () => void;
}

// QR 스캔 사용 처리 (docs/requirements-owner.md "QR 스캔 사용 처리").
// 점심 계산대에서 쓰므로 카메라가 화면을 채우고, QR을 한 번 읽으면 결과를 받을 때까지 읽기를 멈춘다
export const QrScan = ({ onClose }: QrScanProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const camera = useCamera();
  const [scan, setScan] = useState<ScanState>({ status: 'scanning' });
  // 처리 중에 화면을 나가면 결과를 버린다
  const ignoreResultRef = useRef(false);
  const stream = camera.state.status === 'active' ? camera.state.stream : null;

  useEffect(() => {
    ignoreResultRef.current = false;

    return () => {
      ignoreResultRef.current = true;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !stream) {
      return;
    }

    video.srcObject = stream;

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const handleDetect = (token: string) => {
    if (scan.status !== 'scanning') {
      return;
    }

    setScan({ status: 'processing' });
    redeemCoupon(token).then((result) => {
      if (ignoreResultRef.current) {
        return;
      }

      // 계산대에서 화면을 보지 않아도 알 수 있게 짧게 진동한다. iOS Safari처럼 진동을 지원하지 않으면 건너뛴다
      if (result.ok && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }

      setScan({ status: 'done', result });
    });
  };

  const detector = useQrDetector({
    enabled: stream !== null && scan.status === 'scanning',
    onDetect: handleDetect,
    videoRef,
  });

  const renderContent = () => {
    if (scan.status === 'done') {
      return (
        <RedeemResult
          onScanAgain={() => setScan({ status: 'scanning' })}
          result={scan.result}
        />
      );
    }

    if (camera.state.status === 'requesting') {
      return (
        <p className="m-auto text-body-mobile" role="status">
          카메라를 켜는 중이에요
        </p>
      );
    }

    if (camera.state.status !== 'active') {
      return (
        <CameraError onRetry={camera.retry} status={camera.state.status} />
      );
    }

    if (detector.status === 'error') {
      return (
        <div className="relative m-auto flex flex-col items-center gap-3 px-page text-center">
          <p className="text-body-mobile font-bold">
            QR 인식을 준비하지 못했어요
          </p>
          <Button onClick={detector.retry}>다시 시도</Button>
        </div>
      );
    }

    return (
      <>
        {/* 가운데 인식 영역만 밝게 두고 나머지는 어둡게 덮는다 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="size-64 rounded-2xl border-2 border-white shadow-[0_0_0_100vmax_rgb(0_0_0/0.55)]" />
        </div>
        <p
          className="relative mt-auto mb-16 px-page text-center text-body-mobile font-bold"
          role="status"
        >
          {scan.status === 'processing'
            ? '쿠폰을 확인하는 중이에요'
            : detector.status === 'loading'
              ? 'QR 인식을 준비하는 중이에요'
              : '손님의 쿠폰 QR을 비춰 주세요'}
        </p>
      </>
    );
  };

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-bg-inverse text-text-on-inverse">
      <video
        aria-hidden="true"
        autoPlay
        className="absolute inset-0 size-full object-cover"
        muted
        // iOS Safari가 전체 화면 재생으로 바꾸지 않고 화면 안에서 보여주게 한다
        playsInline
        ref={videoRef}
      />
      {/* 인식 영역 밖을 어둡게 덮는 층보다 위에 둔다 */}
      <header className="relative z-10 flex h-14 items-center gap-2 px-page">
        <h1 className="flex-1 text-h3-mobile font-bold">QR 코드 스캔</h1>
        <button
          aria-label="닫기"
          className="-mr-2.5 flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </header>
      {renderContent()}
    </main>
  );
};
