import { useState } from 'react';
import { Tabs, Card } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import RichTextEditor from '@/components/editors/RichTextEditor';
import DevPageHeader from '@/dev/DevPageHeader';

// ============================================================================
// Code Examples
// ============================================================================

const basicSetupCode = `import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function MyEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '<p>Hello World!</p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log(html);
    },
    editable: true,
  });

  return <EditorContent editor={editor} />;
}`;

const editorOptionsCode = `const editor = useEditor({
  // Array of extensions
  extensions: [StarterKit, Link, Image],

  // Initial content (an HTML string or JSON)
  content: '<p>Initial text</p>',

  // Whether editing is allowed
  editable: true,

  // Autofocus (true, false, 'start', 'end', number)
  autofocus: false,

  // Called when the content changes
  onUpdate: ({ editor }) => {
    console.log('Content changed:', editor.getHTML());
  },

  // Called when the editor is created
  onCreate: ({ editor }) => {
    console.log('Editor created');
  },

  // Called on focus
  onFocus: ({ editor, event }) => {
    console.log('Editor focused');
  },

  // Called on blur
  onBlur: ({ editor, event }) => {
    console.log('Editor blurred');
  },
});`;

const starterKitCode = `import StarterKit from '@tiptap/starter-kit';

// Extensions bundled in StarterKit:
// - Bold
// - Italic
// - Strike
// - Code (inline code)
// - Heading (h1–h6)
// - Paragraph
// - Text
// - BulletList (unordered list)
// - OrderedList (ordered list)
// - ListItem
// - Blockquote
// - CodeBlock
// - HorizontalRule
// - HardBreak (line break)
// - History (undo / redo)
// - Document, Dropcursor, Gapcursor

const editor = useEditor({
  extensions: [
    StarterKit,
  ],
});

// Disabling parts of StarterKit
const editor2 = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,  // disable headings
      codeBlock: false, // disable code blocks
    }),
  ],
});`;

const linkExtensionCode = `import Link from '@tiptap/extension-link';

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,  // don't open the link on click
      HTMLAttributes: {
        target: '_blank',  // open in a new tab
        rel: 'noopener noreferrer',
      },
    }),
  ],
});

// Inserting a link
editor.chain().focus().setLink({ href: 'https://example.com' }).run();

// Removing a link
editor.chain().focus().unsetLink().run();

// Checking whether a link is active
const isActive = editor.isActive('link');`;

const imageExtensionCode = `import Image from '@tiptap/extension-image';

const editor = useEditor({
  extensions: [
    StarterKit,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
  ],
});

// Inserting an image
editor.chain().focus().setImage({ src: 'https://example.com/image.jpg' }).run();

// With alt text
editor.chain().focus().setImage({
  src: 'https://example.com/image.jpg',
  alt: 'Image description',
  title: 'Image title',
}).run();`;

const tableExtensionCode = `import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const editor = useEditor({
  extensions: [
    StarterKit,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
});

// Inserting a table (3x3)
editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

// Adding and removing rows and columns
editor.chain().focus().addRowBefore().run();
editor.chain().focus().addRowAfter().run();
editor.chain().focus().addColumnBefore().run();
editor.chain().focus().addColumnAfter().run();
editor.chain().focus().deleteRow().run();
editor.chain().focus().deleteColumn().run();
editor.chain().focus().deleteTable().run();

// Merging cells
editor.chain().focus().mergeCells().run();
editor.chain().focus().splitCell().run();`;

const taskListExtensionCode = `import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

const editor = useEditor({
  extensions: [
    StarterKit,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
  ],
});

// Toggling a checklist
editor.chain().focus().toggleTaskList().run();`;

const otherExtensionsCode = `import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle,
    Color,
  ],
});

// Underline
editor.chain().focus().toggleUnderline().run();

// Alignment
editor.chain().focus().setTextAlign('left').run();
editor.chain().focus().setTextAlign('center').run();
editor.chain().focus().setTextAlign('right').run();
editor.chain().focus().setTextAlign('justify').run();

// Highlight
editor.chain().focus().toggleHighlight().run();
editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run();

// Text color
editor.chain().focus().setColor('#ff0000').run();
editor.chain().focus().unsetColor().run();`;

