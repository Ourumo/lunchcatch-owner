import { useState } from 'react';
import {
  Camera,
  ImageOff,
  Lock,
  Plus,
  RotateCw,
  SquarePen,
  Trash2,
} from 'lucide-react';

import type { ImageValue } from '@owner/api/imageUpload';
import { FilePreviewImage } from '@owner/ui/FilePreviewImage/FilePreviewImage';
import { ACCEPTED_IMAGE_TYPES, getImageFileError } from '@owner/ui/imageFile';
import {
  type MenuFormRules,
  MenuFormSheet,
  type MenuFormValues,
} from '@owner/ui/MenuFormSheet/MenuFormSheet';
import { formatPriceDigits } from '@owner/ui/menuPrice';

// 목록의 메뉴 한 개. 가게 관리는 고칠 때 메뉴 ID를 유지해야 해서 id를 함께 둔다.
// 가게 관리에서 불러온 메뉴는 사진이 없을 수 있어, 쓰는 쪽이 TImage에 null을 넣는다
export interface MenuListItem<TImage extends ImageValue | null> extends Omit<
  MenuFormValues,
  'image'
> {
  image: TImage;
  // 이미 등록한 메뉴의 ID. 새로 추가한 메뉴와 입점 등록 메뉴에는 없다
  id?: string | null;
}

export interface MenuListFieldsProps<TImage extends ImageValue | null> {
  menus: MenuListItem<TImage>[];
  // 고친 메뉴는 id를 그대로 두고, 새로 추가한 메뉴는 id 없이 넘긴다
  onChange: (menus: MenuListItem<TImage | ImageValue>[]) => void;
  maxMenus: number;
  rules: MenuFormRules;
  // 넘기면 메뉴마다 수정과 삭제 버튼을 보여줄지 정한다. 없으면 모두 고치고 지울 수 있다
  canEdit?: (menu: MenuListItem<TImage>) => boolean;
  // 넘기면 고치거나 지울 수 없는 이유를 메뉴 아래에 보여준다
  getLockNotice?: (menu: MenuListItem<TImage>) => string | undefined;
  // 목록 위에 보여줄 안내 (예: 등록한 메뉴는 바꿀 수 없음)
  notice?: string;
  // 넘기면 사진을 올리지 못한 메뉴에 다시 시도 버튼을 보여주고, 누르면 그 메뉴의 순서를 넘긴다
  onRetry?: (index: number) => void;
  // 넘기면 사진이 없는 메뉴에 사진 등록 버튼을 보여주고, 고른 사진을 넘긴다 (jpg·png, 10MB 이하만)
  onImageSelect?: (index: number, file: File) => void;
  // 메뉴 추가, 다시 시도, 사진 등록을 막는다 (예: 한 개씩 차례로 올리는 중)
  disabled?: boolean;
}

// 시트에서는 업로드 상태(올리지 못함 등) 없이 고른 사진으로 보여주고, 고친 메뉴도 고른 사진(selected)으로 넘긴다
const toSheetMenu = <TImage extends ImageValue | null>(
  menu: MenuListItem<TImage>,
) => ({
  ...menu,
  image:
    menu.image && menu.image.status !== 'saved'
      ? { status: 'selected' as const, file: menu.image.file }
      : menu.image,
});

// 바텀시트로 새 메뉴를 추가하는지, 몇 번째 메뉴를 수정하는지
type SheetState = { mode: 'add' } | { mode: 'edit'; index: number } | null;

const iconButtonClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary';

// 이미 올라간 사진은 주소로, 새로 고른 사진은 파일로 보여준다. 사진이 없으면 빈 자리를 보여준다.
// 올리는 중이면 진행률을, 올리지 못했으면 실패를 사진 위에 겹쳐 보여준다 (다시 시도 버튼은 메뉴 줄 오른쪽에 둔다)
const MenuImage = ({
  image,
  menuName,
}: {
  image: ImageValue | null;
  menuName: string;
}) => {
  const className = 'size-full rounded-lg object-cover';

  if (!image) {
    return (
      <span
        aria-hidden="true"
        className="flex size-18 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-disabled"
      >
        <ImageOff className="size-6" />
      </span>
    );
  }

  return (
    <span className="relative size-18 shrink-0">
      {image.status === 'saved' ? (
        <img alt="" className={className} src={image.url} />
      ) : (
        <FilePreviewImage className={className} file={image.file} />
      )}
      {image.status === 'uploading' && (
        <span
          aria-label={`${menuName} 사진 업로드 중`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(image.progress)}
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-bg-inverse/50 text-caption-mobile font-semibold text-text-on-inverse"
          role="progressbar"
        >
          {Math.round(image.progress)}%
        </span>
      )}
      {image.status === 'failed' && (
        <span className="absolute inset-0 flex items-center justify-center rounded-lg border border-status-danger-border bg-bg-inverse/60 text-caption-mobile font-semibold text-text-on-inverse">
          실패
        </span>
      )}
    </span>
  );
};

// 메뉴 줄 오른쪽의 사진 등록 버튼. 사진이 없는 메뉴에 사진만 다시 고르게 한다
const MenuImageSelectButton = ({
  disabled,
  menuName,
  onSelect,
  onError,
}: {
  disabled: boolean;
  menuName: string;
  onSelect: (file: File) => void;
  onError: (message: string | undefined) => void;
}) => (
  <label
    className={`${iconButtonClassName} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-action-primary has-disabled:cursor-not-allowed has-disabled:opacity-60`}
  >
    <input
      accept={ACCEPTED_IMAGE_TYPES.join(',')}
      aria-label={`${menuName} 사진 등록`}
      className="sr-only"
      disabled={disabled}
      onChange={(event) => {
        const [file] = Array.from(event.target.files ?? []);
        // 같은 사진을 다시 골라도 change가 일어나도록 비운다
        event.target.value = '';

        if (!file) {
          return;
        }

        const error = getImageFileError(file);
        onError(error);

        if (!error) {
          onSelect(file);
        }
      }}
      type="file"
    />
    <Camera aria-hidden="true" className="size-5" />
  </label>
);

