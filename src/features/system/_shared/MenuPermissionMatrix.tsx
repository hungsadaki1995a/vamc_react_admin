import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Alert, Checkbox, Spin } from 'antd';
import { MinusSquareOutlined, PlusSquareOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useMenuStore } from '@/stores/menu-store';
import type { MatrixColumn, MatrixRow, SaveMatrixRequest } from '@/api/system/menu-permission-api';
import type { MenuSeCd } from '@/api/system/menu-setting-api';
import { SysButton, SysPage, SysTitleBar } from './SysListUi';
import { SYS_MESSAGES } from './sys-messages';
import { useSysDialogs } from './use-sys-dialogs';
import { errorMessage } from './system-utils';
import { buildMenuTree, descendants, menuName, visibleNodes } from './menu-tree';
import type { MenuNode } from './menu-tree';
import styles from './menu-permission-matrix.module.scss';
import { useMenuPermissionMatrix, useSaveMenuPermissionMatrix } from './use-menu-permissions';

// Menu permission matrix — menus (rows, as a tree) × roles (columns), Read / Write.
//   menuSeCd = W → Web Menu Permission Management (VPA09010501), columns = Web member grades
//   menuSeCd = A → Menu Permission Management     (VPA09020401), columns = every admin role
// Parent rows follow their submenus; Inactive menus keep (and send back) their permissions.

interface Props {
  menuSeCd: MenuSeCd;
}

interface Flag {
  read: boolean;
  write: boolean;
}

type Node = MenuNode<MatrixRow>;
type FlagKind = keyof Flag;

const SCREEN = {
  W: {
    title: 'Web Menu Permission Management',
    breadcrumb: ['System Operation Management', 'NPL Platform Management', 'Web Menu Permission Management'],
  },
  A: {
    title: 'Menu Permission Management',
    breadcrumb: ['System Operation Management', 'Admin Management', 'Menu Permission Management'],
  },
} as const;

const NO_FLAG: Flag = { read: false, write: false };

const roleKey = (column: Pick<MatrixColumn, 'roleGroupId' | 'roleId'>) => `${column.roleGroupId}|${column.roleId}`;
const cellKey = (column: MatrixColumn, menuCd: string) => `${roleKey(column)}|${menuCd}`;

/** Checked / indeterminate state of a parent row from its leaf submenus. */
interface Derived {
  checked: boolean;
  indeterminate: boolean;
}