const customExtensionCode = `import { Node } from '@tiptap/core';

const CustomNode = Node.create({
  name: 'customNode',

  group: 'block',

  content: 'inline*',

  parseHTML() {
    return [
      { tag: 'div[data-type="custom"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'custom', ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      setCustomNode: () => ({ commands }) => {
        return commands.setNode(this.name);
      },
    };
  },
});

const editor = useEditor({
  extensions: [
    StarterKit,
    CustomNode,
  ],
});

// Usage
editor.chain().focus().setCustomNode().run();`;

const commandChainCode = `// Basic chain pattern
editor.chain().focus().toggleBold().run();

// Chaining several commands
editor.chain()
  .focus()
  .toggleBold()
  .toggleItalic()
  .run();

// Conditional execution (checked with can)
if (editor.can().toggleBold()) {
  editor.chain().focus().toggleBold().run();
}

// Common commands
editor.chain().focus().toggleBold().run();               // bold
editor.chain().focus().toggleItalic().run();             // italic
editor.chain().focus().toggleUnderline().run();          // underline
editor.chain().focus().toggleStrike().run();             // strikethrough
editor.chain().focus().toggleCode().run();               // inline code
editor.chain().focus().toggleHeading({ level: 1 }).run(); // heading
editor.chain().focus().toggleBulletList().run();         // bullet list
editor.chain().focus().toggleOrderedList().run();        // ordered list
editor.chain().focus().toggleBlockquote().run();         // block quote
editor.chain().focus().toggleCodeBlock().run();          // code block
editor.chain().focus().setHorizontalRule().run();        // horizontal rule
editor.chain().focus().setHardBreak().run();             // line break
editor.chain().focus().undo().run();                     // undo
editor.chain().focus().redo().run();                     // redo`;

const activeStateCode = `// Checking active state
editor.isActive('bold');                        // bold
editor.isActive('italic');                      // italic
editor.isActive('underline');                   // underline
editor.isActive('strike');                      // strikethrough
editor.isActive('code');                        // inline code
editor.isActive('heading', { level: 1 });       // heading 1
editor.isActive('bulletList');                  // bullet list
editor.isActive('orderedList');                 // ordered list
editor.isActive('blockquote');                  // block quote
editor.isActive('codeBlock');                   // code block
editor.isActive({ textAlign: 'left' });         // left aligned
editor.isActive({ textAlign: 'center' });       // center aligned
editor.isActive('link');                        // link
editor.isActive('highlight');                   // highlight

// Reading color values
editor.getAttributes('textStyle').color;        // text color
editor.getAttributes('highlight').color;        // highlight color`;

const toolbarComponentCode = `import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

function Toolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'is-active' : ''}
      >
        Underline
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        Undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        Redo
      </button>
    </div>
  );
}

function MyEditor() {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '<p>Hello World!</p>',
  });

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}`;

const contentManagementCode = `// Getting HTML
const html = editor.getHTML();
console.log(html); // '<p>Hello <strong>World</strong>!</p>'

// Getting JSON (the ProseMirror document)
const json = editor.getJSON();

// Getting plain text
const text = editor.getText();

// Text within a range
const rangeText = editor.getText({ from: 0, to: 5 });

// With a separator between blocks
const textWithSeparator = editor.getText({ blockSeparator: '\\n\\n' });`;

const setContentCode = `// Setting HTML content
editor.commands.setContent('<p>New content</p>');

// Setting JSON content
editor.commands.setContent({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'New content' }],
    },
  ],
});

// Clearing the content
editor.commands.clearContent();

// The emitUpdate option (whether onUpdate fires)
editor.commands.setContent('<p>New content</p>', {
  emitUpdate: false, // does not trigger onUpdate
});`;

const onUpdateCode = `const editor = useEditor({
  extensions: [StarterKit],
  content: '<p>Initial content</p>',
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    onChange?.(html);
  },
});

// Wiring it to React state
function MyEditor() {
  const [content, setContent] = useState('<p>Initial</p>');

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  return (
    <div>
      <EditorContent editor={editor} />
      <div>Preview: {content}</div>
    </div>
  );
}`;

const richTextEditorUsageCode = `import RichTextEditor from '@/components/editors/RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('<p>Hello World!</p>');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      toolbar="full"
      placeholder="Type something..."
      minHeight={200}
      maxHeight={600}
    />
  );
}`;

