/**
 * Excel column definition — declared per screen, shared between download/upload/template.
 */
export interface ExcelColumnDef {
  /** Data field key (camelCase — must match Map key returned from server mapper) */
  key: string;
  /** Excel header display text */
  header: string;
  /** Column width in characters (default: 15) */
  width?: number;
  /** Required on upload — empty value triggers validation error */
  required?: boolean;
  /**
   * Cell format hint:
   * - "text"     — plain string (default)
   * - "number"   — numeric formatting (#,##0)
   * - "percent"  — percentage formatting (0.0%) — value 80 → "80.0%"
   * - "date"     — yyyy-mm-dd Excel date cell (sortable)
   * - "datetime" — yyyy-MM-dd HH:mm:ss
   */
  format?: 'text' | 'number' | 'percent' | 'date' | 'datetime';
  /**
   * If true, column is skipped during upload parsing.
   * Use for system-generated read-only columns (e.g., IDs, timestamps).
   * Column still appears in download and template.
   */
  readOnly?: boolean;
  /**
   * Dropdown options for template generation — server injects an Excel
   * data validation (explicit list) on this column so users pick from the list.
   *
   * Excel inline-list cap is 255 chars total; very large code domains are
   * silently skipped on the server. Server-side upload validation remains.
   */
  dropdownOptions?: string[];
  /**
   * Default value written to cell when data is null/empty on download.
   * Used for virtual columns not stored in DB (e.g., `_op: 'ORG'`).
   */
  defaultValue?: string;
}

/** Per-row validation error returned from upload API */
export interface ExcelRowError {
  /** 1-based row number in the excel file (header is row 1, data starts at row 2) */
  row: number;
  /** Field key of the failing column */
  col: string;
  /** Header display name */
  header: string;
  /** Raw cell value that caused the error */
  value: string;
  /** Human-readable error description */
  message: string;
}

/** Upload API response shape */
export interface ExcelUploadResult {
  success: boolean;
  /** Total data rows processed (excluding header) */
  totalRows: number;
  /** Number of distinct rows with errors */
  failRows: number;
  /** Capped at 100 entries — null when success === true */
  errors: ExcelRowError[] | null;
  /**
   * Parsed row data — populated when success === true.
   * comcd 필드는 코드값, 날짜 필드는 yyyyMMdd 포맷으로 변환된 상태.
   * 이 값을 그리드에 INSERT 행으로 추가한 뒤 변경저장으로 DB에 저장.
   */
  data?: Record<string, string>[] | null;
}

/**
 * 엑셀 "드라이런 → 확인 → 커밋" 처리 결과 (요약).
 *
 * 미리보기(전 행 반환) 대신 검증/건수 요약만 받아 대용량 업로드 시 화면 멈춤을 방지한다.
 * - success=false → errors 표시, 미저장
 * - committed=false → 드라이런(예상 건수). 사용자 확인 후 commit=true 재요청
 * - committed=true → 실제 저장 완료(실제 건수)
 */
export interface ExcelProcessResult {
  success: boolean;
  committed: boolean;
  totalRows: number;
  cntNew: number;
  cntMod: number;
  cntDel: number;
  failRows: number;
  errors: ExcelRowError[] | null;
}
