import { useRef, useState, useCallback } from 'react';
import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  DeleteOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
} from '@ant-design/icons';

type ResizeAxis = 'x' | 'y' | 'xy';
type AlignValue = 'left' | 'center' | 'right';

// ── Resize handle ──────────────────────────────────────────────────────────────

function ResizeHandle({
  axis,
  style,
  onMouseDown,
}: {
  axis: ResizeAxis;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const cursor = axis === 'x' ? 'e-resize' : axis === 'y' ? 's-resize' : 'se-resize';
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        background: 'var(--color-primary, #1677ff)',
        border: '1px solid #fff',
        borderRadius: 2,
        cursor,
        ...style,
      }}
    />
  );
}

const ALIGN_ICONS: Record<AlignValue, React.ReactNode> = {
  left:   <AlignLeftOutlined   style={{ fontSize: 11 }} />,
  center: <AlignCenterOutlined style={{ fontSize: 11 }} />,
  right:  <AlignRightOutlined  style={{ fontSize: 11 }} />,
};

// ── Image NodeView ─────────────────────────────────────────────────────────────

function ImageNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [hovered, setHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const visible = selected || hovered;
  const attrWidth: string     = node.attrs.width  ?? 'auto';
  const attrHeight: string    = node.attrs.height ?? 'auto';
  const attrAlign: AlignValue = node.attrs.align  ?? 'left';

  // Alignment via display:block + margin-auto (works for any sized image)
  const alignStyle: React.CSSProperties =
    attrAlign === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } :
    attrAlign === 'right'  ? { marginLeft: 'auto', marginRight: 0 }      :
                             { marginLeft: 0, marginRight: 'auto' };

  const startResize = useCallback(
    (e: React.MouseEvent, axis: ResizeAxis) => {
      e.preventDefault();
      e.stopPropagation();

      const el = imgRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const final = { w: startW, h: startH };

      const cursor = axis === 'x' ? 'e-resize' : axis === 'y' ? 's-resize' : 'se-resize';
      document.body.style.cursor = cursor;
      document.body.style.userSelect = 'none';

      const onMouseMove = (ev: MouseEvent) => {
        const dX = ev.clientX - startX;
        const dY = ev.clientY - startY;
        // Direct DOM update — bypasses React/TipTap for smooth live preview
        if (axis !== 'y') { final.w = Math.max(50, startW + dX); el.style.width  = `${final.w}px`; }
        if (axis !== 'x') { final.h = Math.max(30, startH + dY); el.style.height = `${final.h}px`; }
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        // Commit final dimensions once on mouseup
        const attrs: Record<string, string> = {};
        if (axis !== 'y') attrs.width  = `${final.w}px`;
        if (axis !== 'x') attrs.height = `${final.h}px`;
        updateAttributes(attrs);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [updateAttributes],
  );

  return (
    // Outer wrapper: block element that fills the editor width
    <NodeViewWrapper as="div" style={{ display: 'block' }}>
      {/*
        Inner container: display:block + width:fit-content so the box shrinks to image size.
        margin-auto logic then centers/right-aligns the shrunken box within the full-width parent.
      */}
      <div
        style={{
          display: 'block',
          width: 'fit-content',
          maxWidth: '100%',
          position: 'relative',
          ...alignStyle,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt ?? ''}
          title={node.attrs.title ?? undefined}
          draggable={false}
          style={{
            display: 'block',
            width: attrWidth,
            height: attrHeight,
            maxWidth: '100%',
            outline: visible ? '2px solid var(--color-primary, #1677ff)' : 'none',
            outlineOffset: 2,
          }}
        />

        {visible && (
          <>
            {/* Alignment toolbar — top-left */}
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                display: 'flex',
                gap: 2,
                background: 'rgba(0,0,0,0.65)',
                borderRadius: 4,
                padding: '2px 4px',
              }}
            >
              {(['left', 'center', 'right'] as AlignValue[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  title={a === 'left' ? '왼쪽 정렬' : a === 'center' ? '가운데 정렬' : '오른쪽 정렬'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateAttributes({ align: a });
                  }}
                  style={{
                    width: 20,
                    height: 20,
                    border: 'none',
                    borderRadius: 3,
                    background: attrAlign === a ? 'rgba(255,255,255,0.3)' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {ALIGN_ICONS[a]}
                </button>
              ))}
            </div>

            {/* Delete button — top-right */}
            <button
              type="button"
              title="이미지 삭제"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteNode();
              }}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 24,
                height: 24,
                border: 'none',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 1,
              }}
            >
              <DeleteOutlined style={{ fontSize: 12 }} />
            </button>

            {/* Right-edge handle — width only */}
            <ResizeHandle
              axis="x"
              onMouseDown={(e) => startResize(e, 'x')}
              style={{ top: '50%', right: -5, width: 8, height: 20, transform: 'translateY(-50%)' }}
            />

            {/* Bottom-edge handle — height only */}
            <ResizeHandle
              axis="y"
              onMouseDown={(e) => startResize(e, 'y')}
              style={{ bottom: -5, left: '50%', width: 20, height: 8, transform: 'translateX(-50%)' }}
            />

            {/* Corner handle — width + height simultaneously */}
            <ResizeHandle
              axis="xy"
              onMouseDown={(e) => startResize(e, 'xy')}
              style={{ bottom: -5, right: -5, width: 12, height: 12 }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── Custom Image Extension ─────────────────────────────────────────────────────

export const ImageExtension = Image.extend({
  // Block node — essential for alignment via margin-auto
  inline: false,
  group: 'block',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('width') ?? el.style.width ?? null,
        renderHTML: () => ({}), // merged in renderHTML override below
      },
      height: {
        default: null,
        parseHTML: (el) => el.getAttribute('height') ?? el.style.height ?? null,
        renderHTML: () => ({}),
      },
      align: {
        default: null,
        parseHTML: (el) => {
          const v = el.style.marginLeft;
          if (v === 'auto' && el.style.marginRight === 'auto') return 'center';
          if (v === 'auto') return 'right';
          return null; // left / default
        },
        renderHTML: () => ({}),
      },
    };
  },

  // Merge width, height, align into a single style attribute
  renderHTML({ HTMLAttributes }) {
    const { width, height, align, ...rest } = HTMLAttributes;
    const parts: string[] = [];

    if (width)  parts.push(`width: ${width}`);
    if (height) parts.push(`height: ${height}`);

    // Alignment via margin-auto — works in browsers and email clients
    if (align === 'center') {
      parts.push('display: block', 'margin-left: auto', 'margin-right: auto');
    } else if (align === 'right') {
      parts.push('display: block', 'margin-left: auto');
    }

    const style = parts.join('; ');
    return ['img', { ...rest, ...(style ? { style } : {}) }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
