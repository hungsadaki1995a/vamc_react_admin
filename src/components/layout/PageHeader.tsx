import { useState } from 'react';
import { Tooltip, Space } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { useTabContext } from '@/contexts/TabContext';
import { useLabelStore } from '@/stores/labelStore';
import './PageHeader.css';

interface PageHeaderProps {
  /** Screen code displayed in brackets. Auto-derived from tab.sceId if omitted. */
  code?: string;
  /** Page title. Auto-derived via t(tab.labelKey) → tab.title fallback if omitted. */
  title?: string;
  /** Optional right-side slot */
  children?: React.ReactNode;
}

export default function PageHeader({ code, title, children }: PageHeaderProps) {
  const [favorite, setFavorite] = useState(false);
  const ctx = useTabContext();
  const t = useLabelStore((s) => s.t);

  // code: explicit prop > tab.sceId > tab.componentKey
  const resolvedCode = code ?? ctx?.tab.sceId ?? ctx?.tab.componentKey;

  // title: explicit prop > t(labelKey) > tab.title fallback
  const resolvedTitle = title
    ?? (ctx?.tab.labelKey ? t(ctx.tab.labelKey) : undefined)
    ?? ctx?.tab.title
    ?? '';

  return (
    <div className="ds-page-header">
      <Space size={8}>
        <Tooltip title={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
          {favorite
            ? <StarFilled style={{ fontSize: 16, color: '#faad14', cursor: 'pointer' }} onClick={() => setFavorite(false)} />
            : <StarOutlined style={{ fontSize: 16, color: '#bbb', cursor: 'pointer' }} onClick={() => setFavorite(true)} />
          }
        </Tooltip>
        {resolvedCode && <span className="ds-page-header-code">[{resolvedCode}]</span>}
        <span className="ds-page-header-title">{resolvedTitle}</span>
      </Space>
      {children && <div className="ds-page-header-right">{children}</div>}
    </div>
  );
}
