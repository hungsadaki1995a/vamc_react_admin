import { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useThemeStore } from '@/stores/themeStore';

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: 'sql' | 'json' | 'javascript' | 'typescript' | 'yaml' | 'xml' | 'html' | 'css';
  readOnly?: boolean;
  height?: string | number;
  minimap?: boolean;
  lineNumbers?: boolean;
  className?: string;
}

export default function CodeEditor({
  value = '',
  onChange,
  language = 'javascript',
  readOnly = false,
  height = 400,
  minimap = false,
  lineNumbers = true,
  className,
}: CodeEditorProps) {
  const themeMode = useThemeStore((s) => s.mode);

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val ?? '');
    },
    [onChange],
  );

  return (
    <div className={className} style={{ border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleChange}
        theme={themeMode === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          lineNumbers: lineNumbers ? 'on' : 'off',
          fontSize: 13,
          tabSize: 2,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
