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

const sampleHtml = `<h2>리치 텍스트 에디터 데모</h2>
<p>이 에디터는 <strong>TipTap</strong>을 기반으로 합니다.</p>
<ul>
  <li>서식: 굵게, 기울임, 밑줄, 취소선</li>
  <li>헤딩: H1~H3</li>
  <li>목록: 글머리 기호, 번호, 체크리스트</li>
</ul>
<blockquote><p>인용구도 지원합니다.</p></blockquote>`;

const sampleCode = `// TypeScript 샘플 코드
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`안녕하세요, \${user.name}님!\`;
}

const users: User[] = [
  { id: '1', name: '김철수', email: 'kim@example.com' },
  { id: '2', name: '이영희', email: 'lee@example.com' },
];

users.forEach(u => console.log(greet(u)));`;

const sampleSQL = `-- 프로젝트별 업무 현황 조회
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

const [content, setContent] = useState('<p>초기 내용</p>');

<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar="full"       // 'full' | 'compact' | 'minimal'
  placeholder="내용을 입력하세요..."
  minHeight={300}
  maxHeight={500}
  readOnly={false}
/>`;

const codeEditorCode = `import CodeEditor from '@/components/editors/CodeEditor';

const [code, setCode] = useState('// 코드를 입력하세요');

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

// 내장 툴바 (showToolbar) 사용
<SpreadSheet ref={sheetRef} height={500} showToolbar />

// 또는 ref를 통한 프로그래매틱 제어
sheetRef.current?.importXLSX(file);       // XLSX 파일 가져오기
sheetRef.current?.exportXLSX('output.xlsx'); // XLSX 파일 내보내기
sheetRef.current?.exportJSON('data.json');   // JSON 내보내기
sheetRef.current?.getSnapshot();             // 현재 데이터 JSON 반환
sheetRef.current?.loadSnapshot(data);        // JSON 데이터 로드`;

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
                  <span>툴바 모드:</span>
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
                    placeholder="내용을 입력하세요..."
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
                  <span>언어:</span>
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
                  Univer 기반 스프레드시트입니다. 셀을 클릭하여 데이터를 입력하세요.
                  상단 툴바에서 XLSX/JSON 가져오기/내보내기가 가능합니다.
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
