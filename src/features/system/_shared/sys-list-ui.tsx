import type { CSSProperties, Key, ReactNode } from 'react';
import { Button, Table } from 'antd';
import type { ButtonProps, TableColumnsType, TableProps } from 'antd';
import type { SortOrder, SorterResult } from 'antd/es/table/interface';
import {
  ClockCircleOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  FileExcelFilled,
  HomeOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { SortState } from './use-paged-list';
import { formatSysDateTime } from './system-utils';
import styles from './sys-ui.module.scss';

// Layout building blocks of the v0.8 System Operation Management list screens:
//   SysPage > SysTitleBar > SysFilterPanel(SysFilterItem…) > SysSearchActions
//   > SysSectionHeader (title | Total n, Excel / New) > SysTable > SysPager.
// See ke-hoach-ui.md "Thành phần dùng chung" for a full example.

/** Page container with the v0.8 spacing; `fill` stretches the last child (tree / master-detail screens). */
export function SysPage({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return <div className={fill ? `${styles.page} ${styles.pageFill}` : styles.page}>{children}</div>;
}

interface SysTitleBarProps {
  title: string;
  /** Path after the home icon, e.g. ['System Operation Management', 'NPL Platform Management', 'Form Management']. */
  breadcrumb: string[];
}

/** Page title on the left, home > … breadcrumb on the right. */
export function SysTitleBar({ title, breadcrumb }: SysTitleBarProps) {
  return (
    <div className={styles.titleBar}>
      <h1 className={styles.title}>{title}</h1>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <HomeOutlined />
        {breadcrumb.map((item) => (
          <span key={item} className={styles.breadcrumbItem}>
            <RightOutlined className={styles.breadcrumbSep} />
            {item}
          </span>
        ))}
      </nav>
    </div>
  );
}

/** Gray search-condition box; children are `SysFilterItem`s laid out in `columns` (default 3). */
export function SysFilterPanel({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return (
    <div className={styles.filterPanel} data-cols={columns}>
      {children}
    </div>
  );
}

interface SysFilterItemProps {
  label: string;
  children: ReactNode;
  /** Grid columns the item spans. */
  span?: 1 | 2 | 3;
  /** Small grey note after the control, e.g. "Not available yet" next to a disabled filter. */
  hint?: ReactNode;
}

/** Label + control of one search condition; `span` widens it over several columns. */
export function SysFilterItem({ label, children, span = 1, hint }: SysFilterItemProps) {
  return (
    <div className={styles.filterItem} data-span={span}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.filterControl}>
        {children}
        {hint && <span className={styles.filterHint}>{hint}</span>}
      </div>
    </div>
  );
}

/** [Reset] [Search] row under the filter panel (right aligned). */
export function SysSearchActions({
  onReset,
  onSearch,
  loading,
}: {
  onReset: () => void;
  onSearch: () => void;
  loading?: boolean;
}) {
  return (
    <div className={styles.searchActions}>
      <Button color="primary" variant="outlined" icon={<ReloadOutlined />} onClick={onReset}>
        Reset
      </Button>
      <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={onSearch}>
        Search
      </Button>
    </div>
  );
}

interface SysSectionHeaderProps {
  /** Defaults to "Search Results". Master-detail panels pass their own (e.g. "[Group] Code Details"). */
  title?: ReactNode;
  /** Shown as "| Total n" when given. */
  total?: number;
  /** Right side buttons (SysExcelButton, SysButton…), separated from the left ones by a divider when `primaryActions` is set. */
  actions?: ReactNode;
  /** Rightmost group after a divider, typically [New] / [Save]. */
  primaryActions?: ReactNode;
}

/** "Search Results | Total n" with list actions on the right. */
export function SysSectionHeader({ title = 'Search Results', total, actions, primaryActions }: SysSectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitle}>
        <span>{title}</span>
        {total !== undefined && (
          <span className={styles.sectionTotal}>
            Total <strong>{total.toLocaleString('en-US')}</strong>
          </span>
        )}
      </div>
      <div className={styles.sectionActions}>
        {actions}
        {actions && primaryActions && <span className={styles.actionDivider} />}
        {primaryActions}
      </div>
    </div>
  );
}

type SysButtonLook = 'default' | 'navy' | 'primary' | 'outline';

/**
 * Design buttons (`look`): `navy` = [New] / list [Save], `primary` = popup submit, `outline` = [Cancel] / [Reset],
 * `default` = secondary list actions ([Add Row], [Delete Row], [Fee Schedule]…).
 */
