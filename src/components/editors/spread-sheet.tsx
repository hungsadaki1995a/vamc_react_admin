import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Univer, LocaleType, mergeLocales, LogLevel } from '@univerjs/core';
import { FUniver } from '@univerjs/core/lib/facade';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
// @ts-expect-error — package ships js but lacks .d.ts at this path
import sheetsCoreKoKR from '@univerjs/preset-sheets-core/lib/locales/ko-KR';
// SheetJS — pinned in package.json to a **CDN tarball URL**.
//   https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
//
// npm registry (registry.npmjs.org) stopped publishing xlsx at 0.18.5 (2022-03-24),
// which still has Prototype Pollution (fixed in 0.19.3) and ReDoS (fixed in 0.20.2).
// Versions fixing both are distributed only via SheetJS's own CDN, so we install by URL.
// pnpm records the integrity hash in the lockfile, preserving reproducibility.
//
// ⚠️ To upgrade versions, change the CDN URL rather than the registry.
//    `pnpm update` does not bump URL dependencies.
// ⚠️ If migrating to an air-gapped network, this URL will be blocked. Upload the tarball
//    to an internal registry (e.g. Nexus raw) and point to that URL instead.
//
// Policy — this component parses **only user-selected files** in the browser.
// Never feed server-received files or external input here. For server-side parsing,
// handle it on the backend (Apache POI) and do not use this library.
import * as XLSX from 'xlsx';

import '@univerjs/preset-sheets-core/lib/index.css';

// ── Types ──

export interface SpreadSheetRef {
  /** Return current workbook data as a JSON snapshot */
  getSnapshot: () => object | null;
  /** Load JSON snapshot data (replaces existing workbook) */
  loadSnapshot: (data: object) => void;
  /** Parse XLSX file and load into Univer */
  importXLSX: (file: File) => Promise<void>;
  /** Download current data as an XLSX file */
  exportXLSX: (filename?: string) => Promise<void>;
  /** Download current data as a JSON file */
  exportJSON: (filename?: string) => void;
}

interface SpreadSheetProps {
  data?: object;
  onChange?: (data: object) => void;
  readOnly?: boolean;
  height?: string | number;
  showSheetTabs?: boolean;
  showToolbar?: boolean;
  className?: string;
}

// ── SheetJS ↔ Univer conversion utilities ──

type CellValue = string | number | boolean;

/** Normalize sheet name — Excel does not allow >31 chars or duplicate sheet names */
function safeSheetName(raw: string, used: Set<string>): string {
  let name = (raw || 'Sheet').slice(0, 31);
  if (used.has(name)) {
    let n = 2;
    const base = name.slice(0, 28);
    while (used.has(`${base}_${n}`)) n += 1;
    name = `${base}_${n}`;
  }
  used.add(name);
  return name;
}

/** Convert XLSX buffer → Univer IWorkbookData */
function excelToUniverData(buffer: ArrayBuffer): object {
  // cellDates: receive date cells as Date objects instead of serial numbers
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheetOrder: string[] = [];
  const sheets: Record<string, object> = {};

  wb.SheetNames.forEach((sheetName, idx) => {
    const sheetId = `sheet_${idx + 1}`;
    sheetOrder.push(sheetId);

    const ws = wb.Sheets[sheetName];
    const cellData: Record<number, Record<number, { v: CellValue }>> = {};
    let maxRow = 0;
    let maxCol = 0;

    // SheetJS stores cells by 'A1' address keys. !ref defines the used range.
    const ref = ws?.['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      for (let r = range.s.r; r <= range.e.r; r += 1) {
        for (let c = range.s.c; c <= range.e.c; c += 1) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
          if (!cell || cell.v == null) continue;

          let v: CellValue;
          if (cell.v instanceof Date) {
            v = cell.v.toISOString().split('T')[0];
          } else if (cell.t === 'n' || cell.t === 'b') {
            v = cell.v as CellValue;
          } else {
            // Formula cells store the evaluated result in w (formatted text)
            v = cell.w ?? String(cell.v);
          }

          if (!cellData[r]) cellData[r] = {};
          cellData[r][c] = { v };
          if (r > maxRow) maxRow = r;
          if (c > maxCol) maxCol = c;
        }
      }
    }

    // Column width: SheetJS provides wpx (px) or wch (character count)
    const cols = (ws?.['!cols'] ?? []) as XLSX.ColInfo[];
    const colData: Record<number, { w: number; hd: number }> = {};
    for (let c = 0; c <= maxCol; c += 1) {
      const info = cols[c];
      const w = info?.wpx ?? (info?.wch ? Math.round(info.wch * 8) : 120);
      colData[c] = { w, hd: 0 };
    }

    sheets[sheetId] = {
      id: sheetId,
      name: sheetName,
      tabColor: '',
      hidden: 0,
      rowCount: Math.max(maxRow + 10, 30),
      columnCount: Math.max(maxCol + 5, 10),
      zoomRatio: 1,
      defaultColumnWidth: 120,
      defaultRowHeight: 23,
      cellData,
      columnData: colData,
      showGridlines: 1,
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
    };
  });

  return { sheetOrder, sheets, locale: 'koKR', styles: {} };
}

