import { useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import {
  addMinusSquare,
  addPlusSquare,
  move as moveIcon,
  treeFile,
  treeFolderCloseFilled,
  treeFolderOpenFilled,
} from '@/assets/images';
import styles from './tree-view.module.scss';

export type TreeNodeItem<T = unknown> = {
  key: string;
  label: ReactNode;
  type?: 'folder' | 'file';
  inactive?: boolean;
  badge?: ReactNode;
  children?: TreeNodeItem<T>[];
  data?: T;
};

export type TreeViewProps<T = unknown> = {
  nodes: TreeNodeItem<T>[];
  selectedKey?: string;
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  onSelect?: (node: TreeNodeItem<T>) => void;
  onToggleExpand?: (key: string) => void;
  showDragHandle?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, node: TreeNodeItem<T>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>, node: TreeNodeItem<T>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, node: TreeNodeItem<T>) => void;
  getRowClassName?: (node: TreeNodeItem<T>) => string | undefined;
  renderExtra?: (node: TreeNodeItem<T>) => ReactNode;
  className?: string;
};

/** Recursive tree view matching Figma Tree View / Tree Item specs (4042:25849). */
export default function TreeView<T = unknown>({
  nodes,
  selectedKey,
  expandedKeys,
  defaultExpandedKeys = [],
  onSelect,
  onToggleExpand,
  showDragHandle = false,
  onDragStart,
  onDragOver,
  onDrop,
  getRowClassName,
  renderExtra,
  className,
}: TreeViewProps<T>) {
  const [internalExpanded, setInternalExpanded] = useState<string[]>(defaultExpandedKeys);
  const activeExpanded = expandedKeys ?? internalExpanded;

  const handleToggle = (key: string) => {
    if (onToggleExpand) {
      onToggleExpand(key);
      return;
    }
    setInternalExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const renderNodes = (items: TreeNodeItem<T>[], level: number): ReactNode =>
    items.map((node) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isFolder = node.type ? node.type === 'folder' : hasChildren;
      const isExpanded = activeExpanded.includes(node.key);
      const isSelected = selectedKey === node.key;
      const iconSrc = isFolder
        ? isExpanded
          ? treeFolderOpenFilled
          : treeFolderCloseFilled
        : treeFile;

      return (
        <div key={node.key} className={styles.nodeWrapper}>
          <div
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
            draggable={Boolean(onDragStart)}
            onDragStart={onDragStart ? (e) => onDragStart(e, node) : undefined}
            onDragOver={onDragOver ? (e) => onDragOver(e, node) : undefined}
            onDrop={onDrop ? (e) => onDrop(e, node) : undefined}
            onClick={() => onSelect?.(node)}
            style={{ '--tree-level': level } as CSSProperties}
            className={[
              styles.row,
              isSelected ? styles.rowSelected : '',
              node.inactive ? styles.rowInactive : '',
              getRowClassName?.(node),
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {showDragHandle && (
              <span className={styles.dragHandle} aria-hidden="true">
                <img src={moveIcon} alt="" />
              </span>
            )}

            {hasChildren ? (
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(node.key);
                }}
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              >
                <img src={isExpanded ? addMinusSquare : addPlusSquare} alt="" />
              </button>
            ) : (
              <span className={styles.toggleSpacer} aria-hidden="true" />
            )}

            <img src={iconSrc} alt="" className={styles.nodeIcon} aria-hidden="true" />

            <span className={styles.label}>{node.label}</span>

            {node.badge && <span className={styles.badgeSlot}>{node.badge}</span>}
            {renderExtra && <span className={styles.extraSlot}>{renderExtra(node)}</span>}
          </div>

          {hasChildren && isExpanded && (
            <div role="group" className={styles.group}>
              {renderNodes(node.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div role="tree" className={[styles.root, className].filter(Boolean).join(' ')}>
      {renderNodes(nodes, 0)}
    </div>
  );
}
