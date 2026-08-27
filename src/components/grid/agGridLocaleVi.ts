/**
 * AG Grid 베트남어 로케일
 *
 * 키 구성은 `agGridLocaleKo.ts` 와 1:1로 맞춘다 — 한쪽에 키를 추가하면 이쪽에도 추가한다.
 * (영어는 AG Grid 내장 기본값을 쓰므로 별도 파일이 없다. `agGridLocale.ts` 참조)
 */
export const AG_GRID_LOCALE_VI: Record<string, string> = {
  // 필터
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

  // 컬럼 메뉴
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

  // 페이지네이션
  page: 'Trang',
  more: 'Thêm',
  to: '~',
  of: '/',
  next: 'Tiếp',
  last: 'Cuối',
  first: 'Đầu',
  previous: 'Trước',
  pageSizeSelectorLabel: 'Số dòng mỗi trang:',

  // 행 선택
  ariaChecked: 'đã chọn',
  ariaIndeterminate: 'chọn một phần',
  ariaUnchecked: 'chưa chọn',

  // 기타
  loadingOoo: 'Đang tải...',
  loadingError: 'Lỗi',
  noRowsToShow: 'Không có dữ liệu.',
  enabled: 'Bật',

  // 복사
  copy: 'Sao chép',
  copyWithHeaders: 'Sao chép kèm tiêu đề',
  copyWithGroupHeaders: 'Sao chép kèm tiêu đề nhóm',
  paste: 'Dán',

  // CSV
  csvExport: 'Xuất CSV',
  export: 'Xuất',

  // 컬럼 필터 조건
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

  // 도구 패널
  toolPanelButton: 'Bảng công cụ',

  // 기타 ARIA
  ariaFilterColumnsInput: 'Lọc cột',
  ariaRowSelect: 'Nhấn Space để chọn dòng này',
  ariaRowDeselect: 'Nhấn Space để bỏ chọn dòng này',
  ariaRowToggleSelection: 'Nhấn Space để đảo chọn dòng',
  ariaRowSelectAll: 'Nhấn Space để đảo chọn tất cả dòng',
  ariaSearch: 'Tìm kiếm',
  ariaSearchFilterValues: 'Tìm giá trị lọc',
};