const toolbarModesCode = `// full: every formatting feature (text, paragraph, insert, alignment)
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="full"
/>

// compact: only the common formats (text styles, lists, links)
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="compact"
/>

// minimal: basic text styles only (bold, italic, underline)
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="minimal"
/>`;

// ============================================================================
// Component
// ============================================================================

export default function GuideTipTap() {
  const [demoContent, setDemoContent] = useState('<p>Try editing this right here!</p>');
  const [demoMode, setDemoMode] = useState<'full' | 'compact' | 'minimal'>('full');
  const [demoReadOnly, setDemoReadOnly] = useState(false);

  const tabItems = [
    {
      key: '1',
      label: 'Basic setup',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            The basic setup and usage of the TipTap editor.
          </p>

          <div className="demo-section">
            <h3>The useEditor hook</h3>
            <p>TipTap ships a React hook API. Create an editor instance with the useEditor hook.</p>
            <CodeSnippet code={basicSetupCode} title="Basic usage" />
          </div>

          <div className="demo-section">
            <h3>Editor options</h3>
            <p>useEditor supports a range of options.</p>
            <CodeSnippet code={editorOptionsCode} title="Editor options" />
          </div>

          <div className="demo-section">
            <h3>The EditorContent component</h3>
            <p>The component that renders the editor UI. Pass it the editor instance as a prop.</p>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <code style={{ fontSize: 13 }}>
                {'<EditorContent editor={editor} />'}
              </code>
            </Card>
          </div>

          <div className="demo-section">
            <h3>Extensions</h3>
            <p>
              TipTap has an extension-based architecture.
              You add only the features you actually need.
            </p>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>• StarterKit: the base bundle of extensions (Bold, Italic, Heading, List, …)</div>
                <div>• Link: inserting links</div>
                <div>• Image: inserting images</div>
                <div>• Table: tables</div>
                <div>• TaskList: checklists</div>
                <div>• Underline: underlining</div>
                <div>• TextAlign: alignment</div>
                <div>• Highlight: highlighting</div>
                <div>• Color: text color</div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Extensions',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            TipTap's extensions and how to use them.
          </p>

          <div className="demo-section">
            <h3>StarterKit</h3>
            <p>StarterKit bundles the most commonly used extensions.</p>
            <CodeSnippet code={starterKitCode} title="Using StarterKit" />
          </div>

          <div className="demo-section">
            <h3>The Link extension</h3>
            <p>Adds the ability to insert and manage links.</p>
            <CodeSnippet code={linkExtensionCode} title="The Link extension" />
          </div>

          <div className="demo-section">
            <h3>The Image extension</h3>
            <p>Adds image insertion. URLs and Base64 images are both supported.</p>
            <CodeSnippet code={imageExtensionCode} title="The Image extension" />
          </div>

          <div className="demo-section">
            <h3>The Table extension</h3>
            <p>Adds table creation and editing.</p>
            <CodeSnippet code={tableExtensionCode} title="The Table extension" />
          </div>

          <div className="demo-section">
            <h3>The TaskList extension</h3>
            <p>Lets you build checklists with checkboxes.</p>
            <CodeSnippet code={taskListExtensionCode} title="The TaskList extension" />
          </div>

          <div className="demo-section">
            <h3>Other extensions</h3>
            <p>Underline, alignment, highlighting and color are available as extensions too.</p>
            <CodeSnippet code={otherExtensionsCode} title="Underline, TextAlign, Highlight, Color" />
          </div>

          <div className="demo-section">
            <h3>Writing a custom extension</h3>
            <p>When you need something else, you can write your own extension.</p>
            <CodeSnippet code={customExtensionCode} title="Custom extension example" />
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: 'Custom toolbar',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            How to build your own toolbar out of the editor's commands.
          </p>

          <div className="demo-section">
            <h3>The chain pattern</h3>
            <p>TipTap runs commands through a chain pattern.</p>
            <CodeSnippet code={commandChainCode} title="Command chains" />
          </div>

          <div className="demo-section">
            <h3>Checking active state</h3>
            <p>The isActive method tells you the formatting state of the current selection.</p>
            <CodeSnippet code={activeStateCode} title="Checking active state" />
          </div>

          <div className="demo-section">
            <h3>Toolbar component example</h3>
            <p>Commands plus active state are all you need for a simple toolbar.</p>
            <CodeSnippet code={toolbarComponentCode} title="Toolbar component" />
          </div>

          <div className="demo-section">
            <h3>Command cheat sheet</h3>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>Text styles:</strong> toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode</div>
                <div><strong>Paragraph:</strong> toggleHeading, setParagraph, toggleBlockquote</div>
                <div><strong>Lists:</strong> toggleBulletList, toggleOrderedList, toggleTaskList</div>
                <div><strong>Alignment:</strong> setTextAlign('left' | 'center' | 'right' | 'justify')</div>
                <div><strong>Color:</strong> setColor, setHighlight</div>
                <div><strong>Insert:</strong> setLink, setImage, insertTable, setHorizontalRule</div>
                <div><strong>History:</strong> undo, redo</div>
                <div><strong>Content:</strong> setContent, clearContent</div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Content management',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            How to read and write the editor's content.
          </p>

          <div className="demo-section">
            <h3>Reading content</h3>
            <p>Editor content can be read as HTML, JSON or plain text.</p>
            <CodeSnippet code={contentManagementCode} title="getHTML, getJSON, getText" />
          </div>

          <div className="demo-section">
            <h3>Writing content</h3>
            <p>The content can be set programmatically.</p>
            <CodeSnippet code={setContentCode} title="setContent, clearContent" />
          </div>

          <div className="demo-section">
            <h3>Detecting changes</h3>
            <p>The onUpdate callback lets you observe changes and lift them to a parent component.</p>
            <CodeSnippet code={onUpdateCode} title="The onUpdate callback" />
          </div>

          <div className="demo-section">
            <h3>Comparing content formats</h3>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>HTML:</strong> best for storing on the server and rendering. The most common choice.</div>
                <div><strong>JSON:</strong> preserves editor state exactly. Better for versioning and collaboration.</div>
                <div><strong>Text:</strong> used for search, previews and character counts.</div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '5',
      label: 'RichTextEditor in this project',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            How to use the RichTextEditor component in VAMC NPL ADMIN, plus a live demo.
          </p>

          <div className="demo-section">
            <h3>Basic usage</h3>
            <p>RichTextEditor is a reusable component wrapping TipTap.</p>
            <CodeSnippet code={richTextEditorUsageCode} title="Basic usage" />
          </div>

          <div className="demo-section">
            <h3>Toolbar modes</h3>
            <p>The toolbar prop controls how many formatting features are exposed.</p>
            <CodeSnippet code={toolbarModesCode} title="Comparing toolbar modes" />
            <Card size="small" style={{ background: 'var(--bg-secondary)', marginTop: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>full:</strong> everything — text styles, headings, lists, links, images, tables, alignment, color</div>
                <div><strong>compact:</strong> only the common ones — text styles, lists, links</div>
                <div><strong>minimal:</strong> basic text styles only — bold, italic, underline</div>
              </div>
            </Card>
          </div>

          <div className="demo-section">
            <h3>Live demo</h3>
            <p>Try the real RichTextEditor below.</p>

            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ marginRight: 8, fontSize: 13 }}>Toolbar mode:</span>
                  {(['full', 'compact', 'minimal'] as const).map((mode) => (
                    <label key={mode} style={{ marginRight: 16, fontSize: 13 }}>
                      <input
                        type="radio"
                        value={mode}
                        checked={demoMode === mode}
                        onChange={(e) => setDemoMode(e.target.value as typeof mode)}
                        style={{ marginRight: 4 }}
                      />
                      {mode}
                    </label>
                  ))}
                </div>
                <label style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={demoReadOnly}
                    onChange={(e) => setDemoReadOnly(e.target.checked)}
                    style={{ marginRight: 4 }}
                  />
                  Read only
                </label>
              </div>
            </Card>

            <RichTextEditor
              value={demoContent}
              onChange={setDemoContent}
              toolbar={demoMode}
              placeholder="Type your content here..."
              readOnly={demoReadOnly}
              minHeight={300}
              maxHeight={500}
            />

            <Card
              size="small"
              style={{ marginTop: 16, background: 'var(--bg-secondary)' }}
              title={<span style={{ fontSize: 13, fontWeight: 500 }}>Current HTML output</span>}
            >
              <pre style={{
                fontSize: 12,
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: 'var(--text-secondary)',
              }}>
                {demoContent}
              </pre>
            </Card>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideTipTap" />
      <Tabs items={tabItems} />
    </div>
  );
}