export function SysButton({
  look = 'default',
  className,
  ...props
}: Omit<ButtonProps, 'type' | 'variant' | 'color'> & { look?: SysButtonLook }) {
  const variant = look;
  if (variant === 'primary') return <Button type="primary" className={className} {...props} />;
  if (variant === 'outline') return <Button color="primary" variant="outlined" className={className} {...props} />;
  const cls = variant === 'navy' ? styles.btnNavy : undefined;
  return <Button className={[cls, className].filter(Boolean).join(' ') || undefined} {...props} />;
}

/** [Excel Download] with the green sheet icon. */
export function SysExcelButton({ onClick, loading, disabled }: { onClick: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Button icon={<FileExcelFilled className={styles.excelIcon} />} loading={loading} disabled={disabled} onClick={onClick}>
      Excel Download
    </Button>
  );
}

/** Active / Inactive use badge (`Y` / `N`). */
export function UseBadge({ value }: { value?: string | boolean | null }) {
  const active = value === 'Y' || value === true;
  if (value === undefined || value === null) return <span>-</span>;
  return <StatusBadge tone={active ? 'blue' : 'gray'}>{active ? 'Active' : 'Inactive'}</StatusBadge>;
}

export type BadgeTone = 'blue' | 'gray' | 'green' | 'red' | 'orange' | 'navy';

/** Small outlined label (Use, Type, Result, Status…). */
export function StatusBadge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}

/** Success / Failed (/ Running) badge of batch runs and send results; `-` when there is no record. */
export function ResultBadge({ value }: { value?: string | boolean | null }) {
  if (value === undefined || value === null || value === '') return <span>-</span>;
  const v = typeof value === 'boolean' ? (value ? 'SUCCESS' : 'FAILED') : value.toUpperCase();
  if (v === 'SUCCESS' || v === 'Y') return <StatusBadge tone="green">Success</StatusBadge>;
  if (v === 'FAILED' || v === 'FAIL' || v === 'N') return <StatusBadge tone="red">Failed</StatusBadge>;
  if (v === 'RUNNING') return <StatusBadge tone="orange">Running</StatusBadge>;
  return <StatusBadge>{value}</StatusBadge>;
}

/** `DD-MM-YYYY HH:mm` (`seconds` → `:ss`, `dateOnly` → date only). */
export function DateTimeText({
  value,
  seconds = false,
  dateOnly = false,
}: {
  value?: string | null;
  seconds?: boolean;
  dateOnly?: boolean;
}) {
  return <span className={styles.nowrap}>{formatSysDateTime(value, { withSeconds: seconds, dateOnly })}</span>;
}

type SysTableProps<T> = Omit<TableProps<T>, 'pagination' | 'onChange' | 'columns'> & {
  columns: TableColumnsType<T>;
  /** Row click (opens the edit popup / selects the master row). */
  onRowClick?: (row: T) => void;
  /** Highlighted row of a master-detail list. */
  selectedRowKey?: Key | null;
  /**
   * Server-side sort: columns with `sorter: true` and a `key` (or string `dataIndex`) = API sort field
   * are controlled by `sort` / `onSortChange`. Columns with a compare function (`sorter: (a, b) => …`)
   * sort the loaded rows on the client and are left to antd.
   */
  sort?: SortState;
  onSortChange?: (sort?: SortState) => void;
  /** Stretch to the panel height and scroll inside it (master-detail panels). */
  fill?: boolean;
};

/** Server sort applies only to `sorter: true` columns of a table that has `onSortChange`. */
function isServerSorted<T>(column: TableColumnsType<T>[number], onSortChange?: (sort?: SortState) => void): boolean {
  return Boolean(onSortChange) && column.sorter === true;
}

function columnSortKey<T>(column: TableColumnsType<T>[number]): string | undefined {
  if (column.key !== undefined) return String(column.key);
  const dataIndex = 'dataIndex' in column ? column.dataIndex : undefined;
  return typeof dataIndex === 'string' ? dataIndex : undefined;
}

