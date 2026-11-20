import { useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { Spin } from 'antd';
import {
  FileOutlined,
  FolderFilled,
  FolderOpenFilled,
  HolderOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined,
} from '@ant-design/icons';
import type { MenuSetting, YesNo } from '@/api/system/menu-setting-api';
import { SysButton, UseBadge } from './sys-list-ui';
import { menuName, planMenuMove } from './menu-tree';
import type { DropPosition, MenuMove, MenuNode, MenuTree } from './menu-tree';
import styles from './menu-settings.module.scss';

// Left panel of Menu Settings: [Expand All] / [Add Submenu] [Add Top Menu] and the drag & drop tree.

/** Unsaved menu added with [Add Submenu] / [Add Top Menu], shown at the end of its parent. */
export interface MenuDraftRow {
  upMenuCd: string;
  name: string;
  useYn: YesNo;
}

interface MenuSettingsTreeProps {
  tree: MenuTree<MenuSetting>;
  visible: MenuNode<MenuSetting>[];
  collapsed: ReadonlySet<string>;
  allExpanded: boolean;
  /** Selected saved menu; null while the draft is selected, undefined when nothing is. */
  selectedCd?: string | null;
  draft: MenuDraftRow | null;
  maxDepth: number;
  canWrite: boolean;
  addSubDisabled: boolean;
  loading: boolean;
  moving: boolean;
  onToggle: (menuCd: string) => void;
  onToggleAll: () => void;
  onSelect: (node: MenuNode<MenuSetting>) => void;
  onAddSub: () => void;
  onAddTop: () => void;
  onMove: (menuCd: string, move: MenuMove) => void;
}

interface DropTarget {
  menuCd: string;
  position: DropPosition;
}

/** Index after which the draft row is shown: last visible row of its parent's subtree. */
function draftIndex(visible: MenuNode<MenuSetting>[], upMenuCd: string, rootCd?: string): number {
  if (upMenuCd === rootCd) return visible.length - 1;
  const start = visible.findIndex((node) => node.menu.menuCd === upMenuCd);
  if (start < 0) return visible.length - 1;
  let end = start;
  while (end + 1 < visible.length && visible[end + 1].path.some((p) => p.menuCd === upMenuCd)) end += 1;
  return end;
}

function dropPosition(event: DragEvent<HTMLElement>): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  const offset = (event.clientY - rect.top) / rect.height;
  if (offset < 0.3) return 'before';
  if (offset > 0.7) return 'after';
  return 'inside';
}

