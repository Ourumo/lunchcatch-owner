import { type ChangeEvent, useId, useState } from 'react';
import { Camera, RotateCw, X } from 'lucide-react';

import type { ImageValue } from '@owner/api/imageUpload';
import { FilePreviewImage } from '@owner/ui/FilePreviewImage/FilePreviewImage';
import { ACCEPTED_IMAGE_TYPES, getImageFileError } from '@owner/ui/imageFile';

export type ImageUploadSlotSize = 'sm' | 'lg';

export interface ImageUploadSlotProps {
  // 빈 칸에 보이는 이름. 등록·변경·삭제 버튼의 이름으로도 쓴다
  label: string;
  // 새로 고른 사진은 파일로, 이미 올라간 사진(가게 정보 수정)은 주소로 보여준다
  image: ImageValue | null;
  // 허용하는 파일만 넘긴다. multiple이 아니면 1장만 넘긴다.
  // 없으면 사진을 고르거나 바꿀 수 없고 사진만 보여준다 (이미 올리기 시작한 사진)
  onSelect?: (files: File[]) => void;
  // 없으면 삭제 버튼을 보여주지 않는다
  onRemove?: () => void;
  // 넘기면 업로드에 실패한 사진에 다시 시도 버튼을 보여준다
  onRetry?: () => void;
  // lg: 화면 폭을 채우는 16:9 (대표 이미지), sm: 3칸 그리드 한 칸 크기의 정사각형 (매장 이미지, 메뉴 사진).
  // 폭은 감싸는 요소를 따른다
  size?: ImageUploadSlotSize;
  disabled?: boolean;
  // 개수 제한처럼 칸 밖의 이유로 보여줄 안내. 파일 검사 오류보다 먼저 보여준다
  errorMessage?: string;
  multiple?: boolean;
}

const sizeClassNames: Record<
  ImageUploadSlotSize,
  {
    box: string;
    iconCircle: string;
    icon: string;
    label: string;
    removeButton: string;
  }
> = {
  lg: {
    box: 'aspect-video',
    iconCircle: 'size-10',
    icon: 'size-5',
    label: 'text-body-sm-mobile',
    removeButton: 'top-1.5 right-1.5 size-8',
  },
  sm: {
    box: 'aspect-square',
    iconCircle: 'size-8',
    icon: 'size-4',
    label: 'text-caption-mobile',
    removeButton: 'top-1 right-1 size-7',
  },
};

// 점주 화면용 사진 등록 칸. 빈 칸을 누르면 사진을 고르고, 사진이 있으면 미리보기를 보여주며 누르면 교체한다.
// onSelect가 없으면 누를 수 없고 사진만 보여준다.
// 올리는 중이면 진행률을, 올리지 못했으면 실패 안내와 다시 시도 버튼을 미리보기 위에 겹쳐 보여준다
export const ImageUploadSlot = ({
  label,
  image,
  onSelect,
  onRemove,
  onRetry,
  size = 'lg',
  disabled = false,
  errorMessage,
  multiple = false,
}: ImageUploadSlotProps) => {
  const errorId = useId();
  const [fileError, setFileError] = useState<string>();
  const visibleError = errorMessage ?? fileError;
  const sizeClassName = sizeClassNames[size];
  const isFailed = image?.status === 'failed';
  const isReadOnly = !onSelect;
  // 고를 수 있으면 칸 이름은 선택 입력이 갖고, 사진만 보여줄 때는 사진이 갖는다
  const imageAlt = isReadOnly ? label : '';
  const boxClassName = [
    'flex w-full items-center justify-center overflow-hidden rounded-xl',
    isReadOnly
      ? ''
      : 'cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-action-primary has-disabled:cursor-not-allowed has-disabled:opacity-60',
    image
      ? 'border border-border-subtle bg-bg-surface'
      : 'border border-dashed border-brand-200 bg-surface-brand',
    visibleError || isFailed ? 'border-status-danger-border' : '',
    sizeClassName.box,
  ]
    .filter(Boolean)
    .join(' ');

  const preview =
    image?.status === 'saved' ? (
      <img alt={imageAlt} className="size-full object-cover" src={image.url} />
    ) : image ? (
      <FilePreviewImage
        alt={imageAlt}
        className="size-full object-cover"
        file={image.file}
      />
    ) : (
      <span className="flex flex-col items-center gap-2 px-2 text-center">
        <span
          className={`flex items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-action-primary ${sizeClassName.iconCircle}`}
        >
          <Camera aria-hidden="true" className={sizeClassName.icon} />
        </span>
        <span className={`break-keep text-text-primary ${sizeClassName.label}`}>
          {label}
        </span>
      </span>
    );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 골라도 change가 일어나도록 비운다
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const errors = files.map(getImageFileError);
    const acceptedFiles = files.filter((_, index) => !errors[index]);
    setFileError(errors.find(Boolean));

    if (acceptedFiles.length > 0) {
      onSelect?.(multiple ? acceptedFiles : acceptedFiles.slice(0, 1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        {isReadOnly ? (
          <div className={boxClassName}>{preview}</div>
        ) : (
          <label className={boxClassName}>
            <input
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              aria-describedby={visibleError ? errorId : undefined}
              aria-label={image ? `${label} 변경` : `${label} 등록`}
              className="sr-only"
              disabled={disabled}
              multiple={multiple}
              onChange={handleChange}
              type="file"
            />
            {preview}
          </label>
        )}
        {/* 겹친 안내를 눌러도 아래 칸이 눌려 사진을 바꿀 수 있도록 다시 시도 버튼만 누를 수 있게 둔다 */}
        {image?.status === 'uploading' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-bg-inverse/50 px-3">
            <span
              aria-hidden="true"
              className="text-caption-mobile font-semibold text-text-on-inverse"
            >
              {Math.round(image.progress)}%
            </span>
            <div
              aria-label={`${label} 업로드 중`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(image.progress)}
              className="h-1 w-full max-w-24 overflow-hidden rounded-full bg-bg-surface/40"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-bg-surface transition-[width]"
                style={{ width: `${image.progress}%` }}
              />
            </div>
          </div>
        )}
        {isFailed && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-bg-inverse/60 px-2 text-center">
            <span
              className="text-caption-mobile font-semibold break-keep text-text-on-inverse"
              role="alert"
            >
              업로드 실패
            </span>
            {onRetry && (
              <button
                aria-label={`${label} 다시 올리기`}
                className="pointer-events-auto flex h-8 items-center gap-1 rounded-full bg-bg-surface px-3 text-caption-mobile font-semibold text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed"
                disabled={disabled}
                onClick={onRetry}
                type="button"
              >
                <RotateCw aria-hidden="true" className="size-3.5" />
                다시 시도
              </button>
            )}
          </div>
        )}
        {image && onRemove && (
          <button
            aria-label={`${label} 삭제`}
            className={`absolute flex items-center justify-center rounded-full bg-bg-inverse/70 text-text-on-inverse hover:bg-bg-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed ${sizeClassName.removeButton}`}
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
