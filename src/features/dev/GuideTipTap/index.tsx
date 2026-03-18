import { useState } from 'react';
import { Tabs, Card } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import RichTextEditor from '@/components/editors/RichTextEditor';

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
  // 확장 프로그램 배열
  extensions: [StarterKit, Link, Image],

  // 초기 콘텐츠 (HTML 문자열 또는 JSON)
  content: '<p>초기 텍스트</p>',

  // 편집 가능 여부
  editable: true,

  // 자동 포커스 (true, false, 'start', 'end', number)
  autofocus: false,

  // 콘텐츠 변경 시 콜백
  onUpdate: ({ editor }) => {
    console.log('Content changed:', editor.getHTML());
  },

  // 생성 시 콜백
  onCreate: ({ editor }) => {
    console.log('Editor created');
  },

  // 포커스 시 콜백
  onFocus: ({ editor, event }) => {
    console.log('Editor focused');
  },

  // 블러 시 콜백
  onBlur: ({ editor, event }) => {
    console.log('Editor blurred');
  },
});`;

const starterKitCode = `import StarterKit from '@tiptap/starter-kit';

// StarterKit에 포함된 확장들:
// - Bold (굵게)
// - Italic (기울임)
// - Strike (취소선)
// - Code (인라인 코드)
// - Heading (제목 h1~h6)
// - Paragraph (문단)
// - Text (텍스트)
// - BulletList (순서 없는 목록)
// - OrderedList (순서 있는 목록)
// - ListItem (목록 항목)
// - Blockquote (인용구)
// - CodeBlock (코드 블록)
// - HorizontalRule (수평선)
// - HardBreak (줄바꿈)
// - History (실행취소/재실행)
// - Document, Dropcursor, Gapcursor

const editor = useEditor({
  extensions: [
    StarterKit,
  ],
});

// StarterKit 일부 비활성화
const editor2 = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,  // 제목 비활성화
      codeBlock: false, // 코드 블록 비활성화
    }),
  ],
});`;

const linkExtensionCode = `import Link from '@tiptap/extension-link';

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,  // 클릭 시 링크 열기 비활성화
      HTMLAttributes: {
        target: '_blank',  // 새 탭에서 열기
        rel: 'noopener noreferrer',
      },
    }),
  ],
});

// 링크 삽입
editor.chain().focus().setLink({ href: 'https://example.com' }).run();

// 링크 제거
editor.chain().focus().unsetLink().run();

// 링크 활성 상태 확인
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

// 이미지 삽입
editor.chain().focus().setImage({ src: 'https://example.com/image.jpg' }).run();

