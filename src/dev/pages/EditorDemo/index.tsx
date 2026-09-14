import { lazy, Suspense, useRef, useState } from 'react';
import { Tabs, Card, Space, Select, Spin } from 'antd';
import type { SpreadSheetRef } from '@/components/editors/SpreadSheet';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

// Lazy-load heavy editors — each loads its vendor chunk only when the tab is first opened
const RichTextEditor = lazy(() => import('@/components/editors/RichTextEditor'));
const CodeEditor = lazy(() => import('@/components/editors/CodeEditor'));
const SpreadSheet = lazy(() => import('@/components/editors/SpreadSheet'));

const EditorFallback = <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

const sampleHtml = `<h2>Rich text editor demo</h2>
<p>This editor is built on <strong>TipTap</strong>.</p>
<ul>
  <li>Formatting: bold, italic, underline, strikethrough</li>
  <li>Headings: H1–H3</li>
  <li>Lists: bullets, numbers, checklists</li>
</ul>
<blockquote><p>Block quotes are supported too.</p></blockquote>`;

const sampleCode = `// TypeScript sample code
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const users: User[] = [
  { id: '1', name: 'Michael Chen', email: 'chen@example.com' },
  { id: '2', name: 'Emily Park', email: 'park@example.com' },
];

users.forEach(u => console.log(greet(u)));`;

const sampleSQL = `-- Task status by project
SELECT
  p.name AS project_name,
  t.status,
  COUNT(*) AS task_count,
  ROUND(AVG(t.progress), 1) AS avg_progress
FROM projects p
JOIN tasks t ON p.id = t.project_id
WHERE p.status = 'active'
GROUP BY p.name, t.status
ORDER BY p.name, t.status;`;

const richEditorCode = `import RichTextEditor from '@/components/editors/RichTextEditor';

const [content, setContent] = useState('<p>Initial content</p>');

<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="full"       // 'full' | 'compact' | 'minimal'
  placeholder="Type something..."
  minHeight={300}
  maxHeight={500}
  readOnly={false}
/>`;

const codeEditorCode = `import CodeEditor from '@/components/editors/CodeEditor';

const [code, setCode] = useState('// Write your code here');

<CodeEditor
  value={code}
  onChange={setCode}
  language="typescript"  // 'typescript' | 'javascript' | 'sql' | 'json' | 'yaml' | 'html' | 'css' | 'xml'
  height={400}
  readOnly={false}
/>`;

const spreadSheetCode = `import { useRef } from 'react';
import SpreadSheet from '@/components/editors/SpreadSheet';
import type { SpreadSheetRef } from '@/components/editors/SpreadSheet';

const sheetRef = useRef<SpreadSheetRef>(null);

// Using the built-in toolbar (showToolbar)
<SpreadSheet ref={sheetRef} height={500} showToolbar />

// Or control it programmatically through the ref
sheetRef.current?.importXLSX(file);       // import an XLSX file
sheetRef.current?.exportXLSX('output.xlsx'); // export to XLSX
sheetRef.current?.exportJSON('data.json');   // export to JSON
sheetRef.current?.getSnapshot();             // return the current data as JSON
sheetRef.current?.loadSnapshot(data);        // load data from JSON`;

type ToolbarMode = 'full' | 'compact' | 'minimal';

export default function EditorDemo() {
  const [richContent, setRichContent] = useState(sampleHtml);
  const [codeContent, setCodeContent] = useState(sampleCode);
  const [codeLang, setCodeLang] = useState<'typescript' | 'sql' | 'json' | 'javascript' | 'yaml' | 'xml' | 'html' | 'css'>('typescript');
  const [toolbarMode, setToolbarMode] = useState<ToolbarMode>('full');
  const sheetRef = useRef<SpreadSheetRef>(null);

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="EditorDemo" />

      <Tabs
        defaultActiveKey="rich"
        items={[
          {
            key: 'rich',
            label: 'Rich Text Editor',
            children: (
              <Card size="small">
                <Space style={{ marginBottom: 12 }}>
                  <span>Toolbar mode:</span>
                  <Select
                    value={toolbarMode}
                    onChange={setToolbarMode}
                    style={{ width: 120 }}
                    options={[
                      { label: 'Full', value: 'full' },
                      { label: 'Compact', value: 'compact' },
                      { label: 'Minimal', value: 'minimal' },
                    ]}
                  />
                </Space>
                <Suspense fallback={EditorFallback}>
                  <RichTextEditor
                    value={richContent}
                    onChange={setRichContent}
                    toolbar={toolbarMode}
                    placeholder="Type something..."
                    minHeight={300}
                    maxHeight={500}
                  />
                </Suspense>
                <CodeSnippet code={richEditorCode} />
              </Card>
            ),
          },
          {
            key: 'code',
            label: 'Code Editor',
            children: (
              <Card size="small">
                <Space style={{ marginBottom: 12 }}>
                  <span>Language:</span>
                  <Select
                    value={codeLang}
                    onChange={(v) => {
                      setCodeLang(v);
                      setCodeContent(v === 'sql' ? sampleSQL : sampleCode);
                    }}
                    style={{ width: 140 }}
                    options={[
                      { label: 'TypeScript', value: 'typescript' },
                      { label: 'JavaScript', value: 'javascript' },
                      { label: 'SQL', value: 'sql' },
                      { label: 'JSON', value: 'json' },
                      { label: 'YAML', value: 'yaml' },
                      { label: 'HTML', value: 'html' },
                      { label: 'CSS', value: 'css' },
                    ]}
                  />
                </Space>
                <Suspense fallback={EditorFallback}>
                  <CodeEditor
                    value={codeContent}
                    onChange={setCodeContent}
                    language={codeLang}
                    height={400}
                  />
                </Suspense>
                <CodeSnippet code={codeEditorCode} />
              </Card>
            ),
          },
          {
            key: 'sheet',
            label: 'SpreadSheet',
            children: (
              <Card size="small">
                <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
                  A spreadsheet built on Univer. Click a cell to enter data.
                  The toolbar above handles XLSX/JSON import and export.
                </p>
                <Suspense fallback={EditorFallback}>
                  <SpreadSheet ref={sheetRef} height={500} showToolbar />
                </Suspense>
                <CodeSnippet code={spreadSheetCode} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
