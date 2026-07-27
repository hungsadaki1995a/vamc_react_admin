import { useMemo } from 'react';
import { DownOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useLabelStore } from '@/stores/labelStore';
import { useLocaleStore } from '@/stores/localeStore';
import './GridExternalPaginationFooter.css';

interface GridExternalPaginationFooterProps {
  totalCount: number;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  maxVisiblePages?: number;
  pageSizeOptions?: number[];
  totalText?: string;
  pageSizeText?: string;
  className?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export default function GridExternalPaginationFooter({
  totalCount,
  pageSize = 20,
  currentPage = 1,
  totalPages: totalPagesProp,
  maxVisiblePages = 5,
  pageSizeOptions = [10, 20, 50, 100],
  totalText,
  pageSizeText,
  className,
  onPageChange,
  onPageSizeChange,
}: GridExternalPaginationFooterProps) {
  const t = useLabelStore((s) => s.t);
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const locale = useLocaleStore((s) => s.locale);
  const totalPages = Math.max(1, totalPagesProp ?? Math.ceil(totalCount / pageSize));
  const totalTemplate = useMemo(() => {
    const fallback = locale === 'en'
      ? 'Total {0} items'
      : locale === 'vi'
        ? 'Tổng {0} mục'
        : '전체 {0}건';
    return t('COMPONENT.VIEW.TEXT_gridTotal', fallback);
    // labelsVersion: t는 안정 참조라 로케일 변경 시 이 값으로만 재계산을 유발(의도적 의존성).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, t, labelsVersion]);
  const pageSizeTemplate = useMemo(
    () => t('COMPONENT.VIEW.TEXT_gridPageSize', '{0}개씩 보기'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, labelsVersion],
  );
  const normalizedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const formatTotalLabel = (count: number) => totalTemplate.replace('{0}', String(count));
  const formatPageSizeLabel = (size: number) => pageSizeTemplate.replace('{0}', String(size));
  const visiblePages = (() => {
    if (totalPages <= maxVisiblePages + 1) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (normalizedCurrentPage <= maxVisiblePages) {
      return Array.from({ length: maxVisiblePages }, (_, index) => index + 1);
    }

    const tailCount = Math.max(1, maxVisiblePages - 2);
    const start = Math.max(2, Math.min(normalizedCurrentPage - Math.floor(tailCount / 2), totalPages - tailCount));
    return Array.from({ length: tailCount }, (_, index) => start + index);
  })();
  const canGoPrev = normalizedCurrentPage > 1;
  const canGoNext = normalizedCurrentPage < totalPages;
  const firstVisiblePage = visiblePages[0] ?? 1;
  const lastVisiblePage = visiblePages[visiblePages.length - 1] ?? 1;
  const shouldShowLast = lastVisiblePage < totalPages;
  const shouldShowLeading = firstVisiblePage > 1;
  const pageSizeMenu: MenuProps = {
    selectedKeys: [String(pageSize)],
    items: pageSizeOptions.map((size) => ({
      key: String(size),
      label: formatPageSizeLabel(size),
    })),
    onClick: ({ key }) => onPageSizeChange?.(Number(key)),
  };

  const handlePageChange = (page: number) => {
    if (page === normalizedCurrentPage) return;
    onPageChange?.(page);
  };

  return (
    <div className={['ds-grid-external-pagination-footer', className].filter(Boolean).join(' ')}>
      <span className="ds-grid-external-pagination-footer__total">
        {totalText ?? formatTotalLabel(totalCount)}
      </span>
      <div
        className="ds-grid-external-pagination-footer__pager"
        aria-label={t('COMPONENT.VIEW.TEXT_gridPagination', '페이지 탐색')}
      >
        <button
          type="button"
          className="ds-grid-external-pagination-footer__page-button"
          disabled={!canGoPrev || !onPageChange}
          onClick={() => handlePageChange(normalizedCurrentPage - 1)}
        >
          <LeftOutlined />
        </button>
        {shouldShowLeading && (
          <>
            <button
              type="button"
              className="ds-grid-external-pagination-footer__page-number"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            <span className="ds-grid-external-pagination-footer__ellipsis">...</span>
          </>
        )}
        {visiblePages.map((pageNo) => (
          <button
            key={pageNo}
            type="button"
            className={`ds-grid-external-pagination-footer__page-number${
              pageNo === normalizedCurrentPage ? ' is-active' : ''
            }`}
            onClick={() => handlePageChange(pageNo)}
          >
            {pageNo}
          </button>
        ))}
        {shouldShowLast && (
          <>
            <span className="ds-grid-external-pagination-footer__ellipsis">...</span>
            <button
              type="button"
              className="ds-grid-external-pagination-footer__page-number"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          className="ds-grid-external-pagination-footer__page-button"
          disabled={!canGoNext || !onPageChange}
          onClick={() => handlePageChange(normalizedCurrentPage + 1)}
        >
          <RightOutlined />
        </button>
      </div>
      <Dropdown menu={pageSizeMenu} trigger={['click']} disabled={!onPageSizeChange}>
        <button type="button" className="ds-grid-external-pagination-footer__page-size">
          {pageSizeText ?? formatPageSizeLabel(pageSize)} <DownOutlined />
        </button>
      </Dropdown>
    </div>
  );
}