export default function MenuSettingsTree({
  tree,
  visible,
  collapsed,
  allExpanded,
  selectedCd,
  draft,
  maxDepth,
  canWrite,
  addSubDisabled,
  loading,
  moving,
  onToggle,
  onToggleAll,
  onSelect,
  onAddSub,
  onAddTop,
  onMove,
}: MenuSettingsTreeProps) {
  const [dragCd, setDragCd] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const draggable = canWrite && !moving;

  const endDrag = () => {
    setDragCd(null);
    setDropTarget(null);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, menuCd: string) => {
    if (!dragCd) return;
    const position = dropPosition(event);
    if (planMenuMove(tree, dragCd, menuCd, position, maxDepth) === 'invalid') {
      if (dropTarget) setDropTarget(null);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTarget?.menuCd !== menuCd || dropTarget.position !== position) setDropTarget({ menuCd, position });
  };

  const handleDrop = (event: DragEvent<HTMLElement>, menuCd: string) => {
    event.preventDefault();
    const source = dragCd;
    const position = dropPosition(event);
    endDrag();
    if (!source) return;
    const move = planMenuMove(tree, source, menuCd, position, maxDepth);
    if (move && move !== 'invalid') onMove(source, move);
  };

  const renderNode = (node: MenuNode<MenuSetting>) => {
    const { menu } = node;
    const hasChildren = node.children.length > 0;
    const open = hasChildren && !collapsed.has(menu.menuCd);
    const inactive = menu.useYn !== 'Y';
    const drop = dropTarget?.menuCd === menu.menuCd ? dropTarget.position : undefined;
    return (
      <div
        key={menu.menuCd}
        role="treeitem"
        aria-selected={selectedCd === menu.menuCd}
        aria-expanded={hasChildren ? open : undefined}
        className={styles.treeRow}
        data-selected={selectedCd === menu.menuCd || undefined}
        data-drop={drop}
        data-dragging={dragCd === menu.menuCd || undefined}
        style={{ '--level': node.level - 1 } as CSSProperties}
        draggable={draggable}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', menu.menuCd);
          setDragCd(menu.menuCd);
        }}
        onDragEnd={endDrag}
        onDragOver={(event) => handleDragOver(event, menu.menuCd)}
        onDragLeave={() => {
          if (dropTarget?.menuCd === menu.menuCd) setDropTarget(null);
        }}
        onDrop={(event) => handleDrop(event, menu.menuCd)}
        onClick={() => onSelect(node)}
      >
        <HolderOutlined className={styles.dragHandle} data-disabled={!draggable || undefined} />
        <span className={styles.treeIndent} />
        {hasChildren ? (
          <button
            type="button"
            className={styles.treeToggle}
            aria-label={open ? 'Collapse' : 'Expand'}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(menu.menuCd);
            }}
          >
            {open ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
          </button>
        ) : (
          <span className={styles.treeToggleSpacer} />
        )}
        <span className={styles.treeIcon}>
          {hasChildren ? open ? <FolderOpenFilled /> : <FolderFilled /> : <FileOutlined />}
        </span>
        <span className={styles.treeName} data-inactive={inactive || undefined} title={menu.menuCd}>
          {menuName(menu)}
        </span>
        <UseBadge value={menu.useYn} />
      </div>
    );
  };

  const renderDraft = (row: MenuDraftRow) => {
    const parent = tree.byCd.get(row.upMenuCd);
    return (
      <div
        key="__draft"
        role="treeitem"
        aria-selected={selectedCd === null}
        className={styles.treeRow}
        data-selected={selectedCd === null || undefined}
        data-draft
        style={{ '--level': parent ? parent.level : 0 } as CSSProperties}
      >
        <HolderOutlined className={styles.dragHandle} data-disabled />
        <span className={styles.treeIndent} />
        <span className={styles.treeToggleSpacer} />
        <span className={styles.treeIcon}>
          <FileOutlined />
        </span>
        <span className={styles.treeName} data-inactive={row.useYn !== 'Y' || undefined}>
          {row.name || 'New Menu'}
        </span>
        <UseBadge value={row.useYn} />
      </div>
    );
  };

  const insertAt = draft ? draftIndex(visible, draft.upMenuCd, tree.rootCd) : -2;

  return (
    <div className={styles.treePanel}>
      <div className={styles.treeToolbar}>
        <SysButton onClick={onToggleAll}>{allExpanded ? 'Collapse All' : 'Expand All'}</SysButton>
        {canWrite && (
          <div className={styles.treeToolbarRight}>
            <SysButton disabled={addSubDisabled} onClick={onAddSub}>
              Add Submenu
            </SysButton>
            <SysButton look="navy" onClick={onAddTop}>
              Add Top Menu
            </SysButton>
          </div>
        )}
      </div>
      <Spin spinning={loading || moving} wrapperClassName={styles.treeSpin}>
        <div className={styles.treeBody} role="tree">
          {insertAt === -1 && draft && renderDraft(draft)}
          {visible.map((node, index) => (
            <div key={node.menu.menuCd} className={styles.treeItem}>
              {renderNode(node)}
              {index === insertAt && draft && renderDraft(draft)}
            </div>
          ))}
          {!loading && visible.length === 0 && !draft && <div className={styles.treeEmpty}>No menus.</div>}
        </div>
      </Spin>
    </div>
  );
}
