import { useOwnPageTitle } from '@/components/layout/page-header-slot-context';
import type { CSSProperties, Key, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import type { SortOrder, SorterResult } from 'antd/es/table/interface';
import {
  ClockCircleOutlined,
  HomeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import ActionButton from '@/components/common/actions/ActionButton';
import CommonStatusBadge, { type StatusBadgeColor } from '@/components/common/badge/StatusBadge';
import Pagination from '@/components/common/pagination/Pagination';
import DataTable, { type DataTableProps } from '@/components/common/table/DataTable';
import type { ActionButtonProps } from '@/types/action-button';
import type { SortState } from '@/hooks/use-paged-list';
import { formatSysDateTime } from '@/utils/system-utils';
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
  // The page draws its own title and breadcrumb (design): hide the shared tab header row.
  useOwnPageTitle();
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

/** Gray search-condition box; children are `SysFilterItem`s laid out in `columns` (default 4, as in the design). */
export function SysFilterPanel({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
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
  const { t } = useTranslation();
  return (
    <div className={styles.searchActions}>
      <ActionButton action="reset" onClick={onReset}>
        {t('common.reset')}
      </ActionButton>
      <ActionButton action="search" loading={loading} onClick={onSearch}>
        {t('common.search')}
      </ActionButton>
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
export function SysSectionHeader({ title, total, actions, primaryActions }: SysSectionHeaderProps) {
  const { t } = useTranslation();
  const heading = title ?? t('common.searchResults');
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleText} title={typeof heading === 'string' ? heading : undefined}>
          {heading}
        </span>
        {total !== undefined && (
          <span className={styles.sectionTotal}>
            {t('common.total')} <strong>{total.toLocaleString('en-US')}</strong>
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

type SysButtonLook = 'default' | 'navy' | 'primary' | 'outline' | 'danger';

/**
 * Design buttons (`look`): `navy` = [New] / list [Save], `primary` = popup submit, `outline` = [Cancel] / [Reset],
 * `default` = secondary list actions ([Add Row], [Delete Row], [Fee Schedule]…), `danger` = popup [Delete] (filled red).
 */
export function SysButton({
  look = 'default',
  className,
  danger,
  ...props
}: Omit<ActionButtonProps, 'type' | 'variant' | 'color'> & { look?: SysButtonLook }) {
  // `danger` on any look renders the filled red button of the design
  if (look === 'danger' || danger) {
    return <ActionButton intent="danger" appearance="filled" className={className} {...props} />;
  }
  if (look === 'primary') {
    return <ActionButton intent="primary" appearance="filled" className={className} {...props} />;
  }
  if (look === 'outline') {
    return <ActionButton intent="primary" appearance="outlined" className={className} {...props} />;
  }
  if (look === 'navy') {
    return <ActionButton intent="secondary" appearance="filled" className={className} {...props} />;
  }
  return <ActionButton intent="quaternary" appearance="outlined" className={className} {...props} />;
}

/** [Excel Download] with the green sheet icon. */
export function SysExcelButton({ onClick, loading, disabled }: { onClick: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <ActionButton action="excelDownload" loading={loading} disabled={disabled} onClick={onClick}>
      Excel Download
    </ActionButton>
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
  const mappedColor: StatusBadgeColor = tone === 'navy' ? 'navy' : tone;
  return (
    <CommonStatusBadge
      color={mappedColor}
      variant={tone === 'navy' ? 'filled' : 'outlined'}
    >
      {children}
    </CommonStatusBadge>
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

type SysTableProps<T extends object> = Omit<DataTableProps<T>, 'pagination' | 'onChange' | 'columns'> & {
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
  rowClassName,
  ...rest
}: SysTableProps<T>) {
  const controlledColumns = columns.map((column) => {
    if (!isServerSorted(column, onSortChange)) return column;
    const key = columnSortKey(column);
    const sortOrder: SortOrder = sort && key === sort.sortBy ? (sort.sortDirection === 'ASC' ? 'ascend' : 'descend') : null;
    return { ...column, sortOrder };
  });

  const handleChange: DataTableProps<T>['onChange'] = (_pagination, _filters, sorter) => {
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
      <DataTable<T>
        size="middle"
        rowKey={rowKey}
        columns={controlledColumns}
        pagination={false}
        showSorterTooltip={false}
        // Fixed layout fits the frame and ellipsizes; auto layout scrolls sideways when the columns are wider
        scroll={rest.tableLayout === 'fixed' ? undefined : { x: 'max-content' }}
        onChange={handleChange}
        onRow={(row) => ({ onClick: onRowClick ? () => onRowClick(row) : undefined })}
        rowClassName={(row, index, indent) => {
          const own = typeof rowClassName === 'function' ? rowClassName(row, index, indent) : rowClassName;
          const selected =
            selectedRowKey !== undefined && selectedRowKey !== null && resolveKey(row, index) === selectedRowKey;
          return [own, selected ? styles.rowSelected : ''].filter(Boolean).join(' ');
        }}
        {...rest}
      />
    </div>
  );
}

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
  return (
    <div className={styles.pager}>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={onChange} />
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
export function SysNotAvailable({ title, children, variant = 'banner' }: SysNotAvailableProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('messages.sys.notAvailableYet');
  if (variant === 'inline') {
    return (
      <span className={styles.notAvailableInline}>
        <ClockCircleOutlined />
        <span className={styles.notAvailableTitleInline}>{resolvedTitle}</span>
        {children && <span className={styles.notAvailableReason}>{children}</span>}
      </span>
    );
  }
  return (
    <div className={styles.notAvailable} role="note">
      <ClockCircleOutlined className={styles.notAvailableIcon} />
      <div>
        <div className={styles.notAvailableTitle}>{resolvedTitle}</div>
        {children && <div className={styles.notAvailableReason}>{children}</div>}
      </div>
    </div>
  );
}
