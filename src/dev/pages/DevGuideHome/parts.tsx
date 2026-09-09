import { useState } from 'react';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import type { LocaleKey } from '@/stores/localeStore';
import { PAGE_TEXT } from './sections';
import styles from './index.module.css';

// 가이드 본문이 쓰는 표시 컴포넌트. 이 파일은 컴포넌트만 export 한다 —
// 섹션 메타·머리말 같은 데이터는 sections.tsx 에 있다.

// ── 코드 블록 ────────────────────────────────────────────────────────────────

export function Code({ file, locale, children }: {
  file?: string;
  locale: LocaleKey;
  children: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = PAGE_TEXT[locale];

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.code}>
      <div className={styles.codeHead}>
        <span className={styles.codeFile}>{file ?? ''}</span>
        <button type="button" className={styles.codeCopy} onClick={handleCopy}>
          {copied ? <><CheckOutlined /> {text.copied}</> : <><CopyOutlined /> {text.copy}</>}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

// ── 알림 박스 ────────────────────────────────────────────────────────────────

export function Note({ type = 'info', title, children }: {
  type?: 'info' | 'warn' | 'danger';
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls = [
    styles.note,
    type === 'warn' ? styles.noteWarn : '',
    type === 'danger' ? styles.noteDanger : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {title && <span className={styles.noteTitle}>{title}</span>}
      {children}
    </div>
  );
}

// ── 표 ───────────────────────────────────────────────────────────────────────
//
// 표를 마크업이 아니라 데이터로 받는다 — 번역할 때 셀 문자열만 고치면 되고,
// 세 언어의 표 구조가 어긋날 일이 없다.

export function DataTable({ head, rows }: {
  head: React.ReactNode[];
  rows: React.ReactNode[][];
}) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
