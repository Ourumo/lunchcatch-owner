import { type RefObject, useEffect, useEffectEvent, useState } from 'react';
import type { BarcodeDetector } from 'barcode-detector/ponyfill';
import zxingReaderWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// 카메라 화면을 읽는 간격. 너무 짧으면 느린 기기에서 화면이 끊긴다
const SCAN_INTERVAL_MS = 150;

type DetectorState =
  | { status: 'loading' }
  | { status: 'ready'; detector: BarcodeDetector }
  | { status: 'error' };

let detectorPromise: Promise<BarcodeDetector> | null = null;

// 브라우저 기본 BarcodeDetector가 QR을 읽을 수 있으면 그것을 쓰고(Android Chrome 등),
// 없으면(iOS Safari 등) ZXing WASM으로 읽는 대체 구현을 이 화면에 들어올 때만 받는다.
// .wasm은 기본으로 외부 CDN(jsDelivr)에서 받으므로 우리 빌드 결과물에 포함된 파일을 쓰게 한다
const loadDetector = async (): Promise<BarcodeDetector> => {
  const NativeBarcodeDetector = (
    globalThis as { BarcodeDetector?: typeof BarcodeDetector }
  ).BarcodeDetector;

  if (NativeBarcodeDetector) {
    const formats = await NativeBarcodeDetector.getSupportedFormats();

    if (formats.includes('qr_code')) {
      return new NativeBarcodeDetector({ formats: ['qr_code'] });
    }
  }

  const ponyfill = await import('barcode-detector/ponyfill');

  ponyfill.prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith('.wasm') ? zxingReaderWasmUrl : prefix + path,
    },
  });

  return new ponyfill.BarcodeDetector({ formats: ['qr_code'] });
};

const getDetector = () => {
  detectorPromise ??= loadDetector().catch((error: unknown) => {
    // 실패하면 다음에 다시 받도록 비운다
    detectorPromise = null;
    throw error;
  });

  return detectorPromise;
};

interface UseQrDetectorOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  // false면 읽기를 멈춘다. 처리 중이거나 결과를 보여주는 동안 같은 QR을 다시 읽지 않게 한다
  enabled: boolean;
  // QR을 하나 읽으면 한 번 부르고 읽기를 멈춘다. 다시 읽으려면 enabled를 껐다 켠다
  onDetect: (value: string) => void;
}

// 카메라 화면에서 QR을 찾는다
export const useQrDetector = ({
  enabled,
  onDetect,
  videoRef,
}: UseQrDetectorOptions) => {
  const [state, setState] = useState<DetectorState>({ status: 'loading' });
  // 값이 바뀌면 인식기를 다시 준비한다
  const [requestId, setRequestId] = useState(0);
  const handleDetect = useEffectEvent(onDetect);

  useEffect(() => {
    let ignore = false;

    getDetector().then(
      (detector) => {
        if (!ignore) {
          setState({ status: 'ready', detector });
        }
      },
      () => {
        if (!ignore) {
          setState({ status: 'error' });
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [requestId]);

  const detector = state.status === 'ready' ? state.detector : null;

  useEffect(() => {
    if (!enabled || !detector) {
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scan = async () => {
      const video = videoRef.current;

      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const [code] = await detector.detect(video);

          if (code?.rawValue && !stopped) {
            handleDetect(code.rawValue);
            return;
          }
        } catch {
          // 한 장면을 읽지 못해도 다음 장면에서 다시 읽는다
        }
      }

      if (!stopped) {
        timer = setTimeout(scan, SCAN_INTERVAL_MS);
      }
    };

    scan();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [detector, enabled, videoRef]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { retry, status: state.status };
};
