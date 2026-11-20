import { useEffect, useRef } from 'react';
import { useTabStore } from '@/stores/tab-store';
import { useComponentLabel } from '@/hooks/use-component-label';

type TabContextMenuProps = {
  visible: boolean;
  x: number;
  y: number;
  tabKey: string;
  onClose: () => void;
};

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
  const { tvb } = useComponentLabel();
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
    {
      label: isPinned ? tvb('tabUnpin', 'Unpin Tab') : tvb('tabPin', 'Pin Tab'),
      action: () => isPinned ? unpinTab(tabKey) : pinTab(tabKey),
    },
    { label: tvb('tabClose', 'Close'), action: () => closeTab(tabKey), disabled: isPinned },
    { divider: true },
    { label: tvb('tabCloseOthers', 'Close Other Tabs'), action: () => closeOtherTabs(tabKey) },
    { label: tvb('tabCloseRight', 'Close Tabs to the Right'), action: () => closeRightTabs(tabKey) },
    { label: tvb('tabCloseAll', 'Close All Tabs'), action: () => closeAllTabs() },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[1000] bg-white rounded-[6px] shadow-[0_6px_16px_rgba(0,0,0,0.12)] py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, i) =>
        'divider' in item ? (
          <div key={i} className="h-px bg-[#f0f0f0] my-1" />
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
            className={`px-4 py-1.5 text-[13px] transition-colors duration-200 ${
              item.disabled
                ? 'cursor-not-allowed text-[#d9d9d9]'
                : 'cursor-pointer text-[#333] hover:bg-[#f5f5f5]'
            }`}
          >
            {item.label}
          </div>
        )
      )}
    </div>
  );
}
