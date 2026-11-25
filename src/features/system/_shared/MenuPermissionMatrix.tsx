import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'antd';
import { CaretDownOutlined, CaretUpOutlined, MinusSquareOutlined, PlusSquareOutlined, ReloadOutlined } from '@ant-design/icons';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useMenuStore } from '@/stores/menu-store';
import type { MatrixColumn, MatrixRow, SaveMatrixRequest } from '@/api/system/menu-permission-api';
import type { MenuSeCd } from '@/api/system/menu-setting-api';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { errorMessage } from '@/utils/system-utils';
import { buildMenuTree, descendants, menuName } from './menu-tree';
import type { MenuNode } from './menu-tree';
import styles from './menu-permission-matrix.module.scss';
import { useMenuPermissionMatrix, useSaveMenuPermissionMatrix } from './use-menu-permissions';

// Menu permission matrix — menus (rows, as a tree) × roles (columns), Read / Write.
//   menuSeCd = W → Web Menu Permission Management (VPA09010501), columns = member types (Individual, Foreigner, Organization)
//   menuSeCd = A → Menu Permission Management     (VPA09020401), columns = Super Admin, Receiver, Staff in Charge,
//                  Approver (one column for the approver roles 1STAPPR, 2NDAPPR and CEO, saved together)
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

/** Role names are stored as "English / Vietnamese"; the system screens show the English part. */
const roleLabel = (column: MatrixColumn) =>
  column.superAdmin ? 'Super Admin' : (column.roleNm?.split(' / ')[0]?.trim() || column.roleId);

/** Display columns of the admin matrix (Figma VPA09020401); other admin roles are not shown and keep their mappings. */
const ADMIN_GROUPS: Array<{ label: string; roleIds: string[] }> = [
  { label: 'Receiver', roleIds: ['RCPT'] },
  { label: 'Staff in Charge', roleIds: ['PRCS'] },
  { label: 'Approver', roleIds: ['1STAPPR', '2NDAPPR', 'CEO'] },
];

/** One displayed column: a single role, or several roles edited together. */
interface Group {
  key: string;
  label: string;
  title: string;
  superAdmin: boolean;
  /** Indexes into the API columns. */
  cols: number[];
}

type SortKey = 'menuCd' | 'menuName';
interface SortState {
  key: SortKey;
  asc: boolean;
}

const roleKey = (column: Pick<MatrixColumn, 'roleGroupId' | 'roleId'>) => `${column.roleGroupId}|${column.roleId}`;
const cellKey = (column: MatrixColumn, menuCd: string) => `${roleKey(column)}|${menuCd}`;

/** Checked / indeterminate state of a parent row from its leaf submenus. */
interface Derived {
  checked: boolean;
  indeterminate: boolean;
}

