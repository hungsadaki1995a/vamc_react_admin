/**
 * AG Grid Vietnamese locale
 *
 * Keys are kept 1:1 with `agGridLocaleKo.ts` — whenever a key is added on one side, add it here too.
 * (English uses AG Grid's built-in defaults, so there is no separate file. See `agGridLocale.ts`)
 */
export const AG_GRID_LOCALE_VI: Record<string, string> = {
  // Filter
  searchOoo: 'Tìm kiếm...',
  selectAll: '(Chọn tất cả)',
  selectAllSearchResults: '(Chọn tất cả kết quả tìm kiếm)',
  addCurrentSelectionToFilter: 'Thêm lựa chọn hiện tại vào bộ lọc',
  blanks: '(Trống)',
  noMatches: 'Không có kết quả phù hợp',
  filterOoo: 'Bộ lọc...',
  equals: 'Bằng',
  notEqual: 'Không bằng',
  contains: 'Chứa',
  notContains: 'Không chứa',
  startsWith: 'Bắt đầu bằng',
  endsWith: 'Kết thúc bằng',
  blank: 'Trống',
  notBlank: 'Không trống',
  before: 'Trước',
  after: 'Sau',
  greaterThan: 'Lớn hơn',
  lessThan: 'Nhỏ hơn',
  greaterThanOrEqual: 'Lớn hơn hoặc bằng',
  lessThanOrEqual: 'Nhỏ hơn hoặc bằng',
  inRange: 'Trong khoảng',
  inRangeStart: 'Từ',
  inRangeEnd: 'Đến',
  andCondition: 'VÀ',
  orCondition: 'HOẶC',
  applyFilter: 'Áp dụng',
  resetFilter: 'Đặt lại',
  clearFilter: 'Xóa',
  cancelFilter: 'Hủy',

  // Column menu
  pinColumn: 'Ghim cột',
  pinLeft: 'Ghim trái',
  pinRight: 'Ghim phải',
  noPin: 'Bỏ ghim',
  autosizeThisColumn: 'Tự động chỉnh cỡ cột này',
  autosizeAllColumns: 'Tự động chỉnh cỡ tất cả cột',
  resetColumns: 'Đặt lại cột',
  sortAscending: 'Sắp xếp tăng dần',
  sortDescending: 'Sắp xếp giảm dần',
  sortUnSort: 'Bỏ sắp xếp',

  // Pagination
  page: 'Trang',
  more: 'Thêm',
  to: '~',
  of: '/',
  next: 'Tiếp',
  last: 'Cuối',
  first: 'Đầu',
  previous: 'Trước',
  pageSizeSelectorLabel: 'Số dòng mỗi trang:',

  // Row selection
  ariaChecked: 'đã chọn',
  ariaIndeterminate: 'chọn một phần',
  ariaUnchecked: 'chưa chọn',

  // Miscellaneous
  loadingOoo: 'Đang tải...',
  loadingError: 'Lỗi',
  noRowsToShow: 'Không có dữ liệu.',
  enabled: 'Bật',

  // Copy
  copy: 'Sao chép',
  copyWithHeaders: 'Sao chép kèm tiêu đề',
  copyWithGroupHeaders: 'Sao chép kèm tiêu đề nhóm',
  paste: 'Dán',

  // CSV
  csvExport: 'Xuất CSV',
  export: 'Xuất',

  // Column filter conditions
  columns: 'Cột',
  filters: 'Bộ lọc',
  rowGroupColumns: 'Cột nhóm dòng',
  rowGroupColumnsEmptyMessage: 'Kéo vào đây để nhóm dòng',
  valueColumns: 'Cột giá trị',
  pivotMode: 'Chế độ pivot',
  groups: 'Nhóm',
  values: 'Giá trị',
  pivots: 'Pivot',
  valueColumnsEmptyMessage: 'Kéo vào đây để tổng hợp',
  pivotColumnsEmptyMessage: 'Kéo vào đây để thiết lập pivot',

  // Tool panel
  toolPanelButton: 'Bảng công cụ',

  // Other ARIA
  ariaFilterColumnsInput: 'Lọc cột',
  ariaRowSelect: 'Nhấn Space để chọn dòng này',
  ariaRowDeselect: 'Nhấn Space để bỏ chọn dòng này',
  ariaRowToggleSelection: 'Nhấn Space để đảo chọn dòng',
  ariaRowSelectAll: 'Nhấn Space để đảo chọn tất cả dòng',
  ariaSearch: 'Tìm kiếm',
  ariaSearchFilterValues: 'Tìm giá trị lọc',
};
