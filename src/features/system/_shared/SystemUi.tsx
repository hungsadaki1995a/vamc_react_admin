import type { ReactNode } from 'react';
import {
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import ActionButton from '@/components/common/actions/ActionButton';
import Pagination from '@/components/common/pagination/Pagination';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import { splitDateTime } from './system-utils';
import styles from './system-page.module.scss';

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
          <span key={item} className={styles.contents}>
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
            <ActionButton action="reset" onClick={onReset}>
              {resetLabel}
            </ActionButton>
          )}
          {onSearch && (
            <ActionButton action="search" intent="secondary" appearance="filled" onClick={onSearch}>
              {searchLabel}
            </ActionButton>
          )}
          {onToggleFilter && (
            <ActionButton
              intent="icon"
              icon={filterCollapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={onToggleFilter}
            />
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

  return (
    <div className={styles.paginationContainer}>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={onChange} />
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
      <AppCheckbox checked={yes && no} onChange={(e) => onChange(e.target.checked, e.target.checked)}>
        {allLabel}
      </AppCheckbox>
      <AppCheckbox checked={yes} onChange={(e) => onChange(e.target.checked, no)}>
        {yesLabel}
      </AppCheckbox>
      <AppCheckbox checked={no} onChange={(e) => onChange(yes, e.target.checked)}>
        {noLabel}
      </AppCheckbox>
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
