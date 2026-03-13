import { useEffect, useRef } from 'react';
import { useTabStore } from '@/stores/tabStore';

interface TabContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  tabKey: string;
  onClose: () => void;
}

/**
 * Context menu wrapper — only mounts the inner menu when visible.
 * This prevents Zustand store subscriptions from firing when the menu is hidden.
 */
export default function TabContextMenu({ visible, x, y, tabKey, onClose }: TabContextMenuProps) {
  if (!visible) return null;

  return (
    <TabContextMenuInner x={x} y={y} tabKey={tabKey} onClose={onClose} />
  );
}

function TabContextMenuInner({
  x,
  y,
  tabKey,
  onClose,
}: {
  x: number;
  y: number;
  tabKey: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tabs, closeTab, closeOtherTabs, closeRightTabs, closeAllTabs, pinTab, unpinTab } =
    useTabStore();

  const tab = tabs.find((t) => t.key === tabKey);
  const isPinned = tab?.pinned ?? false;

  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const menuItems = [
    { label: isPinned ? '고정 해제' : '탭 고정', action: () => isPinned ? unpinTab(tabKey) : pinTab(tabKey) },
    { label: '닫기', action: () => closeTab(tabKey), disabled: isPinned },
    { divider: true },
    { label: '다른 탭 모두 닫기', action: () => closeOtherTabs(tabKey) },
    { label: '오른쪽 탭 닫기', action: () => closeRightTabs(tabKey) },
    { label: '모든 탭 닫기', action: () => closeAllTabs() },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
        background: '#fff',
        borderRadius: 6,
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        padding: '4px 0',
        minWidth: 160,
      }}
    >
      {menuItems.map((item, i) =>
        'divider' in item ? (
          <div key={i} style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
        ) : (
          <div
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              color: item.disabled ? '#d9d9d9' : '#333',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) (e.target as HTMLDivElement).style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLDivElement).style.background = 'transparent';
            }}
          >
            {item.label}
          </div>
        )
      )}
    </div>
  );
}