/** Convert Univer snapshot → XLSX buffer */
function univerDataToExcel(snapshot: Record<string, unknown>): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const sheetsMap = (snapshot.sheets ?? {}) as Record<string, Record<string, unknown>>;
  const sheetOrder = (snapshot.sheetOrder ?? Object.keys(sheetsMap)) as string[];
  const usedNames = new Set<string>();

  for (const sheetId of sheetOrder) {
    const sheetData = sheetsMap[sheetId];
    if (!sheetData) continue;

    const ws: XLSX.WorkSheet = {};
    const cellData = (sheetData.cellData ?? {}) as Record<string, Record<string, { v?: CellValue }>>;
    let maxRow = 0;
    let maxCol = 0;

    for (const rowStr of Object.keys(cellData)) {
      const r = parseInt(rowStr, 10);
      const rowData = cellData[rowStr];
      for (const colStr of Object.keys(rowData)) {
        const c = parseInt(colStr, 10);
        const v = rowData[colStr]?.v;
        if (v == null) continue;

        const addr = XLSX.utils.encode_cell({ r, c });
        ws[addr] =
          typeof v === 'number' ? { t: 'n', v }
          : typeof v === 'boolean' ? { t: 'b', v }
          : { t: 's', v: String(v) };

        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      }
    }

    // Without !ref, SheetJS treats the sheet as empty and skips writing it
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName((sheetData.name as string) || sheetId, usedNames));
  }

  if (wb.SheetNames.length === 0) {
    const empty: XLSX.WorkSheet = { '!ref': 'A1' };
    XLSX.utils.book_append_sheet(wb, empty, 'Sheet1');
  }

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/** File download helper */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ──

const SpreadSheet = forwardRef<SpreadSheetRef, SpreadSheetProps>(function SpreadSheet(
  { data, readOnly = false, height = 500, showToolbar = false, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerAPIRef = useRef<FUniver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const initUniver = () => {
      if (disposed || univerAPIRef.current) return;

      // Use @univerjs/core directly (no Pro dependency)
      const univer = new Univer({
        logLevel: LogLevel.WARN,
        locale: LocaleType.KO_KR,
        locales: {
          [LocaleType.KO_KR]: mergeLocales(sheetsCoreKoKR),
        },
      });

      // Register preset-sheets-core plugin
      const { plugins } = UniverSheetsCorePreset({ container });
      plugins.forEach((plugin) => {
        const [Plugin, options] = Array.isArray(plugin) ? plugin : [plugin, undefined];
        univer.registerPlugin(Plugin, options);
      });

      const univerAPI = FUniver.newAPI(univer);
      univerAPIRef.current = univerAPI;
      univerAPI.createWorkbook(data ?? {});
    };

    // Wait until container has a non-zero width (tab may be hidden via display:none on mount)
    if (container.offsetWidth > 0) {
      initUniver();
    } else {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            ro.disconnect();
            initUniver();
            break;
          }
        }
      });
      ro.observe(container);
      return () => {
        disposed = true;
        ro.disconnect();
        univerAPIRef.current?.dispose();
        univerAPIRef.current = null;
      };
    }

    return () => {
      disposed = true;
      univerAPIRef.current?.dispose();
      univerAPIRef.current = null;
    };
  }, []);

  // ── Imperative API ──

  const getSnapshot = useCallback((): object | null => {
    const api = univerAPIRef.current;
    if (!api) return null;
    const wb = api.getActiveWorkbook();
    if (!wb) return null;
    return wb.save();
  }, []);

  const loadSnapshot = useCallback((newData: object) => {
    const api = univerAPIRef.current;
    if (!api) return;
    const existing = api.getActiveWorkbook();
    if (existing) {
      const unitId = existing.getId();
      api.disposeUnit(unitId);
    }
    api.createWorkbook(newData);
  }, []);

  const importXLSX = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const univerData = excelToUniverData(buffer);
    loadSnapshot(univerData);
  }, [loadSnapshot]);

  const exportXLSX = useCallback(async (filename = 'spreadsheet.xlsx') => {
    const snapshot = getSnapshot();
    if (!snapshot) return;
    const buffer = univerDataToExcel(snapshot as Record<string, unknown>);
    downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  }, [getSnapshot]);

  const exportJSON = useCallback((filename = 'spreadsheet.json') => {
    const snapshot = getSnapshot();
    if (!snapshot) return;
    const json = JSON.stringify(snapshot, null, 2);
    downloadBlob(new Blob([json], { type: 'application/json' }), filename);
  }, [getSnapshot]);

  useImperativeHandle(ref, () => ({
    getSnapshot,
    loadSnapshot,
    importXLSX,
    exportXLSX,
    exportJSON,
  }), [getSnapshot, loadSnapshot, importXLSX, exportXLSX, exportJSON]);

  // ── Toolbar handlers ──

  const handleImportXLSX = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await importXLSX(file);
    };
    input.click();
  }, [importXLSX]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        loadSnapshot(json);
      } catch {
        console.error('Invalid JSON file');
      }
    };
    input.click();
  }, [loadSnapshot]);

  // ── Render ──

  const wrapperStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <div
      className={[
        'ds-spreadsheet',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      {showToolbar && !readOnly && (
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '6px 8px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--content-header-bg, #fafafa)',
          borderRadius: '6px 6px 0 0',
          fontSize: 13,
        }}>
          <button
            type="button"
            onClick={handleImportXLSX}
            style={toolbarBtnStyle}
            title="Excel 파일 가져오기"
          >
            XLSX 가져오기
          </button>
          <button
            type="button"
            onClick={handleImportJSON}
            style={toolbarBtnStyle}
            title="JSON 파일 가져오기"
          >
            JSON 가져오기
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => exportXLSX()}
            style={toolbarBtnStyle}
            title="Excel 파일로 내보내기"
          >
            XLSX 내보내기
          </button>
          <button
            type="button"
            onClick={() => exportJSON()}
            style={toolbarBtnStyle}
            title="JSON 파일로 내보내기"
          >
            JSON 내보내기
          </button>
        </div>
      )}
      <div style={showToolbar ? { ...wrapperStyle, borderRadius: readOnly ? 6 : '0 0 6px 6px' } : wrapperStyle}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
});

const toolbarBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  color: 'inherit',
};

export default SpreadSheet;