/** antd Table with the v0.8 look: centered gray header, row click, selected row, server sort, no built-in pager. */
export function SysTable<T extends object>({
  columns,
  onRowClick,
  selectedRowKey,
  sort,
  onSortChange,
  fill = false,
  rowKey,
  className,
  ...rest
}: SysTableProps<T>) {
  const controlledColumns = columns.map((column) => {
    if (!isServerSorted(column, onSortChange)) return column;
    const key = columnSortKey(column);
    const sortOrder: SortOrder = sort && key === sort.sortBy ? (sort.sortDirection === 'ASC' ? 'ascend' : 'descend') : null;
    return { ...column, sortOrder };
  });

  const handleChange: TableProps<T>['onChange'] = (_pagination, _filters, sorter) => {
    if (!onSortChange) return;
    const single = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<T> | undefined;
    // Client-sorted column: antd already reordered the rows.
    if (single?.column && !isServerSorted(single.column as TableColumnsType<T>[number], onSortChange)) return;
    const key = single?.column ? columnSortKey(single.column as TableColumnsType<T>[number]) : undefined;
    if (!single?.order || !key) {
      onSortChange(undefined);
      return;
    }
    onSortChange({ sortBy: key, sortDirection: single.order === 'ascend' ? 'ASC' : 'DESC' });
  };

  const resolveKey = (row: T, index?: number): Key => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string') return (row as Record<string, Key>)[rowKey];
    return index ?? 0;
  };

  const wrapperClass = [styles.tableWrap, fill ? styles.tableFill : '', onRowClick ? styles.rowClickable : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <Table<T>
        size="middle"
        rowKey={rowKey}
        columns={controlledColumns}
        pagination={false}
        showSorterTooltip={false}
        scroll={{ x: 'max-content' }}
        onChange={handleChange}
        onRow={(row) => ({ onClick: onRowClick ? () => onRowClick(row) : undefined })}
        rowClassName={(row, index) =>
          selectedRowKey !== undefined && selectedRowKey !== null && resolveKey(row, index) === selectedRowKey
            ? styles.rowSelected
            : ''
        }
        {...rest}
      />
    </div>
  );
}

const PAGE_BLOCK = 10;

/** Centered pager « ‹ 1 2 … 10 › » in blocks of 10 pages; hidden while there is no data. */
export function SysPager({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.floor((page - 1) / PAGE_BLOCK) * PAGE_BLOCK + 1;
  const end = Math.min(start + PAGE_BLOCK - 1, totalPages);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className={styles.pager}>
      <button type="button" className={styles.pagerNav} disabled={page === 1} onClick={() => onChange(1)} aria-label="First page">
        <DoubleLeftOutlined />
      </button>
      <button type="button" className={styles.pagerNav} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <LeftOutlined />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={styles.pagerNumber}
          data-active={p === page || undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={styles.pagerNav}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <RightOutlined />
      </button>
      <button
        type="button"
        className={styles.pagerNav}
        disabled={page === totalPages}
        onClick={() => onChange(totalPages)}
        aria-label="Last page"
      >
        <DoubleRightOutlined />
      </button>
    </div>
  );
}

/** Side-by-side panels (master-detail lists, menu tree + details). `ratio` = left share, e.g. '1fr 1fr' or '2fr 3fr'. */
export function SysSplit({ left, right, ratio = '1fr 1fr' }: { left: ReactNode; right: ReactNode; ratio?: string }) {
  return (
    <div className={styles.split} style={{ '--split-cols': ratio } as CSSProperties}>
      <section className={styles.splitPane}>{left}</section>
      <section className={styles.splitPane}>{right}</section>
    </div>
  );
}

/** Empty-state text inside a detail panel (e.g. "Select a code group."). */
export function SysEmpty({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}

interface SysNotAvailableProps {
  /** Headline, default "Not available yet". */
  title?: ReactNode;
  /** Reason / what it waits for, e.g. "Waits for the FORM_MNG schema change." */
  children?: ReactNode;
  /** `banner` = full-width block (screen / section), `inline` = one-line note (next to a field or button). */
  variant?: 'banner' | 'inline';
}

/** Notice for a feature waiting on a backend / schema change; keep the matching `TODO(schema)` in code. */
export function SysNotAvailable({ title = 'Not available yet', children, variant = 'banner' }: SysNotAvailableProps) {
  if (variant === 'inline') {
    return (
      <span className={styles.notAvailableInline}>
        <ClockCircleOutlined />
        {title}
        {children && <span className={styles.notAvailableReason}>{children}</span>}
      </span>
    );
  }
  return (
    <div className={styles.notAvailable} role="note">
      <ClockCircleOutlined className={styles.notAvailableIcon} />
      <div>
        <div className={styles.notAvailableTitle}>{title}</div>
        {children && <div className={styles.notAvailableReason}>{children}</div>}
      </div>
    </div>
  );
}
