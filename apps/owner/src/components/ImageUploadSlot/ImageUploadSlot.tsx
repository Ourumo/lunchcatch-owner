import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export interface ImageUploadSlotProps {
  // 빈 칸에 보이는 이름. 등록·변경·삭제 버튼의 이름으로도 쓴다
  label: string;
  image: File | null;
  // 허용하는 파일만 넘긴다. multiple이 아니면 1장만 넘긴다
  onSelect: (files: File[]) => void;
  // 없으면 삭제 버튼을 보여주지 않는다
  onRemove?: () => void;
  // 크기와 비율 (예: aspect-square)
  className?: string;
  disabled?: boolean;
  // 개수 제한처럼 칸 밖의 이유로 보여줄 안내. 파일 검사 오류보다 먼저 보여준다
  errorMessage?: string;
  multiple?: boolean;
}

// 요구사항: jpg, png만, 10MB 이하
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const getFileError = (file: File) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'jpg, png 파일만 등록할 수 있어요';
  }

  if (file.size > MAX_FILE_SIZE) {
    return '10MB 이하 사진만 등록할 수 있어요';
  }

  return undefined;
};

// 점주 화면용 사진 등록 칸. 빈 칸을 누르면 사진을 고르고, 사진이 있으면 미리보기를 보여주며 누르면 교체한다
export const ImageUploadSlot = ({
  label,
  image,
  onSelect,
  onRemove,
  className,
  disabled = false,
  errorMessage,
  multiple = false,
}: ImageUploadSlotProps) => {
  const errorId = useId();
  const previewRef = useRef<HTMLImageElement>(null);
  const [fileError, setFileError] = useState<string>();
  const visibleError = errorMessage ?? fileError;

  // 미리보기 주소는 사진이 바뀌거나 칸이 사라질 때 해제한다
  useEffect(() => {
    if (!image || !previewRef.current) {
      return;
    }

    const url = URL.createObjectURL(image);
    previewRef.current.src = url;

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 골라도 change가 일어나도록 비운다
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const errors = files.map(getFileError);
    const acceptedFiles = files.filter((_, index) => !errors[index]);
    setFileError(errors.find(Boolean));

    if (acceptedFiles.length > 0) {
      onSelect(multiple ? acceptedFiles : acceptedFiles.slice(0, 1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <label
          className={[
            'flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-action-primary has-disabled:cursor-not-allowed has-disabled:opacity-60',
            image
              ? 'border border-border-subtle bg-bg-surface'
              : 'border border-dashed border-brand-200 bg-surface-brand',
            visibleError ? 'border-status-danger-border' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            accept={ACCEPTED_TYPES.join(',')}
            aria-describedby={visibleError ? errorId : undefined}
            aria-label={image ? `${label} 변경` : `${label} 등록`}
            className="sr-only"
            disabled={disabled}
            multiple={multiple}
            onChange={handleChange}
            type="file"
          />
          {image ? (
            <img alt="" className="size-full object-cover" ref={previewRef} />
          ) : (
            <span className="flex flex-col items-center gap-2 px-2 text-center">
              <span className="flex size-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-action-primary">
                <Camera aria-hidden="true" className="size-5" />
              </span>
              <span className="text-body-sm-mobile break-keep text-text-primary">
                {label}
              </span>
            </span>
          )}
        </label>
        {image && onRemove && (
          <button
            aria-label={`${label} 삭제`}
            className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-bg-inverse/70 text-text-on-inverse hover:bg-bg-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed"
            disabled={disabled}
            onClick={() => {
              setFileError(undefined);
              onRemove();
            }}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      {visibleError && (
        <p
          className="ml-1 text-caption-mobile break-keep text-status-danger-fg"
          id={errorId}
          role="alert"
        >
          {visibleError}
        </p>
      )}
    </div>
  );
};
