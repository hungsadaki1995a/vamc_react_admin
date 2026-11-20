import type { ReactNode } from 'react';
import { Checkbox } from 'antd';
import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { splitDateTime } from './system-utils';
import styles from './system-page.module.css';

// Small building blocks shared by the System Operation Management screens.

interface SysPageHeaderProps {
  /** Path after "Home", last item is the current page. */
  breadcrumb: string[];
  title: string;
  resetLabel?: string;
  searchLabel?: string;
  onReset?: () => void;
  onSearch?: () => void;
  /** Filter collapse toggle — hidden when `onToggleFilter` is not given. */
  filterCollapsed?: boolean;
  onToggleFilter?: () => void;
}

/** Breadcrumb + page title + Reset / Search / collapse buttons (wireframe header). */
export function SysPageHeader({
  breadcrumb,
  title,
  resetLabel = 'Reset',
  searchLabel = 'Search',
  onReset,
  onSearch,
  filterCollapsed,
  onToggleFilter,
}: SysPageHeaderProps) {
  return (
    <>
      <div className={styles.breadcrumb}>
        <span>Home</span>
        {breadcrumb.map((item, index) => (
          <span key={item} className="contents">
            <span className={styles.breadcrumbSeparator}>&gt;</span>
            <span className={index === breadcrumb.length - 1 ? styles.breadcrumbCurrent : undefined}>
              {item}
            </span>
          </span>
        ))}
      </div>
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <div className={styles.headerActions}>
          {onReset && (
            <button type="button" className={styles.btn} onClick={onReset}>
              {resetLabel}
            </button>
          )}
          {onSearch && (
            <button type="button" className={styles.btnDark} onClick={onSearch}>
              <SearchOutlined className="text-[13px]" />
              {searchLabel}
            </button>
          )}
          {onToggleFilter && (
            <button type="button" className={styles.btnCollapse} onClick={onToggleFilter}>
              {filterCollapsed ? <DownOutlined /> : <UpOutlined />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

interface SysPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  hideOnSinglePage?: boolean;
}

const BLOCK_SIZE = 10;

/** Centered numeric pagination in blocks of 10 pages. */
export function SysPagination({
  page,
  pageSize,
  total,
  onChange,
  hideOnSinglePage = false,
}: SysPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (hideOnSinglePage && totalPages <= 1) return null;
  const start = Math.floor((page - 1) / BLOCK_SIZE) * BLOCK_SIZE + 1;
  const end = Math.min(start + BLOCK_SIZE - 1, totalPages);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className={styles.paginationContainer}>
      {start > 1 && (
        <>
          <button type="button" className={styles.pageNavBtn} onClick={() => onChange(1)}>
            <DoubleLeftOutlined />
          </button>
          <button type="button" className={styles.pageNavBtn} onClick={() => onChange(start - 1)}>
            <LeftOutlined />
          </button>
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? styles.pageNumberActive : styles.pageNumber}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          <button type="button" className={styles.pageNavBtn} onClick={() => onChange(end + 1)}>
            <RightOutlined />
          </button>
          <button type="button" className={styles.pageNavBtn} onClick={() => onChange(totalPages)}>
            <DoubleRightOutlined />
          </button>
        </>
      )}
    </div>
  );
}

/** Two-line date / time cell; `-` when empty. */
export function DateTimeCell({ value }: { value?: string | null }) {
  const parts = splitDateTime(value);
  if (!parts) return <span>-</span>;
  return (
    <div className={styles.dateTimeCell}>
      <span>{parts.date}</span>
      {parts.time && <span className={styles.textMuted}>{parts.time}</span>}
    </div>
  );
}

/** Y / N usage flag. */
export function UseFlag({ value }: { value?: string }) {
  return <span className={value === 'Y' ? styles.useY : styles.useN}>{value ?? '-'}</span>;
}

interface UseYnChecksProps {
  yes: boolean;
  no: boolean;
  onChange: (yes: boolean, no: boolean) => void;
  allLabel: string;
  yesLabel: string;
  noLabel: string;
}

/** "ALL / Used / Unused" checkbox trio of the list filters. */
export function UseYnChecks({ yes, no, onChange, allLabel, yesLabel, noLabel }: UseYnChecksProps) {
  return (
    <div className={styles.filterCheckboxes}>
      <Checkbox checked={yes && no} onChange={(e) => onChange(e.target.checked, e.target.checked)}>
        {allLabel}
      </Checkbox>
      <Checkbox checked={yes} onChange={(e) => onChange(e.target.checked, no)}>
        {yesLabel}
      </Checkbox>
      <Checkbox checked={no} onChange={(e) => onChange(yes, e.target.checked)}>
        {noLabel}
      </Checkbox>
    </div>
  );
}

/** Label cell + value cell of a `.formGrid`. */
export function FormField({
  label,
  required,
  span,
  children,
}: {
  label: string;
  required?: boolean;
  /** `wide` spans 3 grid tracks, `full` runs to the end of the row. */
  span?: 'wide' | 'full';
  children: ReactNode;
}) {
  const valueClass = [
    styles.formValue,
    span === 'wide' ? styles.span2 : '',
    span === 'full' ? styles.spanFull : '',
  ].join(' ');
  return (
    <>
      <div className={`${styles.formLabel} ${required ? styles.required : ''}`}>{label}</div>
      <div className={valueClass}>{children}</div>
    </>
  );
}
