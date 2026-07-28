import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { ModalProps } from 'antd';
import { Modal } from 'antd';
import { CloseOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useLabelStore } from '@/stores/labelStore';
import './AppModal.css';

type AppModalResizeSize = {
  width: number;
  height: number;
  offsetX: number;
};

type AppModalStyleSlots = {
  root?: CSSProperties;
  header?: CSSProperties;
  body?: CSSProperties;
  footer?: CSSProperties;
  container?: CSSProperties;
  title?: CSSProperties;
  wrapper?: CSSProperties;
  mask?: CSSProperties;
  /**
   * Backward-compatible alias from the earlier resize draft.
   * AntD v6 applies modal box styling through `container`, not `content`.
   */
  content?: CSSProperties;
};

type AppModalProps = ModalProps & {
  resizable?: boolean;
  showFullscreenToggle?: boolean;
  bodyScrollMode?: 'modal' | 'content';
  contentGap?: CSSProperties['gap'] | false;
  resizeMinWidth?: number;
  resizeMinHeight?: number;
  resizeMaxWidth?: number;
  resizeMaxHeight?: number;
};

type AppModalCssVars = CSSProperties & {
  '--app-modal-content-gap'?: string;
};

const DEFAULT_MIN_WIDTH = 720;
const DEFAULT_MIN_HEIGHT = 360;
const DEFAULT_WIDTH = 600;
const EXPAND_ICON_SRC = '/icons/ExpandOutlined.svg';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const ICON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 4,
  cursor: 'pointer',
  color: 'rgba(0,0,0,0.45)',
  transition: 'background 0.15s, color 0.15s',
};

function onHover(enter: boolean) {
  return (e: ReactMouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.backgroundColor = enter ? 'rgba(0,0,0,0.06)' : '';
    e.currentTarget.style.color = enter ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.45)';
  };
}

/**
 * Project-wide modal wrapper.
 * Fullscreen toggle and close share the same header area (closeIcon slot)
 * as two independent icons — each with its own hover via onMouseEnter/Leave.
 * antd's default close-button background hover is suppressed via AppModal.css.
 */