// 대표 메뉴 목록과 추가·수정·삭제. 입점 등록과 가게 관리가 함께 쓴다.
// 개수 제한과 입력 규칙은 api의 값을 쓰는 쪽에서 넘긴다 (ui는 api의 값을 가져오지 않는다)
export const MenuListFields = <TImage extends ImageValue | null>({
  canEdit,
  disabled = false,
  getLockNotice,
  maxMenus,
  menus,
  notice,
  onChange,
  onImageSelect,
  onRetry,
  rules,
}: MenuListFieldsProps<TImage>) => {
  const [sheet, setSheet] = useState<SheetState>(null);
  // 사진 등록 버튼으로 고른 파일이 형식·용량 검사에 걸린 메뉴와 그 안내
  const [imageFileError, setImageFileError] = useState<{
    index: number;
    message: string;
  }>();

  const handleSave = (menu: MenuFormValues) => {
    if (sheet?.mode === 'edit') {
      onChange(
        menus.map((current, index) =>
          index === sheet.index ? { ...current, ...menu } : current,
        ),
      );
    } else {
      onChange([...menus, menu]);
    }

    setSheet(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님에게 보여줄 대표 메뉴를 최대 {maxMenus}개까지 등록할 수 있어요.
      </p>
      {notice && (
        <p className="-mt-3 text-caption-mobile break-keep text-text-secondary">
          {notice}
        </p>
      )}

      {menus.length > 0 && (
        <ul aria-label="등록한 대표 메뉴" className="flex flex-col gap-3">
          {menus.map((menu, index) => {
            const lockNotice = getLockNotice?.(menu);
            const isEditable = canEdit?.(menu) ?? true;
            const isFailed = menu.image?.status === 'failed';
            const canSelectImage = !menu.image && onImageSelect !== undefined;
            const fileError =
              imageFileError?.index === index
                ? imageFileError.message
                : undefined;
            const statusMessage = isFailed
              ? '올리지 못했어요. 다시 시도해 주세요.'
              : canSelectImage
                ? (fileError ?? '사진이 없어요. 사진을 등록해 주세요.')
                : undefined;

            return (
              <li
                className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-surface p-3"
                // 칸마다 따로 들고 있는 상태가 없어 순서로 구분한다
                key={index}
              >
                <div className="flex items-center gap-4">
                  <MenuImage image={menu.image} menuName={menu.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-mobile font-semibold text-text-primary">
                      {menu.name}
                    </p>
                    <p className="mt-0.5 text-body-sm-mobile text-text-secondary">
                      {formatPriceDigits(menu.price)}원
                    </p>
                    {statusMessage && (
                      <p
                        className="mt-0.5 text-caption-mobile break-keep text-status-danger-fg"
                        role="alert"
                      >
                        {statusMessage}
                      </p>
                    )}
                  </div>
                  {isFailed && onRetry && (
                    <button
                      aria-label={`${menu.name} 다시 올리기`}
                      className={`${iconButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
                      disabled={disabled}
                      onClick={() => onRetry(index)}
                      type="button"
                    >
                      <RotateCw aria-hidden="true" className="size-5" />
                    </button>
                  )}
                  {canSelectImage && (
                    <MenuImageSelectButton
                      disabled={disabled}
                      menuName={menu.name}
                      onError={(message) =>
                        setImageFileError(
                          message ? { index, message } : undefined,
                        )
                      }
                      onSelect={(file) => onImageSelect(index, file)}
                    />
                  )}
                  {isEditable && (
                    <button
                      aria-label={`${menu.name} 수정`}
                      className={iconButtonClassName}
                      onClick={() => setSheet({ mode: 'edit', index })}
                      type="button"
                    >
                      <SquarePen aria-hidden="true" className="size-5" />
                    </button>
                  )}
                  {isEditable && (
                    <button
                      aria-label={`${menu.name} 삭제`}
                      className={`-ml-3 ${iconButtonClassName}`}
                      onClick={() =>
                        onChange(
                          menus.filter((_, menuIndex) => menuIndex !== index),
                        )
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="size-5" />
                    </button>
                  )}
                </div>
                {lockNotice && (
                  <p className="flex items-center gap-1.5 text-caption-mobile break-keep text-text-secondary">
                    <Lock aria-hidden="true" className="size-3.5 shrink-0" />
                    {lockNotice}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {menus.length < maxMenus && (
        <button
          className="flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-surface-brand text-body-mobile font-semibold text-text-primary hover:border-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => setSheet({ mode: 'add' })}
          type="button"
        >
          <Plus aria-hidden="true" className="size-5 text-action-primary" />
          대표 메뉴 추가하기 ({menus.length}/{maxMenus})
        </button>
      )}

      {sheet && (
        <MenuFormSheet
          initialMenu={
            sheet.mode === 'edit' ? toSheetMenu(menus[sheet.index]) : undefined
          }
          onClose={() => setSheet(null)}
          onSave={handleSave}
          rules={rules}
        />
      )}
    </div>
  );
};