export default function MenuPermissionMatrix({ menuSeCd }: Props) {
  const screen = SCREEN[menuSeCd];
  const { toast } = useNotify();
  const { guardDiscard } = useSysDialogs();
  const { canWrite } = useMenuPermission();

  const { data, isFetching, error, refetch } = useMenuPermissionMatrix(menuSeCd);
  const saveMatrix = useSaveMenuPermissionMatrix();

  /** Edited leaf cells only; a cell set back to its stored value is dropped. */
  const [edits, setEdits] = useState<ReadonlyMap<string, Flag>>(new Map());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const columns = useMemo(() => data?.columns ?? [], [data]);
  const tree = useMemo(() => buildMenuTree(data?.rows ?? []), [data]);
  const visible = useMemo(() => visibleNodes(tree, collapsed), [tree, collapsed]);
  /** Leaf submenus under each parent row. */
  const leavesOf = useMemo(() => {
    const map = new Map<string, Node[]>();
    tree.ordered.forEach((node) => {
      if (node.children.length) map.set(node.menu.menuCd, descendants(node).filter((d) => !d.children.length));
    });
    return map;
  }, [tree]);

  const dirty = edits.size > 0;

  const storedFlag = (row: MatrixRow, colIndex: number): Flag => {
    const cell = row.permissions[colIndex];
    return cell ? { read: cell.read, write: cell.write } : NO_FLAG;
  };

  const leafFlag = (row: MatrixRow, colIndex: number): Flag =>
    edits.get(cellKey(columns[colIndex], row.menuCd)) ?? storedFlag(row, colIndex);

  const derive = (node: Node, colIndex: number, kind: FlagKind): Derived => {
    const leaves = leavesOf.get(node.menu.menuCd) ?? [];
    const count = leaves.filter((leaf) => leafFlag(leaf.menu, colIndex)[kind]).length;
    return { checked: leaves.length > 0 && count === leaves.length, indeterminate: count > 0 && count < leaves.length };
  };

  /** Applies `change` to the given leaves of one column (write ⇒ read, no read ⇒ no write). */
  const updateLeaves = (leaves: Node[], colIndex: number, change: (current: Flag) => Flag) => {
    const column = columns[colIndex];
    setEdits((prev) => {
      const next = new Map(prev);
      leaves.forEach(({ menu }) => {
        const key = cellKey(column, menu.menuCd);
        const value = change(next.get(key) ?? storedFlag(menu, colIndex));
        const stored = storedFlag(menu, colIndex);
        if (value.read === stored.read && value.write === stored.write) next.delete(key);
        else next.set(key, value);
      });
      return next;
    });
  };

  const toggle = (node: Node, colIndex: number, kind: FlagKind, checked: boolean) => {
    const leaves = node.children.length ? (leavesOf.get(node.menu.menuCd) ?? []) : [node];
    updateLeaves(leaves, colIndex, (current) => {
      if (kind === 'read') return { read: checked, write: checked ? current.write : false };
      return { read: checked ? true : current.read, write: checked };
    });
  };

  const toggleNode = (menuCd: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(menuCd)) next.delete(menuCd);
      else next.add(menuCd);
      return next;
    });

  const handleRefresh = () =>
    guardDiscard(
      dirty,
      () => {
        setEdits(new Map());
        void refetch();
      },
      'refresh',
    );

  /**
   * The server replaces a role's mappings as a whole, so every changed role is sent with all its menus:
   * leaves as edited, parents derived from their leaves, Inactive menus as they are. Super Admin is never sent.
   */
  const buildRequest = (): SaveMatrixRequest => {
    const changedRoles = new Set([...edits.keys()].map((key) => key.split('|').slice(0, 2).join('|')));
    return {
      menuSeCd,
      roles: columns
        .map((column, colIndex) => ({ column, colIndex }))
        .filter(({ column }) => !column.superAdmin && changedRoles.has(roleKey(column)))
        .map(({ column, colIndex }) => ({
          roleGroupId: column.roleGroupId,
          roleId: column.roleId,
          menus: tree.ordered
            .map((node) => {
              if (!node.children.length) return { menuCd: node.menu.menuCd, ...leafFlag(node.menu, colIndex) };
              const leaves = leavesOf.get(node.menu.menuCd) ?? [];
              return {
                menuCd: node.menu.menuCd,
                read: leaves.some((leaf) => leafFlag(leaf.menu, colIndex).read),
                write: leaves.some((leaf) => leafFlag(leaf.menu, colIndex).write),
              };
            })
            .filter((menu) => menu.read || menu.write),
        })),
    };
  };

  const handleSave = async () => {
    if (!dirty) {
      toast.info('There are no changes to save.');
      return;
    }
    try {
      await saveMatrix.mutateAsync(buildRequest());
      toast.success(SYS_MESSAGES.saved);
      setEdits(new Map());
      void useMenuStore.getState().invalidateMenuCache();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const renderCell = (node: Node, column: MatrixColumn, colIndex: number, kind: FlagKind) => {
    const key = `${roleKey(column)}-${kind}`;
    if (column.superAdmin) {
      return (
        <td key={key} className={styles.checkCell}>
          <Checkbox checked disabled aria-label={`${kind} fixed for Super Admin`} />
        </td>
      );
    }
    const state = node.children.length
      ? derive(node, colIndex, kind)
      : { checked: leafFlag(node.menu, colIndex)[kind], indeterminate: false };
    const edited = !node.children.length && edits.has(cellKey(column, node.menu.menuCd));
    return (
      <td key={key} className={styles.checkCell} data-edited={edited || undefined}>
        <Checkbox
          checked={state.checked}
          indeterminate={state.indeterminate}
          disabled={!canWrite}
          aria-label={`${menuName(node.menu)} ${column.roleNm ?? column.roleId} ${kind}`}
          onChange={(e) => toggle(node, colIndex, kind, e.target.checked)}
        />
      </td>
    );
  };

  const renderRow = (node: Node) => {
    const { menu } = node;
    const isParent = node.children.length > 0;
    const open = isParent && !collapsed.has(menu.menuCd);
    const inactive = menu.useYn !== 'Y';
    return (
      <tr key={menu.menuCd} data-parent={isParent || undefined} data-inactive={inactive || undefined}>
        <td className={styles.codeCell}>{menu.menuCd}</td>
        <td className={styles.nameCell}>
          <span className={styles.nameInner} style={{ '--level': node.level - 1 } as CSSProperties}>
            {isParent ? (
              <button
                type="button"
                className={styles.toggle}
                aria-label={open ? 'Collapse' : 'Expand'}
                onClick={() => toggleNode(menu.menuCd)}
              >
                {open ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
              </button>
            ) : (
              <span className={styles.toggleSpacer} />
            )}
            <span className={styles.menuName}>{menuName(menu)}</span>
          </span>
        </td>
        {columns.flatMap((column, colIndex) => [
          renderCell(node, column, colIndex, 'read'),
          renderCell(node, column, colIndex, 'write'),
        ])}
      </tr>
    );
  };

  return (
    <SysPage fill>
      <SysTitleBar title={screen.title} breadcrumb={[...screen.breadcrumb]} />
      <div className={styles.toolbar}>
        {dirty && <span className={styles.dirtyNote}>{edits.size} unsaved change(s)</span>}
        <SysButton look="outline" icon={<ReloadOutlined />} onClick={handleRefresh}>
          Refresh
        </SysButton>
        {canWrite && (
          <SysButton look="primary" loading={saveMatrix.isPending} onClick={() => void handleSave()}>
            Save
          </SysButton>
        )}
      </div>
      {error && (
        <Alert type="error" showIcon title="The permission matrix could not be loaded." description={error.message} />
      )}
      <Spin spinning={isFetching} classNames={{ root: styles.spin }}>
        <div className={styles.tableWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th rowSpan={2} className={styles.codeHead}>
                  Menu Code
                </th>
                <th rowSpan={2} className={styles.nameHead}>
                  Menu Name
                </th>
                {columns.map((column) => (
                  <th key={roleKey(column)} colSpan={2} title={column.roleGroupNm ?? column.roleGroupId}>
                    {column.superAdmin ? 'Super Admin' : (column.roleNm ?? column.roleId)}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.flatMap((column) => [
                  <th key={`${roleKey(column)}-read`} className={styles.subHead}>
                    Read
                  </th>,
                  <th key={`${roleKey(column)}-write`} className={styles.subHead}>
                    Write
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {visible.map(renderRow)}
              {!isFetching && visible.length === 0 && (
                <tr>
                  <td colSpan={2 + columns.length * 2} className={styles.emptyCell}>
                    No menus.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Spin>
    </SysPage>
  );
}
