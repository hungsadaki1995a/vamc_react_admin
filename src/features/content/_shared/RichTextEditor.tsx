import { useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  ItalicOutlined,
  LineOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  TableOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';
import styles from './rich-text-editor.module.scss';

// Rich text editor of the content pages (About VAMC Overview / Organization Chart bodies).
// Toolbar of the v0.8 design: B I U S H | lists, checklist | align | link, image, table | code, quote, rule, video | undo, redo.
// The value is HTML; an empty document is reported as ''.

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Red border (E01 under the field). */
  invalid?: boolean;
  /** Accessible name of the editing area. */
  ariaLabel?: string;
}

const EXTENSIONS = [
  StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Image,
  TableKit.configure({ table: { resizable: false } }),
  Youtube.configure({ nocookie: true }),
];

function toHtml(editor: Editor): string {
  return editor.isEmpty ? '' : editor.getHTML();
}

/** Asks for a URL with the browser prompt (link / image / video). */
function askUrl(label: string, current = ''): string | null {
  const url = window.prompt(label, current);
  if (url === null) return null;
  return url.trim();
}

interface ToolProps {
  title: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function Tool({ title, icon, active, disabled, onClick }: ToolProps) {
  return (
    <button
      type="button"
      className={active ? `${styles.tool} ${styles.toolActive}` : styles.tool}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the selection in the editor while clicking the toolbar
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      heading: e.isActive('heading'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      taskList: e.isActive('taskList'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      link: e.isActive('link'),
      codeBlock: e.isActive('codeBlock'),
      blockquote: e.isActive('blockquote'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  const setLink = () => {
    const url = askUrl('Link URL', editor.getAttributes('link').href as string | undefined);
    if (url === null) return;
    if (url === '') chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = askUrl('Image URL');
    if (url) chain().setImage({ src: url }).run();
  };
  const addVideo = () => {
    const url = askUrl('YouTube URL');
    if (url) chain().setYoutubeVideo({ src: url }).run();
  };

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
      <Tool title="Bold" icon={<BoldOutlined />} active={state.bold} disabled={disabled} onClick={() => chain().toggleBold().run()} />
      <Tool title="Italic" icon={<ItalicOutlined />} active={state.italic} disabled={disabled} onClick={() => chain().toggleItalic().run()} />
      <Tool title="Underline" icon={<UnderlineOutlined />} active={state.underline} disabled={disabled} onClick={() => chain().toggleUnderline().run()} />
      <Tool title="Strikethrough" icon={<StrikethroughOutlined />} active={state.strike} disabled={disabled} onClick={() => chain().toggleStrike().run()} />
      <span className={styles.divider} />
      <Tool
        title="Heading"
        icon={<span className={styles.glyph}>H</span>}
        active={state.heading}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      />
      <span className={styles.divider} />
      <Tool title="Bullet list" icon={<UnorderedListOutlined />} active={state.bulletList} disabled={disabled} onClick={() => chain().toggleBulletList().run()} />
      <Tool title="Numbered list" icon={<OrderedListOutlined />} active={state.orderedList} disabled={disabled} onClick={() => chain().toggleOrderedList().run()} />
      <Tool title="Checklist" icon={<CheckSquareOutlined />} active={state.taskList} disabled={disabled} onClick={() => chain().toggleTaskList().run()} />
      <span className={styles.divider} />
      <Tool title="Align left" icon={<AlignLeftOutlined />} active={state.left} disabled={disabled} onClick={() => chain().setTextAlign('left').run()} />
      <Tool title="Align center" icon={<AlignCenterOutlined />} active={state.center} disabled={disabled} onClick={() => chain().setTextAlign('center').run()} />
      <Tool title="Align right" icon={<AlignRightOutlined />} active={state.right} disabled={disabled} onClick={() => chain().setTextAlign('right').run()} />
      <span className={styles.divider} />
      <Tool title="Link" icon={<LinkOutlined />} active={state.link} disabled={disabled} onClick={setLink} />
      <Tool title="Image" icon={<PictureOutlined />} disabled={disabled} onClick={addImage} />
      <Tool
        title="Table"
        icon={<TableOutlined />}
        disabled={disabled}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <span className={styles.divider} />
      <Tool title="Code block" icon={<CodeOutlined />} active={state.codeBlock} disabled={disabled} onClick={() => chain().toggleCodeBlock().run()} />
      <Tool
        title="Quote"
        icon={<span className={styles.glyph}>&quot;</span>}
        active={state.blockquote}
        disabled={disabled}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <Tool title="Horizontal rule" icon={<LineOutlined />} disabled={disabled} onClick={() => chain().setHorizontalRule().run()} />
      <Tool title="Video" icon={<YoutubeOutlined />} disabled={disabled} onClick={addVideo} />
      <span className={styles.divider} />
      <Tool title="Undo" icon={<UndoOutlined />} disabled={disabled || !state.canUndo} onClick={() => chain().undo().run()} />
      <Tool title="Redo" icon={<RedoOutlined />} disabled={disabled || !state.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
  invalid = false,
  ariaLabel,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: placeholder ? [...EXTENSIONS, Placeholder.configure({ placeholder })] : EXTENSIONS,
    content: value,
    editable: !disabled,
    editorProps: { attributes: { class: styles.content, ...(ariaLabel ? { 'aria-label': ariaLabel } : {}) } },
    onUpdate: ({ editor: e }) => onChange(toHtml(e)),
  });

  // Value replaced from outside (data loaded after mount)
  useEffect(() => {
    if (editor && value !== toHtml(editor)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const frameClass = [styles.editor, invalid ? styles.invalid : '', disabled ? styles.disabled : ''].filter(Boolean).join(' ');

  return (
    <div className={frameClass}>
      {editor && <Toolbar editor={editor} disabled={disabled} />}
      <EditorContent editor={editor} className={styles.body} />
    </div>
  );
}
