import { useState } from 'react';
import { Typography } from 'antd';
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import './CodeSnippet.css';

interface CodeSnippetProps {
  code: string;
  title?: string;
}

export default function CodeSnippet({ code, title = '사용 예시' }: CodeSnippetProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`ds-code-snippet ${expanded ? 'expanded' : ''}`}>
      <div className="ds-code-snippet-header" onClick={() => setExpanded(!expanded)}>
        <span className="ds-code-snippet-title">
          <CodeOutlined style={{ marginRight: 6 }} />
          {title}
        </span>
        <span className="ds-code-snippet-actions">
          {expanded && (
            <span className="ds-code-snippet-copy" onClick={handleCopy} title="복사">
              {copied ? <CheckOutlined style={{ color: 'var(--success-color)' }} /> : <CopyOutlined />}
            </span>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {expanded ? '접기' : '펼치기'}
          </Typography.Text>
        </span>
      </div>
      {expanded && (
        <pre className="ds-code-snippet-body">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