export default function AppModal({
  style,
  styles: outerStyles,
  width,
  closeIcon,
  closable,
  className,
  children,
  modalRender,
  resizable = false,
  showFullscreenToggle = true,
  bodyScrollMode,
  contentGap = 28,
  resizeMinWidth = DEFAULT_MIN_WIDTH,
  resizeMinHeight = DEFAULT_MIN_HEIGHT,
  resizeMaxWidth,
  resizeMaxHeight,
  centered = true,
  ...rest
}: AppModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizeSize, setResizeSize] = useState<AppModalResizeSize | null>(null);
  const cleanupResizeRef = useRef<(() => void) | null>(null);
  const t = useLabelStore((s) => s.t);
  useLabelStore((s) => s.labelsVersion);
  const resizeHandleLabel = t('COMPONENT.VIEW.TEXT_appModalResizeHandle', '모달 크기 조절');

  useEffect(() => {
    if (!rest.open) {
      setIsFullscreen(false);
      setResizeSize(null);
    }
  }, [rest.open]);

  useEffect(() => {
    setResizeSize(null);
  }, [width]);

  useEffect(() => {
    if (!showFullscreenToggle) {
      setIsFullscreen(false);
    }
  }, [showFullscreenToggle]);

  useEffect(() => () => {
    cleanupResizeRef.current?.();
  }, []);

  const toggleFullscreen = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (!showFullscreenToggle) return;
    setIsFullscreen((v) => !v);
  };

  const startResize = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizable || isFullscreen) return;

    e.preventDefault();
    e.stopPropagation();
    cleanupResizeRef.current?.();

    const resizeFrame = e.currentTarget.closest('.app-modal-resize-frame') as HTMLElement | null;
    const modalElement = e.currentTarget.closest('.ant-modal') as HTMLElement | null;
    const containerElement = resizeFrame?.querySelector('.ant-modal-container') as HTMLElement | null;
    const rect = containerElement?.getBoundingClientRect() ?? modalElement?.getBoundingClientRect();
    const startWidth = resizeSize?.width ?? rect?.width ?? (typeof width === 'number' ? width : DEFAULT_MIN_WIDTH);
    const startHeight = resizeSize?.height ?? rect?.height ?? DEFAULT_MIN_HEIGHT;
    const startOffsetX = resizeSize?.offsetX ?? 0;
    const startLeft = rect?.left ?? 0;
    const startRight = rect?.right ?? startLeft + startWidth;
    const startTop = rect?.top ?? 20;
    const startX = e.clientX;
    const startY = e.clientY;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const horizontalSpace = Math.max(
        0,
        Math.min(startLeft - 16, window.innerWidth - startRight - 16),
      );
      const viewportMaxWidth = Math.max(resizeMinWidth, startWidth + horizontalSpace * 2);
      const viewportMaxHeight = Math.max(resizeMinHeight, window.innerHeight - startTop - 16);
      const maxWidth = Math.min(resizeMaxWidth ?? viewportMaxWidth, viewportMaxWidth);
      const maxHeight = Math.min(resizeMaxHeight ?? viewportMaxHeight, viewportMaxHeight);
      const minWidth = Math.min(resizeMinWidth, startWidth, maxWidth);
      const minHeight = Math.min(resizeMinHeight, startHeight, maxHeight);
      const nextWidth = clamp(startWidth + (event.clientX - startX) * 2, minWidth, maxWidth);
      const nextHeight = clamp(startHeight + event.clientY - startY, minHeight, maxHeight);

      setResizeSize({
        width: nextWidth,
        height: nextHeight,
        offsetX: startOffsetX - (nextWidth - startWidth) / 2,
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      cleanupResizeRef.current = null;
    };

    cleanupResizeRef.current = handlePointerUp;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [
    isFullscreen,
    resizable,
    resizeMaxHeight,
    resizeMaxWidth,
    resizeMinHeight,
    resizeMinWidth,
    resizeSize,
    width,
  ]);

  // Two independent icons inside the closeIcon slot.
  // stopPropagation on the fullscreen span prevents antd from treating it as a close click.
  const mergedCloseIcon = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {showFullscreenToggle && (
        <span
          className="app-modal-header-icon"
          onClick={toggleFullscreen}
          style={ICON_STYLE}
          onMouseEnter={onHover(true)}
          onMouseLeave={onHover(false)}
        >
          {isFullscreen
            ? <FullscreenExitOutlined style={{ fontSize: 14 }} />
            : (
                <img
                  className="app-modal-header-icon__image"
                  src={EXPAND_ICON_SRC}
                  alt=""
                  aria-hidden="true"
                />
              )}
        </span>
      )}
      <span
        className="app-modal-header-icon"
        style={ICON_STYLE}
        onMouseEnter={onHover(true)}
        onMouseLeave={onHover(false)}
      >
        {closeIcon ?? <CloseOutlined style={{ fontSize: 14 }} />}
      </span>
    </span>
  );

  const contentGapStyle: AppModalCssVars | undefined = contentGap === false
    ? undefined
    : { '--app-modal-content-gap': typeof contentGap === 'number' ? `${contentGap}px` : contentGap };
  const modalStyle: CSSProperties = isFullscreen
    ? {
        ...contentGapStyle,
        top: 0,
        margin: 0,
        padding: 0,
        maxWidth: '100vw',
        height: '100vh',
        ...style,
      }
    : {
        ...contentGapStyle,
        // top:20을 inline style로 주면 antd centered 리셋(top:0)을 덮어써 정중앙이 깨짐
        ...(centered ? {} : { top: 20 }),
        ...style,
      };

  // Keep header/footer fixed and let the body own overflow on short viewports.
  const modalMaxHeight = isFullscreen ? '100vh' : 'calc(100vh - 40px)';
  const outerStyleSlots = typeof outerStyles === 'function'
    ? undefined
    : outerStyles as AppModalStyleSlots | undefined;
  const bodyOverflow = outerStyleSlots?.body?.overflow;
  const bodyOverflowY = outerStyleSlots?.body?.overflowY;
  const isBodyScrollDisabled = bodyOverflow === 'hidden'
    || bodyOverflow === 'clip'
    || bodyOverflowY === 'hidden'
    || bodyOverflowY === 'clip';
  const resolvedBodyScrollMode = bodyScrollMode ?? (isBodyScrollDisabled ? 'content' : 'modal');

  const canResize = resizable && !isFullscreen;
  const modalStyles = {
    ...outerStyleSlots,
    container: {
      padding: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      maxHeight: modalMaxHeight,
      overflow: 'hidden',
      ...outerStyleSlots?.container,
      ...outerStyleSlots?.content,
      ...(!isFullscreen && resizeSize && {
        width: resizeSize.width,
        height: resizeSize.height,
        maxHeight: 'none',
      }),
      ...(isFullscreen && { height: '100vh', borderRadius: 0 }),
    },
    body: {
      flex: '1 1 auto',
      minHeight: 0,
      maxHeight: 'none',
      ...(resolvedBodyScrollMode === 'content'
        ? { overflow: 'hidden' as const }
        : {
            overflowY: 'auto' as const,
            overflowX: 'hidden' as const,
          }),
      ...outerStyleSlots?.body,
      ...(!isFullscreen && resizeSize && {
        flex: 1,
        minHeight: 0,
        maxHeight: 'none',
      }),
    },
    ...(isFullscreen && {
      wrapper: { overflow: 'hidden' },
    }),
  };

  const resizeFrameStyle: CSSProperties | undefined = resizeSize && !isFullscreen
    ? {
        width: resizeSize.width,
        height: resizeSize.height,
        transform: `translateX(${resizeSize.offsetX}px)`,
      }
    : undefined;
  const mergedModalRender = (node: ReactNode) => {
    const renderedNode = modalRender ? modalRender(node) : node;

    if (!canResize) return renderedNode;

    return (
      <div className="app-modal-resize-frame" style={resizeFrameStyle}>
        {renderedNode}
        <button
          type="button"
          className="app-modal-resize-handle"
          aria-label={resizeHandleLabel}
          onPointerDown={startResize}
        />
      </div>
    );
  };
  const modalRenderProp = canResize || modalRender ? mergedModalRender : undefined;

  return (
    <Modal
      style={modalStyle}
      width={isFullscreen ? '100vw' : (width ?? DEFAULT_WIDTH)}
      styles={modalStyles}
      modalRender={modalRenderProp}
      centered={centered}
      closable={closable}
      closeIcon={closable !== false ? mergedCloseIcon : undefined}
      className={`app-modal${contentGap !== false ? ' app-modal--content-gap' : ''}${isFullscreen ? ' app-modal--fs' : ''}${canResize ? ' app-modal--resizable' : ''}${resolvedBodyScrollMode === 'content' ? ' app-modal--body-content-scroll' : ' app-modal--body-overlay-scroll'}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </Modal>
  );
}