// alt 텍스트와 함께
editor.chain().focus().setImage({
  src: 'https://example.com/image.jpg',
  alt: '이미지 설명',
  title: '이미지 제목',
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

// 테이블 삽입 (3x3)
editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

// 행/열 추가/삭제
editor.chain().focus().addRowBefore().run();
editor.chain().focus().addRowAfter().run();
editor.chain().focus().addColumnBefore().run();
editor.chain().focus().addColumnAfter().run();
editor.chain().focus().deleteRow().run();
editor.chain().focus().deleteColumn().run();
editor.chain().focus().deleteTable().run();

// 셀 병합
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

// 체크리스트 토글
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

// 밑줄
editor.chain().focus().toggleUnderline().run();

// 정렬
editor.chain().focus().setTextAlign('left').run();
editor.chain().focus().setTextAlign('center').run();
editor.chain().focus().setTextAlign('right').run();
editor.chain().focus().setTextAlign('justify').run();

// 형광펜
editor.chain().focus().toggleHighlight().run();
editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run();

// 텍스트 색상
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

// 사용
editor.chain().focus().setCustomNode().run();`;

const commandChainCode = `// 기본 체인 패턴
editor.chain().focus().toggleBold().run();

// 여러 명령 체인
editor.chain()
  .focus()
  .toggleBold()
  .toggleItalic()
  .run();

// 조건부 실행 (can으로 확인)
if (editor.can().toggleBold()) {
  editor.chain().focus().toggleBold().run();
}

// 주요 커맨드들
editor.chain().focus().toggleBold().run();               // 굵게
editor.chain().focus().toggleItalic().run();             // 기울임
editor.chain().focus().toggleUnderline().run();          // 밑줄
editor.chain().focus().toggleStrike().run();             // 취소선
editor.chain().focus().toggleCode().run();               // 인라인 코드
editor.chain().focus().toggleHeading({ level: 1 }).run(); // 제목
editor.chain().focus().toggleBulletList().run();         // 순서 없는 목록
editor.chain().focus().toggleOrderedList().run();        // 순서 있는 목록
editor.chain().focus().toggleBlockquote().run();         // 인용구
editor.chain().focus().toggleCodeBlock().run();          // 코드 블록
editor.chain().focus().setHorizontalRule().run();        // 수평선
editor.chain().focus().setHardBreak().run();             // 줄바꿈
editor.chain().focus().undo().run();                     // 실행취소
editor.chain().focus().redo().run();                     // 재실행`;

const activeStateCode = `// 활성 상태 확인
editor.isActive('bold');                        // 굵게
editor.isActive('italic');                      // 기울임
editor.isActive('underline');                   // 밑줄
editor.isActive('strike');                      // 취소선
editor.isActive('code');                        // 인라인 코드
editor.isActive('heading', { level: 1 });       // 제목 1
editor.isActive('bulletList');                  // 순서 없는 목록
editor.isActive('orderedList');                 // 순서 있는 목록
editor.isActive('blockquote');                  // 인용구
editor.isActive('codeBlock');                   // 코드 블록
editor.isActive({ textAlign: 'left' });         // 왼쪽 정렬
editor.isActive({ textAlign: 'center' });       // 가운데 정렬
editor.isActive('link');                        // 링크
editor.isActive('highlight');                   // 형광펜

// 색상 값 가져오기
editor.getAttributes('textStyle').color;        // 텍스트 색상
editor.getAttributes('highlight').color;        // 형광펜 색상`;

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

const contentManagementCode = `// HTML 가져오기
const html = editor.getHTML();
console.log(html); // '<p>Hello <strong>World</strong>!</p>'

// JSON 가져오기 (ProseMirror document)
const json = editor.getJSON();

// 순수 텍스트 가져오기
const text = editor.getText();

// 특정 범위 텍스트
const rangeText = editor.getText({ from: 0, to: 5 });

// 구분자와 함께 (블록 사이)
const textWithSeparator = editor.getText({ blockSeparator: '\\n\\n' });`;

const setContentCode = `// HTML 콘텐츠 설정
editor.commands.setContent('<p>New content</p>');

// JSON 콘텐츠 설정
editor.commands.setContent({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'New content' }],
    },
  ],
});

// 콘텐츠 초기화
editor.commands.clearContent();

// emitUpdate 옵션 (onUpdate 콜백 트리거 여부)
editor.commands.setContent('<p>New content</p>', {
  emitUpdate: false, // onUpdate 트리거 안 함
});`;

const onUpdateCode = `const editor = useEditor({
  extensions: [StarterKit],
  content: '<p>Initial content</p>',
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    onChange?.(html);
  },
});

// React 상태와 연동
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
      placeholder="내용을 입력하세요..."
      minHeight={200}
      maxHeight={600}
    />
  );
}`;

const toolbarModesCode = `// full: 모든 서식 기능 (텍스트, 문단, 삽입, 정렬)
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="full"
/>

// compact: 자주 쓰는 서식만 (텍스트 스타일, 목록, 링크)
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="compact"
/>

// minimal: 기본 텍스트 스타일만 (굵게, 기울임, 밑줄)
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="minimal"
/>`;

// ============================================================================
// Component
// ============================================================================

export default function GuideTipTap() {
  const [demoContent, setDemoContent] = useState('<p>여기서 직접 편집해보세요!</p>');
  const [demoMode, setDemoMode] = useState<'full' | 'compact' | 'minimal'>('full');
  const [demoReadOnly, setDemoReadOnly] = useState(false);

  const tabItems = [
    {
      key: '1',
      label: '기본 설정',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            TipTap 에디터의 기본 설정과 사용법을 알아봅니다.
          </p>

          <div className="demo-section">
            <h3>useEditor 훅</h3>
            <p>TipTap은 React Hook API를 제공합니다. useEditor 훅으로 에디터 인스턴스를 생성합니다.</p>
            <CodeSnippet code={basicSetupCode} title="기본 사용 예시" />
          </div>

          <div className="demo-section">
            <h3>에디터 옵션</h3>
            <p>useEditor는 다양한 옵션을 지원합니다.</p>
            <CodeSnippet code={editorOptionsCode} title="에디터 옵션" />
          </div>

          <div className="demo-section">
            <h3>EditorContent 컴포넌트</h3>
            <p>에디터 UI를 렌더링하는 컴포넌트입니다. editor 인스턴스를 props로 전달합니다.</p>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <code style={{ fontSize: 13 }}>
                {'<EditorContent editor={editor} />'}
              </code>
            </Card>
          </div>

          <div className="demo-section">
            <h3>Extensions</h3>
            <p>
              TipTap은 확장(extension) 기반 아키텍처입니다.
              필요한 기능만 선택적으로 추가할 수 있습니다.
            </p>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>• StarterKit: 기본 확장 모음 (Bold, Italic, Heading, List 등)</div>
                <div>• Link: 링크 삽입</div>
                <div>• Image: 이미지 삽입</div>
                <div>• Table: 테이블</div>
                <div>• TaskList: 체크리스트</div>
                <div>• Underline: 밑줄</div>
                <div>• TextAlign: 정렬</div>
                <div>• Highlight: 형광펜</div>
                <div>• Color: 텍스트 색상</div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: '확장 (Extensions)',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            TipTap의 다양한 확장 프로그램과 사용법을 알아봅니다.
          </p>

          <div className="demo-section">
            <h3>StarterKit</h3>
            <p>StarterKit은 가장 많이 사용하는 확장들을 묶은 패키지입니다.</p>
            <CodeSnippet code={starterKitCode} title="StarterKit 사용" />
          </div>

          <div className="demo-section">
            <h3>Link 확장</h3>
            <p>링크를 삽입하고 관리하는 기능을 제공합니다.</p>
            <CodeSnippet code={linkExtensionCode} title="Link 확장" />
          </div>

          <div className="demo-section">
            <h3>Image 확장</h3>
            <p>이미지를 삽입하는 기능을 제공합니다. URL 또는 Base64 이미지를 지원합니다.</p>
            <CodeSnippet code={imageExtensionCode} title="Image 확장" />
          </div>

          <div className="demo-section">
            <h3>Table 확장</h3>
            <p>테이블을 생성하고 편집하는 기능을 제공합니다.</p>
            <CodeSnippet code={tableExtensionCode} title="Table 확장" />
          </div>

          <div className="demo-section">
            <h3>TaskList 확장</h3>
            <p>체크박스가 있는 체크리스트를 만들 수 있습니다.</p>
            <CodeSnippet code={taskListExtensionCode} title="TaskList 확장" />
          </div>

          <div className="demo-section">
            <h3>기타 확장</h3>
            <p>밑줄, 정렬, 형광펜, 색상 등의 확장을 사용할 수 있습니다.</p>
            <CodeSnippet code={otherExtensionsCode} title="Underline, TextAlign, Highlight, Color" />
          </div>

          <div className="demo-section">
            <h3>커스텀 확장 만들기</h3>
            <p>필요한 경우 직접 확장을 만들 수 있습니다.</p>
            <CodeSnippet code={customExtensionCode} title="커스텀 확장 예시" />
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: '커스텀 툴바',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            에디터의 커맨드를 사용해 커스텀 툴바를 만드는 방법을 알아봅니다.
          </p>

          <div className="demo-section">
            <h3>체인 패턴</h3>
            <p>TipTap은 체인(chain) 패턴으로 커맨드를 실행합니다.</p>
            <CodeSnippet code={commandChainCode} title="커맨드 체인" />
          </div>

          <div className="demo-section">
            <h3>활성 상태 확인</h3>
            <p>isActive 메서드로 현재 선택된 텍스트의 서식 상태를 확인할 수 있습니다.</p>
            <CodeSnippet code={activeStateCode} title="활성 상태 확인" />
          </div>

          <div className="demo-section">
            <h3>툴바 컴포넌트 예시</h3>
            <p>커맨드와 활성 상태를 사용해 간단한 툴바를 만들 수 있습니다.</p>
            <CodeSnippet code={toolbarComponentCode} title="툴바 컴포넌트" />
          </div>

          <div className="demo-section">
            <h3>주요 커맨드 정리</h3>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>텍스트 스타일:</strong> toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode</div>
                <div><strong>문단:</strong> toggleHeading, setParagraph, toggleBlockquote</div>
                <div><strong>목록:</strong> toggleBulletList, toggleOrderedList, toggleTaskList</div>
                <div><strong>정렬:</strong> setTextAlign('left' | 'center' | 'right' | 'justify')</div>
                <div><strong>색상:</strong> setColor, setHighlight</div>
                <div><strong>삽입:</strong> setLink, setImage, insertTable, setHorizontalRule</div>
                <div><strong>히스토리:</strong> undo, redo</div>
                <div><strong>콘텐츠:</strong> setContent, clearContent</div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: '콘텐츠 관리',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            에디터 콘텐츠를 가져오고 설정하는 방법을 알아봅니다.
          </p>

          <div className="demo-section">
            <h3>콘텐츠 가져오기</h3>
            <p>에디터의 콘텐츠를 HTML, JSON, 텍스트 형식으로 가져올 수 있습니다.</p>
            <CodeSnippet code={contentManagementCode} title="getHTML, getJSON, getText" />
          </div>

          <div className="demo-section">
            <h3>콘텐츠 설정하기</h3>
            <p>에디터의 콘텐츠를 프로그래밍 방식으로 설정할 수 있습니다.</p>
            <CodeSnippet code={setContentCode} title="setContent, clearContent" />
          </div>

          <div className="demo-section">
            <h3>변경 감지</h3>
            <p>onUpdate 콜백으로 콘텐츠 변경을 감지하고 상위 컴포넌트에 전달할 수 있습니다.</p>
            <CodeSnippet code={onUpdateCode} title="onUpdate 콜백" />
          </div>

          <div className="demo-section">
            <h3>콘텐츠 형식 비교</h3>
            <Card size="small" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>HTML:</strong> 서버 저장, 표시용으로 적합. 가장 많이 사용.</div>
                <div><strong>JSON:</strong> 에디터 상태를 정확히 보존. 버전 관리, 협업에 유리.</div>
                <div><strong>Text:</strong> 검색, 미리보기, 글자 수 세기 등에 사용.</div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: '5',
      label: '본 프로젝트 RichTextEditor',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            VAMC NPL ADMIN 프로젝트의 RichTextEditor 컴포넌트 사용법과 라이브 데모입니다.
          </p>

          <div className="demo-section">
            <h3>기본 사용법</h3>
            <p>RichTextEditor는 TipTap을 래핑한 재사용 가능한 컴포넌트입니다.</p>
            <CodeSnippet code={richTextEditorUsageCode} title="기본 사용" />
          </div>

          <div className="demo-section">
            <h3>툴바 모드</h3>
            <p>toolbar prop으로 서식 기능의 범위를 조절할 수 있습니다.</p>
            <CodeSnippet code={toolbarModesCode} title="툴바 모드 비교" />
            <Card size="small" style={{ background: 'var(--bg-secondary)', marginTop: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div><strong>full:</strong> 텍스트 스타일, 제목, 목록, 링크, 이미지, 테이블, 정렬, 색상 등 모든 기능</div>
                <div><strong>compact:</strong> 텍스트 스타일, 목록, 링크 등 자주 쓰는 기능만</div>
                <div><strong>minimal:</strong> 굵게, 기울임, 밑줄 등 기본 텍스트 스타일만</div>
              </div>
            </Card>
          </div>

          <div className="demo-section">
            <h3>라이브 데모</h3>
            <p>아래에서 실제 RichTextEditor를 사용해보세요.</p>

            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ marginRight: 8, fontSize: 13 }}>툴바 모드:</span>
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
                  읽기 전용
                </label>
              </div>
            </Card>

            <RichTextEditor
              value={demoContent}
              onChange={setDemoContent}
              toolbar={demoMode}
              placeholder="여기에 내용을 입력하세요..."
              readOnly={demoReadOnly}
              minHeight={300}
              maxHeight={500}
            />

            <Card
              size="small"
              style={{ marginTop: 16, background: 'var(--bg-secondary)' }}
              title={<span style={{ fontSize: 13, fontWeight: 500 }}>현재 HTML 출력</span>}
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
      <div className="ds-section-header">
        <h2>TipTap 에디터 가이드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          오프라인 참조용 TipTap 리치텍스트 에디터 튜토리얼
        </p>
      </div>
      <Tabs items={tabItems} />
    </div>
  );
}
