import { useState } from 'react';
import { Tooltip, Space } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { useTabContext } from '@/contexts/TabContext';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useComponentLabel } from '@/hooks/useComponentLabel';
import { useAllMenus } from '@/hooks/useAllMenus';
import { findMenuByKey } from '@/utils/menuUtils';
import './PageHeader.css';

interface PageHeaderProps {
  /** Screen code displayed in brackets. Auto-derived from tab.sceId if omitted. */
  code?: string;
  /** Page title. Auto-derived via t(tab.labelKey) → tab.title fallback if omitted. */
  title?: string;
  /** Optional right-side slot */
  children?: React.ReactNode;
  /** usePageHeaderSlot로 등록되는 우측 액션 영역 (PageHeaderSlotContext) */
  actions?: React.ReactNode;
  /** usePageHeaderSlot로 등록되는 인라인 필터 영역 */
  inlineFilters?: React.ReactNode;
  /** 타이틀 우측 부가 요소 */
  titleExtra?: React.ReactNode;
}

export default function PageHeader({
  code,
  title,
  children,
  actions,
  inlineFilters,
  titleExtra,
}: PageHeaderProps) {
  const [favorite, setFavorite] = useState(false);
  const ctx = useTabContext();
  const { t } = useScreenLabel();
  const { tvt } = useComponentLabel();

  // 살아 있는 메뉴 트리에서 이름을 가져온다 — TabBar·ContentHeader 와 같은 방식이다.
  // tab.title 은 탭을 열던 순간의 이름이 localStorage 에 그대로 굳은 값이라,
  // 이것만 보면 그 뒤 언어를 바꿔도 처음 열었던 언어로 남는다.
  const allMenus = useAllMenus();

  // code: explicit prop > tab.sceId > tab.componentKey
  const resolvedCode = code ?? ctx?.tab.sceId ?? ctx?.tab.componentKey;

  // title: explicit prop > 현재 로케일의 메뉴 이름 > t(labelKey) > 저장된 tab.title
  const resolvedTitle = title
    ?? (ctx ? findMenuByKey(allMenus, ctx.tab.menuKey)?.label : undefined)
    ?? (ctx?.tab.labelKey ? t(ctx.tab.labelKey) : undefined)
    ?? ctx?.tab.title
    ?? '';

  return (
    <div className="ds-page-header">
      <Space size={8}>
        <Tooltip title={favorite
          ? tvt('favoriteRemove', '즐겨찾기 해제')
          : tvt('favoriteAdd', '즐겨찾기 추가')}>
          {favorite
            ? <StarFilled style={{ fontSize: 16, color: '#faad14', cursor: 'pointer' }} onClick={() => setFavorite(false)} />
            : <StarOutlined style={{ fontSize: 16, color: '#bbb', cursor: 'pointer' }} onClick={() => setFavorite(true)} />
          }
        </Tooltip>
        {resolvedCode && <span className="ds-page-header-code">[{resolvedCode}]</span>}
        <span className="ds-page-header-title">{resolvedTitle}</span>
        {titleExtra && <span className="ds-page-header-title-extra">{titleExtra}</span>}
      </Space>
      {(children || actions || inlineFilters) && (
        <div className="ds-page-header-right">
          {inlineFilters}
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