export default function MenuPermissionMatrix({ menuSeCd }: Props) {
  const { t } = useTranslation();
  const screen = SCREEN[menuSeCd];
  const { toast } = useNotify();
  const { guardDiscard } = useSysDialogs();
  const { canWrite } = useMenuPermission();

  const { data, isFetching, error, refetch } = useMenuPermissionMatrix(menuSeCd);
  const saveMatrix = useSaveMenuPermissionMatrix();

  /** Edited leaf cells only; a cell set back to its stored value is dropped. */
  const [edits, setEdits] = useState<ReadonlyMap<string, Flag>>(new Map());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const [sort, setSort] = useState<SortState | null>(null);

  const columns = useMemo(() => data?.columns ?? [], [data]);
  const groups = useMemo<Group[]>(() => {
    const indexed = columns.map((column, index) => ({ column, index }));
    const superAdmins = indexed.filter(({ column }) => column.superAdmin);
    const own = (column: MatrixColumn) => ({ key: roleKey(column), label: roleLabel(column), title: column.roleNm ?? column.roleId });
    const head = superAdmins.map(({ column, index }) => ({ ...own(column), superAdmin: true, cols: [index] }));
    if (menuSeCd !== 'A') {
      return [...head, ...indexed.filter(({ column }) => !column.superAdmin).map(({ column, index }) => ({ ...own(column), superAdmin: false, cols: [index] }))];
    }
    const rest = ADMIN_GROUPS.map((group) => {
      const members = indexed.filter(({ column }) => !column.superAdmin && group.roleIds.includes(column.roleId));
      return {
        key: group.label,
        label: group.label,
        title: members.map(({ column }) => roleLabel(column)).join(', '),
        superAdmin: false,
        cols: members.map(({ index }) => index),
      };
    }).filter((group) => group.cols.length > 0);
    return [...head, ...rest];
  }, [columns, menuSeCd]);
  const tree = useMemo(() => buildMenuTree(data?.rows ?? []), [data]);
  /** Depth-first rows; with a sort, siblings are ordered by the sort key (the tree structure is kept). */
  const visible = useMemo(() => {
    const out: Node[] = [];
    const order = (nodes: Node[]) => {
      if (!sort) return nodes;
      const value = (node: Node) => (sort.key === 'menuCd' ? node.menu.menuCd : menuName(node.menu));
      const sorted = [...nodes].sort((a, b) => value(a).localeCompare(value(b), 'en', { numeric: true }));
      return sort.asc ? sorted : sorted.reverse();
    };
    const walk = (nodes: Node[]) =>
      order(nodes).forEach((node) => {
        out.push(node);
        if (node.children.length && !collapsed.has(node.menu.menuCd)) walk(node.children);
      });
    walk(tree.roots);
    return out;
  }, [tree, collapsed, sort]);
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

  /** Checked when every (leaf, role) pair of the group is set, indeterminate when only some are. */
  const derive = (node: Node, cols: number[], kind: FlagKind): Derived => {
    const leaves = node.children.length ? (leavesOf.get(node.menu.menuCd) ?? []) : [node];
    const total = leaves.length * cols.length;
    const count = leaves.reduce((sum, leaf) => sum + cols.filter((c) => leafFlag(leaf.menu, c)[kind]).length, 0);
    return { checked: total > 0 && count === total, indeterminate: count > 0 && count < total };
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

  const toggle = (node: Node, cols: number[], kind: FlagKind, checked: boolean) => {
    const leaves = node.children.length ? (leavesOf.get(node.menu.menuCd) ?? []) : [node];
    cols.forEach((colIndex) =>
      updateLeaves(leaves, colIndex, (current) => {
        if (kind === 'read') return { read: checked, write: checked ? current.write : false };
        return { read: checked ? true : current.read, write: checked };
      }),
    );
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
      toast.info(t('messages.system.menu.noPermissionChanges'));
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

  const renderCell = (node: Node, group: Group, kind: FlagKind) => {
    const key = `${group.key}-${kind}`;
    if (group.superAdmin) {
      return (
        <td key={key} className={styles.checkCell} data-fixed>
          <AppCheckbox checked disabled aria-label={`${kind} fixed for Super Admin`} />
        </td>
      );
    }
    const state = derive(node, group.cols, kind);
    const edited = !node.children.length && group.cols.some((c) => edits.has(cellKey(columns[c], node.menu.menuCd)));
    return (
      <td key={key} className={styles.checkCell} data-edited={edited || undefined}>
        <AppCheckbox
          checked={state.checked}
          indeterminate={state.indeterminate}
          disabled={!canWrite}
          aria-label={`${menuName(node.menu)} ${group.label} ${kind}`}
          onChange={(e) => toggle(node, group.cols, kind, e.target.checked)}
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
        {groups.flatMap((group) => [renderCell(node, group, 'read'), renderCell(node, group, 'write')])}
      </tr>
    );
  };

  /** Header with a sort toggle: ascending → descending → menu order. */
  const sortHeader = (key: SortKey, label: string) => {
    const active = sort?.key === key;
    const next = () => setSort(!active ? { key, asc: true } : sort?.asc ? { key, asc: false } : null);
    return (
      <button type="button" className={styles.sortHead} onClick={next} aria-label={`Sort by ${label}`}>
        {label}
        <span className={styles.sortIcons}>
          <CaretUpOutlined data-on={(active && sort?.asc) || undefined} />
          <CaretDownOutlined data-on={(active && !sort?.asc) || undefined} />
        </span>
      </button>
    );
  };

  return (
    <SysPage fill>
      <SysTitleBar title={screen.title} breadcrumb={[...screen.breadcrumb]} />
      <div className={styles.toolbar}>
        {dirty && <span className={styles.dirtyNote}>{t('messages.system.menu.unsavedChanges', { count: edits.size })}</span>}
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
        <Alert type="error" showIcon title={t('messages.system.menu.loadMatrixFailed')} description={error.message} />
      )}
      <LoadingSpinner spinning={isFetching} classNames={{ root: styles.spin }}>
        <div className={styles.tableWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th rowSpan={2} className={styles.codeHead}>
                  {menuSeCd === 'A' ? sortHeader('menuCd', 'Menu Code') : 'Menu Code'}
                </th>
                <th rowSpan={2} className={styles.nameHead}>
                  {menuSeCd === 'A' ? sortHeader('menuName', 'Menu Name') : 'Menu Name'}
                </th>
                {groups.map((group) => (
                  <th key={group.key} colSpan={2} title={group.title}>
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr>
                {groups.flatMap((group) => [
                  <th key={`${group.key}-read`} className={styles.subHead}>
                    Read
                  </th>,
                  <th key={`${group.key}-write`} className={styles.subHead}>
                    Write
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {visible.map(renderRow)}
              {!isFetching && visible.length === 0 && (
                <tr>
                  <td colSpan={2 + groups.length * 2} className={styles.emptyCell}>
                    No menus.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </LoadingSpinner>
    </SysPage>
  );
}
