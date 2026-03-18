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
   * - "number"   — numeric formatting
   * - "date"     — yyyy-MM-dd
   * - "datetime" — yyyy-MM-dd HH:mm:ss
   */
  format?: 'text' | 'number' | 'date' | 'datetime';
  /**
   * If true, column is skipped during upload parsing.
   * Use for system-generated read-only columns (e.g., IDs, timestamps).
   * Column still appears in download and template.
   */
  readOnly?: boolean;
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
}
