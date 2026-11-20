import { useState } from 'react';
import { Tooltip, Space } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { useTabContext } from '@/contexts/tab-context';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useComponentLabel } from '@/hooks/use-component-label';
import { useAllMenus } from '@/hooks/use-all-menus';
import { findMenuByKey } from '@/utils/menu-utils';
import './page-header.scss';

interface PageHeaderProps {
  /** Screen code displayed in brackets. Auto-derived from tab.sceId if omitted. */
  code?: string;
  /** Page title. Auto-derived via t(tab.labelKey) → tab.title fallback if omitted. */
  title?: string;
  /** Optional right-side slot */
  children?: React.ReactNode;
  /** Right-side action area registered via usePageHeaderSlot (PageHeaderSlotContext) */
  actions?: React.ReactNode;
  /** Inline filter area registered via usePageHeaderSlot */
  inlineFilters?: React.ReactNode;
  /** Extra element to the right of the title */
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

  // Read name from the live menu tree — same approach as TabBar and ContentHeader.
  // tab.title is frozen in localStorage at the moment the tab was opened,
  // so relying on it alone would keep the initial language after switching locales.
  const allMenus = useAllMenus();

  // code: explicit prop > tab.sceId > tab.componentKey
  const resolvedCode = code ?? ctx?.tab.sceId ?? ctx?.tab.componentKey;

  // title: explicit prop > current locale menu name > t(labelKey) > saved tab.title
  const resolvedTitle = title
    ?? (ctx ? findMenuByKey(allMenus, ctx.tab.menuKey)?.label : undefined)
    ?? (ctx?.tab.labelKey ? t(ctx.tab.labelKey) : undefined)
    ?? ctx?.tab.title
    ?? '';

  return (
    <div className="ds-page-header">
      <Space size={8}>
        <Tooltip title={favorite
          ? tvt('favoriteRemove', 'Remove from Favorites')
          : tvt('favoriteAdd', 'Add to Favorites')}>
          {favorite
            ? <StarFilled className="text-[16px] text-[#faad14]! cursor-pointer" onClick={() => setFavorite(false)} />
            : <StarOutlined className="text-[16px] text-[#bbb]! cursor-pointer" onClick={() => setFavorite(true)} />
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
