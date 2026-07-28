import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';
import { ImageExtension } from './ImageExtension';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Youtube } from '@tiptap/extension-youtube';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import ParagraphIndent from './ParagraphIndent';
import { common, createLowlight } from 'lowlight';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  PictureOutlined,
  TableOutlined,
  CodeOutlined,
  UndoOutlined,
  RedoOutlined,
  MinusOutlined,
  LoadingOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { Tooltip, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useThemeStore } from '@/stores/themeStore';
import './RichTextEditor.css';

const lowlight = createLowlight(common);

// Max file size: 10MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Convert File to base64 data URL (fallback when no onImageUpload provided)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  toolbar?: 'full' | 'compact' | 'minimal';
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  // Optional server upload handler.
  // If provided → server upload mode; if omitted → base64 embed mode.
  onImageUpload?: (file: File) => Promise<string>;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon, title, active, disabled, onClick }: ToolbarButtonProps) {
  return (
    <Tooltip title={title} mouseEnterDelay={0.5}>
      <button
        type="button"
        className={`ds-re-toolbar-btn${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

function ToolbarDivider() {
  return <span className="ds-re-toolbar-divider" />;
}

export default function RichTextEditor({
  value = '',
  onChange,
  toolbar = 'full',
  placeholder = '내용을 입력하세요...',
  readOnly = false,
  minHeight = 200,
  maxHeight,
  className,
  onImageUpload,
}: RichTextEditorProps) {
  const themeMode = useThemeStore((s) => s.mode);
  const isUpdatingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep latest onImageUpload in a ref so paste/drop handlers don't go stale
  const onImageUploadRef = useRef(onImageUpload);
  useEffect(() => {
    onImageUploadRef.current = onImageUpload;
  }, [onImageUpload]);

  // Mutable ref for the image processing logic — updated once editor is ready
  const imageHandlerRef = useRef<(file: File) => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,     // replaced by CodeBlockLowlight
        link: false,          // configured separately below
        underline: false,     // configured separately below
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      ImageExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Subscript,
      Superscript,
      ParagraphIndent,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      if (!isUpdatingRef.current) {
        onChange?.(ed.getHTML());
      }
    },
    editorProps: {
      // Clipboard paste: intercept image/* items
      handlePaste(_view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              imageHandlerRef.current(file);
              return true; // prevent default paste
            }
          }
        }
        return false;
      },
      // Drag-and-drop: intercept image files
      handleDrop(_view, event, _slice, moved) {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        let handled = false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            imageHandlerRef.current(file);
            handled = true;
          }
        }
        return handled;
      },
    },
  });

  // Update imageHandlerRef once editor is available
  useEffect(() => {
    imageHandlerRef.current = async (file: File) => {
      if (!editor) return;
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`이미지 크기가 너무 큽니다. (최대 ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
        return;
      }
      setIsUploading(true);
      try {
        const src = onImageUploadRef.current
          ? await onImageUploadRef.current(file)
          : await fileToBase64(file);
        editor.chain().focus().setImage({ src }).run();
        // Ensure cursor lands in an editable paragraph after the block image
        editor.commands.createParagraphNear();
      } catch {
        alert('이미지 처리에 실패했습니다.');
      } finally {
        setIsUploading(false);
      }
    };
  }, [editor]);

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value, { emitUpdate: false });
      isUpdatingRef.current = false;
    }
  }, [value, editor]);

  // Sync readOnly
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [readOnly, editor]);

  if (!editor) return null;

  const insertLink = () => {
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const insertYoutube = () => {
    const url = window.prompt('YouTube URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
      // Ensure cursor lands in an editable paragraph after the block video
      editor.commands.createParagraphNear();
    }
  };

  // Trigger hidden file input for toolbar button
  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) imageHandlerRef.current(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  const tableItems: MenuProps['items'] = [
    { key: 'insert', label: '테이블 삽입 (3x3)', onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { key: 'addColBefore', label: '왼쪽에 열 추가', onClick: () => editor.chain().focus().addColumnBefore().run() },
    { key: 'addColAfter', label: '오른쪽에 열 추가', onClick: () => editor.chain().focus().addColumnAfter().run() },
    { key: 'addRowBefore', label: '위에 행 추가', onClick: () => editor.chain().focus().addRowBefore().run() },
    { key: 'addRowAfter', label: '아래에 행 추가', onClick: () => editor.chain().focus().addRowAfter().run() },
    { type: 'divider' },
    { key: 'deleteCol', label: '열 삭제', onClick: () => editor.chain().focus().deleteColumn().run() },
    { key: 'deleteRow', label: '행 삭제', onClick: () => editor.chain().focus().deleteRow().run() },
    { key: 'deleteTable', label: '테이블 삭제', danger: true, onClick: () => editor.chain().focus().deleteTable().run() },
  ];

  const headingItems: MenuProps['items'] = [
    { key: 'h1', label: '제목 1', onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { key: 'h2', label: '제목 2', onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: 'h3', label: '제목 3', onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: 'p', label: '본문', onClick: () => editor.chain().focus().setParagraph().run() },
  ];

  const renderToolbar = () => {
    if (readOnly) return null;

    return (
      <div className="ds-re-toolbar">
        {/* Format: B/I/U/S */}
        <ToolbarButton icon={<BoldOutlined />} title="굵게" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton icon={<ItalicOutlined />} title="기울임" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton icon={<UnderlineOutlined />} title="밑줄" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        {toolbar === 'full' && (
          <ToolbarButton icon={<StrikethroughOutlined />} title="취소선" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
        )}

        {toolbar !== 'minimal' && (
          <>
            <ToolbarDivider />

            {/* Headings (full only) */}
            {toolbar === 'full' && (
              <>
                <Dropdown menu={{ items: headingItems }} trigger={['click']}>
                  <button type="button" className="ds-re-toolbar-btn ds-re-heading-btn">
                    {editor.isActive('heading', { level: 1 }) ? 'H1' :
                     editor.isActive('heading', { level: 2 }) ? 'H2' :
                     editor.isActive('heading', { level: 3 }) ? 'H3' : 'H'}
                  </button>
                </Dropdown>
                <ToolbarDivider />
              </>
            )}

            {/* Lists */}
            <ToolbarButton icon={<UnorderedListOutlined />} title="글머리 기호 목록" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolbarButton icon={<OrderedListOutlined />} title="번호 목록" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            {toolbar === 'full' && (
              <ToolbarButton icon={<CheckSquareOutlined />} title="체크리스트" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />
            )}

            {/* Alignment (full only) */}
            {toolbar === 'full' && (
              <>
                <ToolbarDivider />
                <ToolbarButton icon={<AlignLeftOutlined />} title="왼쪽 정렬" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
                <ToolbarButton icon={<AlignCenterOutlined />} title="가운데 정렬" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
                <ToolbarButton icon={<AlignRightOutlined />} title="오른쪽 정렬" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
              </>
            )}

            <ToolbarDivider />

            {/* Link */}
            <ToolbarButton icon={<LinkOutlined />} title="링크" active={editor.isActive('link')} onClick={insertLink} />

            {/* Image, Table, Code (full only) */}
            {toolbar === 'full' && (
              <>
                <ToolbarButton
                  icon={isUploading ? <LoadingOutlined spin /> : <PictureOutlined />}
                  title={onImageUpload ? '이미지 업로드' : '이미지 삽입 (base64)'}
                  disabled={isUploading}
                  onClick={insertImage}
                />
                <Dropdown menu={{ items: tableItems }} trigger={['click']}>
                  <button type="button" className={`ds-re-toolbar-btn${editor.isActive('table') ? ' active' : ''}`}>
                    <TableOutlined />
                  </button>
                </Dropdown>
                <ToolbarDivider />
                <ToolbarButton icon={<CodeOutlined />} title="코드 블록" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
                <ToolbarButton
                  icon={<span style={{ fontWeight: 600, fontSize: 14 }}>"</span>}
                  title="인용구"
                  active={editor.isActive('blockquote')}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <ToolbarButton icon={<MinusOutlined />} title="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
                <ToolbarButton icon={<YoutubeOutlined />} title="YouTube 동영상 삽입" onClick={insertYoutube} />
              </>
            )}

            <ToolbarDivider />

            {/* Undo/Redo */}
            <ToolbarButton icon={<UndoOutlined />} title="실행취소" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
            <ToolbarButton icon={<RedoOutlined />} title="다시실행" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
          </>
        )}
      </div>
    );
  };

  const wrapperClass = [
    'ds-rich-editor',
    themeMode === 'dark' ? 'ds-rich-editor-dark' : '',
    readOnly ? 'ds-rich-editor-readonly' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {/* Hidden file input for toolbar image button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      {renderToolbar()}
      <div
        className="ds-re-content"
        style={{
          minHeight,
          maxHeight,
          overflowY: maxHeight ? 'auto' : undefined,
        }}
        onClick={() => !readOnly && editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
