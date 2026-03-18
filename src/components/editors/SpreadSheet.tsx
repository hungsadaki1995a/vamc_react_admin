import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Univer, LocaleType, mergeLocales, LogLevel } from '@univerjs/core';
import { FUniver } from '@univerjs/core/lib/facade';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
// @ts-expect-error — package ships js but lacks .d.ts at this path
import sheetsCoreKoKR from '@univerjs/preset-sheets-core/lib/locales/ko-KR';
import ExcelJS from 'exceljs';
import { useThemeStore } from '@/stores/themeStore';

import '@univerjs/preset-sheets-core/lib/index.css';

// ── Types ──

export interface SpreadSheetRef {
  /** 현재 워크북 데이터를 JSON snapshot으로 반환 */
  getSnapshot: () => object | null;
  /** JSON snapshot 데이터를 로드 (기존 워크북 교체) */
  loadSnapshot: (data: object) => void;
  /** XLSX 파일을 파싱하여 Univer에 로드 */
  importXLSX: (file: File) => Promise<void>;
  /** 현재 데이터를 XLSX 파일로 다운로드 */
  exportXLSX: (filename?: string) => Promise<void>;
  /** 현재 데이터를 JSON 파일로 다운로드 */
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

// ── ExcelJS ↔ Univer 변환 유틸리티 ──

type CellValue = string | number | boolean;

/** ExcelJS 워크북 → Univer IWorkbookData 변환 */
async function excelToUniverData(buffer: ArrayBuffer): Promise<object> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const sheetOrder: string[] = [];
  const sheets: Record<string, object> = {};

  wb.eachSheet((worksheet, idx) => {
    const sheetId = `sheet_${idx}`;
    sheetOrder.push(sheetId);

    const cellData: Record<number, Record<number, { v: CellValue }>> = {};
    let maxRow = 0;
    let maxCol = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const r = rowNumber - 1; // ExcelJS is 1-based, Univer is 0-based
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const c = colNumber - 1;
        if (!cellData[r]) cellData[r] = {};

        let v: CellValue = '';
        if (cell.value instanceof Date) {
          v = cell.value.toISOString().split('T')[0];
        } else if (typeof cell.value === 'object' && cell.value !== null) {
          // Handle rich text, formula results, etc.
          v = cell.text || String(cell.value);
        } else if (cell.value != null) {
          v = cell.value as CellValue;
        }

        cellData[r][c] = { v };
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      });
    });

    const colData: Record<number, { w: number; hd: number }> = {};
    for (let c = 0; c <= maxCol; c++) {
      const col = worksheet.getColumn(c + 1);
      colData[c] = { w: col.width ? Math.round(col.width * 8) : 120, hd: 0 };
    }

    sheets[sheetId] = {
      id: sheetId,
      name: worksheet.name,
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

/** Univer snapshot → ExcelJS 워크북 변환 후 XLSX 버퍼 반환 */
async function univerDataToExcel(snapshot: Record<string, unknown>): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const sheetsMap = (snapshot.sheets ?? {}) as Record<string, Record<string, unknown>>;
  const sheetOrder = (snapshot.sheetOrder ?? Object.keys(sheetsMap)) as string[];

  for (const sheetId of sheetOrder) {
    const sheetData = sheetsMap[sheetId];
    if (!sheetData) continue;

    const name = (sheetData.name as string) || sheetId;
    const ws = wb.addWorksheet(name);
    const cellData = (sheetData.cellData ?? {}) as Record<string, Record<string, { v?: CellValue }>>;

    for (const rowStr of Object.keys(cellData)) {
      const r = parseInt(rowStr, 10);
      const rowData = cellData[rowStr];
      for (const colStr of Object.keys(rowData)) {
        const c = parseInt(colStr, 10);
        const cell = rowData[colStr];
        if (cell?.v == null) continue;
        ws.getCell(r + 1, c + 1).value = cell.v; // ExcelJS is 1-based
      }
    }
  }

  if (wb.worksheets.length === 0) {
    wb.addWorksheet('Sheet1');
  }

  return await wb.xlsx.writeBuffer() as ArrayBuffer;
}

/** 파일 다운로드 헬퍼 */
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
  const themeMode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const initUniver = () => {
      if (disposed || univerAPIRef.current) return;

      // @univerjs/core를 직접 사용 (Pro 의존성 없음)
      const univer = new Univer({
        logLevel: LogLevel.WARN,
        locale: LocaleType.KO_KR,
        locales: {
          [LocaleType.KO_KR]: mergeLocales(sheetsCoreKoKR),
        },
      });

      // preset-sheets-core 플러그인 등록
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
    const univerData = await excelToUniverData(buffer);
    loadSnapshot(univerData);
  }, [loadSnapshot]);

  const exportXLSX = useCallback(async (filename = 'spreadsheet.xlsx') => {
    const snapshot = getSnapshot();
    if (!snapshot) return;
    const buffer = await univerDataToExcel(snapshot as Record<string, unknown>);
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
        themeMode === 'dark' ? 'ds-spreadsheet-dark' : '',
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
