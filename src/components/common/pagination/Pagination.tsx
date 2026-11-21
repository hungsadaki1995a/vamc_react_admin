import styles from './pagination.module.scss';

export type PaginationVariant = 'numbered' | 'fraction';

export type PaginationProps = {
  page: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  blockSize?: number;
  variant?: PaginationVariant;
  onChange: (page: number) => void;
  className?: string;
  hideOnSinglePage?: boolean;
};

function NavChevron({ kind }: { kind: 'first' | 'prev' | 'next' | 'last' }) {
  if (kind === 'first') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M9.5 10.5L6 7l3.5-3.5M6 10.5L2.5 7 6 3.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'last') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M4.5 3.5L8 7l-3.5 3.5M8 3.5L11.5 7 8 10.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'prev') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M8.5 10.5L5 7l3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.5 3.5L9 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Pagination matching Figma Pagination component (4042:25792): numbered and fraction types. */
export default function Pagination({
  page,
  totalPages,
  total,
  pageSize = 10,
  blockSize = 10,
  variant = 'numbered',
  onChange,
  className,
  hideOnSinglePage = false,
}: PaginationProps) {
  const computedTotalPages =
    totalPages ?? (total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 1);

  if (hideOnSinglePage && computedTotalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(1, page), computedTotalPages);
  const blockStart = Math.floor((safePage - 1) / blockSize) * blockSize + 1;
  const blockEnd = Math.min(computedTotalPages, blockStart + blockSize - 1);
  const pages = Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i);

  const rootClass = [
    styles.root,
    variant === 'fraction' ? styles.fractionMode : styles.numberedMode,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={rootClass} aria-label="Pagination">
      <div className={styles.navGroup}>
        <button
          type="button"
          className={styles.navBtn}
          disabled={safePage <= 1}
          onClick={() => onChange(1)}
          aria-label="First page"
        >
          <NavChevron kind="first" />
        </button>
        <button
          type="button"
          className={styles.navBtn}
          disabled={safePage <= 1}
          onClick={() => onChange(safePage - 1)}
          aria-label="Previous page"
        >
          <NavChevron kind="prev" />
        </button>
      </div>

      {variant === 'fraction' ? (
        <span className={styles.fractionText}>
          {safePage} / {computedTotalPages}
        </span>
      ) : (
        <div className={styles.pageGroup}>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={[styles.pageBtn, p === safePage ? styles.pageBtnActive : '']
                .filter(Boolean)
                .join(' ')}
              aria-current={p === safePage ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className={styles.navGroup}>
        <button
          type="button"
          className={styles.navBtn}
          disabled={safePage >= computedTotalPages}
          onClick={() => onChange(safePage + 1)}
          aria-label="Next page"
        >
          <NavChevron kind="next" />
        </button>
        <button
          type="button"
          className={styles.navBtn}
          disabled={safePage >= computedTotalPages}
          onClick={() => onChange(computedTotalPages)}
          aria-label="Last page"
        >
          <NavChevron kind="last" />
        </button>
      </div>
    </nav>
  );
}
