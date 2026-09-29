import type { PointerEvent, ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface BottomSheetProps {
  children: ReactNode;
  closeOnBackdrop?: boolean;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function BottomSheet({
  children,
  closeOnBackdrop = true,
  isOpen,
  onClose,
  title,
}: BottomSheetProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<number>();
  const closeDistance = 64;
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const titleId = useId();

  const handleClose = useCallback(() => {
    setDragOffset(0);
    setSheetHeight(undefined);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    dragStartHeight.current =
      sheetRef.current?.getBoundingClientRect().height ?? null;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) {
      return;
    }

    const dragDistance = event.clientY - dragStartY.current;

    if (dragDistance > 0) {
      setDragOffset(dragDistance);
      return;
    }

    const startHeight = dragStartHeight.current;

    if (startHeight === null) {
      return;
    }

    setDragOffset(0);
    setSheetHeight(
      Math.min(window.innerHeight * 0.9, startHeight - dragDistance),
    );
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const dragDistance =
      dragStartY.current === null ? 0 : event.clientY - dragStartY.current;

    if (dragDistance >= closeDistance) {
      handleClose();
    }

    dragStartY.current = null;
    dragStartHeight.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <div
      className="bg-black/40"
      onClick={() => {
        if (closeOnBackdrop) {
          handleClose();
        }
      }}
      style={{
        backgroundColor: 'rgb(0 0 0 / 0.4)',
        inset: 0,
        position: 'fixed',
        zIndex: 50,
      }}
    >
      <section
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className="bg-bg-surface"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        ref={sheetRef}
        style={{
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          height: sheetHeight,
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 150ms ease-out',
          width: '100%',
        }}
      >
        <div
          className="flex flex-col items-center px-4 pb-3 pt-3"
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 'var(--space-3)',
            paddingInline: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <span
            aria-hidden="true"
            className="bg-border-subtle"
            style={{
              backgroundColor: 'var(--color-border-subtle)',
              borderRadius: 'var(--radius-full)',
              display: 'block',
              height: 'var(--space-1)',
              width: 'calc(var(--space-16) + var(--space-4))',
            }}
          />
          {title ? (
            <h2
              className="mt-3 text-h3-mobile font-semibold text-text-primary"
              id={titleId}
              style={{ marginTop: 'var(--space-3)' }}
            >
              {title}
            </h2>
          ) : null}
        </div>
        <div className="px-4 pb-6 text-body-mobile text-text-primary">
          {children}
        </div>
      </section>
    </div>
  );
}
