import { useState, useMemo, useCallback, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Metadata injected into each row by useTreeGrid. */
export interface TreeMeta {
  /** Depth level (0 = root). */
  _treeLevel: number;
  /** Whether this node has visible children in the data. */
  _hasChildren: boolean;
  /** Whether this node's children are currently expanded. */
  _isExpanded: boolean;
  /** Unique node identifier (stringified idField value). */
  _nodeId: string;
}

export type TreeRow<T> = T & TreeMeta;

interface UseTreeGridOptions<T> {
  data: T[];
  /** Field name used as unique row ID. Default: 'id' */
  idField?: keyof T & string;
  /** Field name pointing to parent row ID. Default: 'parentId' */
  parentField?: keyof T & string;
  /** Expand all nodes initially. Default: true */
  defaultExpanded?: boolean;
}

interface UseTreeGridResult<T> {
  /** Processed, ordered, filtered rows to pass to DataGrid rowData. */
  treeData: TreeRow<T>[];
  /** Toggle expand/collapse for a node by its ID string. */
  toggleExpand: (id: string) => void;
  /** Expand all parent nodes. */
  expandAll: () => void;
  /** Collapse all nodes. */
  collapseAll: () => void;
  /** Current set of expanded node IDs. */
  expandedIds: Set<string>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Converts flat data with parent-child relationships into ordered tree rows
 * compatible with AG Grid Community (no Enterprise license required).
 *
 * Pair with TreeCellRenderer for the hierarchy column.
 *
 * @example
 * const { treeData, toggleExpand } = useTreeGrid({ data: orgList, idField: 'orgId', parentField: 'upOrgId' });
 *
 * <DataGrid
 *   rowData={treeData}
 *   columnDefs={[{
 *     field: 'orgNm',
 *     cellRenderer: TreeCellRenderer,
 *     cellRendererParams: { onToggle: toggleExpand },
 *   }]}
 * />
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTreeGrid<T extends Record<string, any>>({
  data,
  idField = 'id',
  parentField = 'parentId',
  defaultExpanded = true,
}: UseTreeGridOptions<T>): UseTreeGridResult<T> {

  // ── Build parent-ID set for default expansion ──────────────────────────────
  const allParentIds = useMemo<Set<string>>(() => {
    const idSet = new Set(data.map((d) => String(d[idField])));
    const parents = new Set<string>();
    data.forEach((d) => {
      const pid = d[parentField];
      if (pid != null && pid !== '' && idSet.has(String(pid))) {
        parents.add(String(pid));
      }
    });
    return parents;
  }, [data, idField, parentField]);

  // ── Expanded state ─────────────────────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    defaultExpanded ? new Set(allParentIds) : new Set(),
  );

  // Stable ref so expandAll always uses the latest allParentIds without being a dep
  const allParentIdsRef = useRef<Set<string>>(allParentIds);
  // eslint-disable-next-line react-hooks/refs
  allParentIdsRef.current = allParentIds; // safe: idempotent assignment, does not affect render output

  // ── Build ordered tree rows ────────────────────────────────────────────────
  const treeData = useMemo<TreeRow<T>[]>(() => {
    const byId = new Map<string, T>();
    const childrenOf = new Map<string, string[]>();
    const ROOT = '__root__';

    // Index all nodes
    data.forEach((d) => byId.set(String(d[idField]), d));

    // Build children map
    data.forEach((d) => {
      const id = String(d[idField]);
      const rawPid = d[parentField];
      const pid = rawPid != null && rawPid !== '' && byId.has(String(rawPid))
        ? String(rawPid)
        : ROOT;

      if (!childrenOf.has(pid)) childrenOf.set(pid, []);
      childrenOf.get(pid)!.push(id);
    });

    // DFS traversal to produce ordered, filtered flat list
    const result: TreeRow<T>[] = [];

    function traverse(id: string, level: number) {
      const node = byId.get(id);
      if (!node) return;

      const children = childrenOf.get(id) ?? [];
      const hasChildren = children.length > 0;
      const isExpanded = expandedIds.has(id);

      result.push({
        ...node,
        _treeLevel: level,
        _hasChildren: hasChildren,
        _isExpanded: isExpanded,
        _nodeId: id,
      } as TreeRow<T>);

      if (hasChildren && isExpanded) {
        children.forEach((childId) => traverse(childId, level + 1));
      }
    }

    const roots = childrenOf.get(ROOT) ?? [];
    roots.forEach((id) => traverse(id, 0));

    return result;
  }, [data, idField, parentField, expandedIds]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(allParentIdsRef.current));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return { treeData, toggleExpand, expandAll, collapseAll, expandedIds };
}
