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
   * comcd fields are converted to code values, and date fields to yyyyMMdd format.
   * Insert these rows into the grid and save to DB via Save Changes.
   */
  data?: Record<string, string>[] | null;
}

/**
 * Excel "dry-run → confirm → commit" processing result (summary).
 *
 * Receives only validation/count summary instead of full-row preview to prevent UI freeze on large uploads.
 * - success=false → display errors, not saved
 * - committed=false → dry-run (expected count). Re-request with commit=true after user confirmation
 * - committed=true → actual save complete (actual count)
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
