/**
 * PatternI18nLabel — 다국어 라벨 관리 화면 패턴 샘플
 *
 * CCO102003SC 화면 구조를 mock data 기반으로 재현.
 * - FilterPanel + splitBody(좌 60% 라벨목록 / 우 40% 번역그리드) + FormPanel
 * - API 없음, 로컬 상태만 사용
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent, CellEditingStartedEvent } from 'ag-grid-community';
import { Button, Form, Row, Col, Space, Input, Select, message, Modal } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import styles from './index.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface LblItem {
  lblId: string;
  lblTpCd: string;
  mrCont: string;
}

interface LblTrnItem {
  lblId: string;
  lclCd: string;
  lblTxt: string;
  projTxt?: string;
  _isNew?: boolean;
  _isDirty?: boolean;
  _isProjDirty?: boolean;
  _rowId?: string;
}

interface FormFields {
  screenId: string;
  section: string;
  type: string;
  detail: string;
  lblId: string;
  mrCont: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LABELS: LblItem[] = [
  { lblId: 'CCO102003SC.GRID.TEXT_lblId',        lblTpCd: 'TEXT', mrCont: '라벨 키' },
  { lblId: 'CCO102003SC.GRID.TEXT_screenId',     lblTpCd: 'TEXT', mrCont: '화면ID' },
  { lblId: 'CCO102003SC.GRID.TEXT_mrCont',       lblTpCd: 'TEXT', mrCont: '기본 텍스트' },
  { lblId: 'CCO102003SC.GRID.TEXT_lclCd',        lblTpCd: 'TEXT', mrCont: '언어' },
  { lblId: 'CCO102003SC.BUTTON.TEXT_save',       lblTpCd: 'TEXT', mrCont: '저장' },
  { lblId: 'CCO102003SC.BUTTON.TEXT_delete',     lblTpCd: 'TEXT', mrCont: '삭제' },
  { lblId: 'CCO102003SC.BUTTON.TEXT_add',        lblTpCd: 'TEXT', mrCont: '추가' },
  { lblId: 'CCO102003SC.BUTTON.TEXT_reset',      lblTpCd: 'TEXT', mrCont: '초기화' },
  { lblId: 'CCO102003SC.FILTER.TEXT_lblId',      lblTpCd: 'TEXT', mrCont: '라벨 키 검색' },
  { lblId: 'CCO102003SC.FILTER.TEXT_mrCont',     lblTpCd: 'TEXT', mrCont: '기본 텍스트 검색' },
  { lblId: 'CCO101001SC.GRID.TEXT_usrNm',        lblTpCd: 'TEXT', mrCont: '사용자명' },
  { lblId: 'CCO101001SC.GRID.TEXT_deptNm',       lblTpCd: 'TEXT', mrCont: '부서명' },
  { lblId: 'CCO101001SC.FILTER.TEXT_usrId',      lblTpCd: 'TEXT', mrCont: '사용자ID' },
  { lblId: 'MESSAGE.INFO.TEXT_I100002',          lblTpCd: 'TEXT', mrCont: '등록되었습니다.' },
  { lblId: 'MESSAGE.INFO.TEXT_I100003',          lblTpCd: 'TEXT', mrCont: '수정되었습니다.' },
  { lblId: 'MESSAGE.INFO.TEXT_I100004',          lblTpCd: 'TEXT', mrCont: '삭제되었습니다.' },
  { lblId: 'MESSAGE.CONFIRM.TEXT_C100001',       lblTpCd: 'TEXT', mrCont: '저장하시겠습니까?' },
  { lblId: 'MESSAGE.CONFIRM.TEXT_C100002',       lblTpCd: 'TEXT', mrCont: '삭제하시겠습니까?' },
  { lblId: 'MESSAGE.ERROR.TEXT_E100001',         lblTpCd: 'TEXT', mrCont: '필수 항목을 입력해 주세요.' },
];

const MOCK_TRANSLATIONS: Record<string, LblTrnItem[]> = {
  'CCO102003SC.GRID.TEXT_lblId': [
    { lblId: 'CCO102003SC.GRID.TEXT_lblId', lclCd: 'ko', lblTxt: '라벨 키',   _rowId: 'ko' },
    { lblId: 'CCO102003SC.GRID.TEXT_lblId', lclCd: 'en', lblTxt: 'Label Key', _rowId: 'en' },
    { lblId: 'CCO102003SC.GRID.TEXT_lblId', lclCd: 'vn', lblTxt: 'Mã nhãn',   _rowId: 'vn' },
  ],
  'CCO102003SC.GRID.TEXT_mrCont': [
    { lblId: 'CCO102003SC.GRID.TEXT_mrCont', lclCd: 'ko', lblTxt: '기본 텍스트',    _rowId: 'ko' },
    { lblId: 'CCO102003SC.GRID.TEXT_mrCont', lclCd: 'en', lblTxt: 'Default Text',  _rowId: 'en' },
    { lblId: 'CCO102003SC.GRID.TEXT_mrCont', lclCd: 'vn', lblTxt: 'Văn bản mặc định', _rowId: 'vn' },
  ],
  'CCO102003SC.BUTTON.TEXT_save': [
    { lblId: 'CCO102003SC.BUTTON.TEXT_save', lclCd: 'ko', lblTxt: '저장', _rowId: 'ko' },
    { lblId: 'CCO102003SC.BUTTON.TEXT_save', lclCd: 'en', lblTxt: 'Save', _rowId: 'en' },
    { lblId: 'CCO102003SC.BUTTON.TEXT_save', lclCd: 'vn', lblTxt: 'Lưu',  _rowId: 'vn' },
  ],
  'CCO102003SC.BUTTON.TEXT_delete': [
    { lblId: 'CCO102003SC.BUTTON.TEXT_delete', lclCd: 'ko', lblTxt: '삭제',   _rowId: 'ko' },
    { lblId: 'CCO102003SC.BUTTON.TEXT_delete', lclCd: 'en', lblTxt: 'Delete', _rowId: 'en' },
    { lblId: 'CCO102003SC.BUTTON.TEXT_delete', lclCd: 'vn', lblTxt: 'Xóa',    _rowId: 'vn' },
  ],
  'MESSAGE.INFO.TEXT_I100002': [
    { lblId: 'MESSAGE.INFO.TEXT_I100002', lclCd: 'ko', lblTxt: '등록되었습니다.',     _rowId: 'ko' },
    { lblId: 'MESSAGE.INFO.TEXT_I100002', lclCd: 'en', lblTxt: 'Registered.',        _rowId: 'en' },
    { lblId: 'MESSAGE.INFO.TEXT_I100002', lclCd: 'vn', lblTxt: 'Đã đăng ký.',        _rowId: 'vn' },
  ],
  'MESSAGE.CONFIRM.TEXT_C100001': [
    { lblId: 'MESSAGE.CONFIRM.TEXT_C100001', lclCd: 'ko', lblTxt: '저장하시겠습니까?',     _rowId: 'ko' },
    { lblId: 'MESSAGE.CONFIRM.TEXT_C100001', lclCd: 'en', lblTxt: 'Do you want to save?', _rowId: 'en' },
    { lblId: 'MESSAGE.CONFIRM.TEXT_C100001', lclCd: 'vn', lblTxt: 'Bạn có muốn lưu?',    _rowId: 'vn' },
  ],
};

// PJ001/PJ002에서 projTxt 오버라이드 샘플
const MOCK_PROJ_TRN: Record<string, Record<string, Partial<Record<string, string>>>> = {
  PJ001: {
    'CCO102003SC.BUTTON.TEXT_save':   { ko: '저장하기', en: 'Save it' },
    'CCO102003SC.BUTTON.TEXT_delete': { ko: '삭제하기' },
  },
  PJ002: {
    'MESSAGE.INFO.TEXT_I100002': { ko: '신규 등록 완료!', en: 'New entry created!' },
  },
};

const MOCK_PROJECTS = [
  { projId: 'PJ000', projNm: 'VAMC NPL 플랫폼' },
  { projId: 'PJ001', projNm: 'VAMC NPL 어드민' },
  { projId: 'PJ002', projNm: '채권 정산' },
];

const LANG_OPTIONS = [
  { value: 'ko', label: '한국어 (ko)' },
  { value: 'en', label: '영어 (en)' },
  { value: 'vn', label: '베트남어 (vn)' },
];

const LANG_LABELS: Record<string, string> = { ko: '한국어', en: '영어', vn: '베트남어' };

const SECTION_OPTIONS = [
  { value: 'GRID',   label: '그리드 (GRID)' },
  { value: 'FORM',   label: '폼 (FORM)' },
  { value: 'FILTER', label: '필터 (FILTER)' },
  { value: 'BUTTON', label: '버튼 (BUTTON)' },
  { value: 'MESSAGE', label: '메시지 (MESSAGE)' },
];

const TYPE_OPTIONS = [
  { value: 'TEXT', label: '텍스트 (TEXT)' },
  { value: 'BTN',  label: '버튼 (BTN)' },
  { value: 'MSG',  label: '메시지 (MSG)' },
  { value: 'TIT',  label: '제목 (TIT)' },
];

// ── Helper: parse lblId ──────────────────────────────────────────────────────

function parseLblId(lblId: string) {
  const i1 = lblId.indexOf('.');
  const i2 = i1 >= 0 ? lblId.indexOf('.', i1 + 1) : -1;
  if (i1 < 0) return { screenId: lblId, section: '', type: '', detail: '' };
  const screenId = lblId.substring(0, i1);
  if (i2 < 0) return { screenId, section: lblId.substring(i1 + 1), type: '', detail: '' };
  const section = lblId.substring(i1 + 1, i2);
  const td = lblId.substring(i2 + 1);
  const u = td.indexOf('_');
  return u < 0
    ? { screenId, section, type: td, detail: '' }
    : { screenId, section, type: td.substring(0, u), detail: td.substring(u + 1) };
}

function buildLblId(screenId: string, section: string, type: string, detail: string) {
  if (!screenId && !section && !type && !detail) return '';
  return `${screenId}.${section}.${type}_${detail}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PatternI18nLabel() {
  const [messageApi, contextHolder] = message.useMessage();

  // ── Filter
  const [filterLblId, setFilterLblId]   = useState('');
  const [filterMrCont, setFilterMrCont] = useState('');
  const [appliedLblId, setAppliedLblId] = useState('');
  const [appliedMrCont, setAppliedMrCont] = useState('');
  const [searched, setSearched]         = useState(false);

  // ── GRID1
  const grid1Ref = useRef<AgGridReact<LblItem>>(null);
  const [selectedLbl, setSelectedLbl] = useState<LblItem | null>(null);

  // ── GRID2
  const grid2Ref  = useRef<AgGridReact<LblTrnItem>>(null);
  const [trnRows, setTrnRows]     = useState<LblTrnItem[]>([]);

  // ── 프로젝트 선택
  const [selectedProj, setSelectedProj] = useState<string>('PJ000');
  // 콜백/cellStyle 에서 최신 값을 읽기 위한 미러. 즉시성이 필요한 지점(handleProjChange,
  // 초기화)에서는 직접 대입하고, 그 외 변경은 이 effect 가 동기화한다.
  const selectedProjRef = useRef(selectedProj);
  useEffect(() => {
    selectedProjRef.current = selectedProj;
  }, [selectedProj]);

  // ── 폼
  const [form] = Form.useForm<FormFields>();
  const [formCollapsed, setFormCollapsed] = useState(false);
  const isEditMode = selectedLbl !== null;

  // ── Filtered label list
  const filteredList = useMemo(() => {
    if (!searched) return [];
    let result = MOCK_LABELS;
    if (appliedLblId.trim()) {
      const kw = appliedLblId.trim().toLowerCase();
      result = result.filter((r) => r.lblId.toLowerCase().includes(kw));
    }
    if (appliedMrCont.trim()) {
      const kw = appliedMrCont.trim().toLowerCase();
      result = result.filter((r) => (r.mrCont ?? '').toLowerCase().includes(kw));
    }
    return result;
  }, [searched, appliedLblId, appliedMrCont]);

  // ── Confirm helper
  const confirm = useCallback((content: string, onOk: () => void, danger = false) => {
    Modal.confirm({
      content,
      okButtonProps: danger ? { danger: true } : undefined,
      onOk,
    });
  }, []);

  // ── 번역 목록 로드 (mock)
  const loadTrnList = useCallback((lblId: string, projId: string) => {
    const base: LblTrnItem[] = (MOCK_TRANSLATIONS[lblId] ?? []).map((r) => ({ ...r }));
    if (projId !== 'PJ000') {
      const projMap = MOCK_PROJ_TRN[projId]?.[lblId] ?? {};
      return base.map((r) => ({ ...r, projTxt: projMap[r.lclCd] ?? '' }));
    }
    return base;
  }, []);

  // ── 핸들러 — 검색
  const handleSearch = useCallback(() => {
    setSearched(true);
    setAppliedLblId(filterLblId);
    setAppliedMrCont(filterMrCont);
    setSelectedLbl(null);
    setTrnRows([]);
    form.resetFields();
    grid1Ref.current?.api?.deselectAll();
  }, [filterLblId, filterMrCont, form]);

  // ── 핸들러 — 필터 초기화
  const handleFilterReset = useCallback(() => {
    setFilterLblId('');
    setFilterMrCont('');
  }, []);

  // ── 핸들러 — 프로젝트 변경
  const handleProjChange = useCallback((val: string | undefined) => {
    const proj = val ?? 'PJ000';
    selectedProjRef.current = proj;
    setSelectedProj(proj);
    setTimeout(() => grid2Ref.current?.api?.refreshCells({ force: true }), 0);
    if (selectedLbl) {
      setTrnRows(loadTrnList(selectedLbl.lblId, proj));
    }
  }, [selectedLbl, loadTrnList]);

  // ── 핸들러 — 폼 필드 변경 (라벨 키 자동 생성)
  const handleValuesChange = useCallback(
    (changed: Partial<FormFields>, all: FormFields) => {
      if ('screenId' in changed || 'section' in changed || 'type' in changed || 'detail' in changed) {
        form.setFieldValue('lblId', buildLblId(all.screenId ?? '', all.section ?? '', all.type ?? '', all.detail ?? ''));
      }
    },
    [form],
  );

  // ── 핸들러 — GRID1 행 클릭
  const handleRowClick = useCallback((row: LblItem) => {
    setSelectedLbl(row);
    const parts = parseLblId(row.lblId);
    form.setFieldsValue({
      screenId: parts.screenId,
      section:  parts.section,
      type:     parts.type,
      detail:   parts.detail,
      lblId:    row.lblId,
      mrCont:   row.mrCont,
    });
    if (formCollapsed) setFormCollapsed(false);
    setTrnRows(loadTrnList(row.lblId, selectedProjRef.current));
  }, [form, formCollapsed, loadTrnList]);

  // ── 핸들러 — 폼 초기화
  const handleFormReset = useCallback(() => {
    setSelectedLbl(null);
    setTrnRows([]);
    form.resetFields();
    grid1Ref.current?.api?.deselectAll();
  }, [form]);

  // ── 핸들러 — 라벨 저장 (mock: 토스트만)
  const handleSave = useCallback(() => {
    form.validateFields().then((_values) => {
      confirm(
        isEditMode ? '수정하시겠습니까?' : '등록하시겠습니까?',
        () => {
          messageApi.success(isEditMode ? '수정되었습니다.' : '등록되었습니다. (Mock)');
          if (!isEditMode) handleFormReset();
        },
      );
    }).catch(() => {
      messageApi.warning('필수 항목을 입력해 주세요.');
    });
  }, [form, isEditMode, confirm, messageApi, handleFormReset]);

  // ── 핸들러 — 라벨 삭제 (mock)
  const handleDelete = useCallback(() => {
    if (!selectedLbl) return;
    confirm('삭제하시겠습니까?', () => {
      messageApi.success('삭제되었습니다. (Mock)');
      selectedProjRef.current = 'PJ000';
      setSelectedProj('PJ000');
      handleFormReset();
    }, true);
  }, [selectedLbl, confirm, messageApi, handleFormReset]);

  // ── 핸들러 — GRID2 번역 추가
  const handleTrnAdd = useCallback(() => {
    if (!selectedLbl) return;
    if (trnRows.length >= LANG_OPTIONS.length) {
      messageApi.warning(`언어 코드는 최대 ${LANG_OPTIONS.length}개까지 추가할 수 있습니다.`);
      return;
    }
    setTrnRows((prev) => [
      ...prev,
      { lblId: selectedLbl.lblId, lclCd: '', lblTxt: '', _isNew: true, _rowId: `new_${Date.now()}` },
    ]);
  }, [selectedLbl, trnRows.length, messageApi]);

  // ── 핸들러 — GRID2 번역 삭제 (mock)
  const handleTrnDelete = useCallback(() => {
    const selected = (grid2Ref.current?.api?.getSelectedRows() ?? []) as LblTrnItem[];
    if (selected.length === 0) { messageApi.warning('삭제할 행을 선택하세요.'); return; }
    confirm(`선택한 ${selected.length}건을 삭제하시겠습니까?`, () => {
      setTrnRows((prev) => prev.filter((r) => !selected.some((s) => s._rowId === r._rowId)));
      messageApi.success(`${selected.length}건 삭제되었습니다. (Mock)`);
    }, true);
  }, [confirm, messageApi]);

  // ── 핸들러 — GRID2 번역 저장 (mock)
  const handleTrnSave = useCallback(() => {
    if (!selectedLbl) return;
    const selected = (grid2Ref.current?.api?.getSelectedRows() ?? []) as LblTrnItem[];
    if (selected.length === 0) { messageApi.warning('저장할 행을 선택하세요.'); return; }
    if (selected.some((r) => !r.lclCd)) { messageApi.warning('언어 코드를 선택하세요.'); return; }
    const codes = selected.map((r) => r.lclCd);
    if (codes.some((c, i) => codes.indexOf(c) !== i)) { messageApi.warning('중복된 언어 코드가 있습니다.'); return; }

    confirm(`선택한 ${selected.length}건을 저장하시겠습니까?`, () => {
      setTrnRows((prev) =>
        prev.map((r) => {
          const hit = selected.find((s) => s._rowId === r._rowId);
          if (!hit) return r;
          return { ...r, _isNew: false, _isDirty: false, _isProjDirty: false };
        }),
      );
      grid2Ref.current?.api?.deselectAll();
      messageApi.success(`${selected.length}건 저장되었습니다. (Mock)`);
    });
  }, [selectedLbl, confirm, messageApi]);

  // ── GRID2 편집 시작 — PJ000 시 projTxt 차단
  const handleCellEditingStarted = useCallback((e: CellEditingStartedEvent<LblTrnItem>) => {
    if (e.column.getColId() === 'projTxt' && selectedProjRef.current === 'PJ000') {
      e.api.stopEditing(true);
    }
  }, []);

  // ── GRID2 값 변경
  const handleCellValueChanged = useCallback((e: CellValueChangedEvent<LblTrnItem>) => {
    const isProj = e.colDef.field === 'projTxt';
    setTrnRows((prev) =>
      prev.map((r) => {
        if (r._rowId !== e.data._rowId) return r;
        if (isProj) return { ...r, projTxt: e.newValue as string, _isProjDirty: true };
        if (!r._isNew) return { ...r, _isDirty: true };
        return r;
      }),
    );
  }, []);

  // ── GRID1 컬럼
  const grid1Cols = useMemo<ColDef<LblItem>[]>(() => [
    {
      headerName: '라벨 키',
      field: 'lblId',
      minWidth: 250,
    },
    {
      headerName: '화면ID',
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).screenId : '',
      minWidth: 120,
    },
    {
      headerName: '섹션',
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).section : '',
      width: 100, flex: 0,
    },
    {
      headerName: '타입',
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).type : '',
      width: 80, flex: 0,
    },
    {
      headerName: '세부코드',
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).detail : '',
      minWidth: 120,
    },
    {
      headerName: '기본 텍스트',
      field: 'mrCont',
      minWidth: 160,
    },
  ], []);

  // ── GRID2 컬럼
  const grid2Cols = useMemo<ColDef<LblTrnItem>[]>(() => [
    {
      field: 'lclCd',
      headerName: '언어',
      width: 130, flex: 0,
      editable: (params) => Boolean(params.data?._isNew),
      valueFormatter: (p) => LANG_LABELS[p.value as string] ?? p.value ?? '',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: { data?: LblTrnItem }) => ({
        values: LANG_OPTIONS
          .filter((o) => !trnRows.some((r) => r.lclCd === o.value && r._rowId !== params.data?._rowId))
          .map((o) => o.value),
      }),
    },
    {
      field: 'lblTxt',
      headerName: '공통 텍스트',
      minWidth: 185,
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
      field: 'projTxt',
      headerName: '프로젝트별 텍스트',
      minWidth: 185,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellStyle: () => selectedProjRef.current !== 'PJ000'
        ? { color: '', pointerEvents: '' }
        : { color: 'var(--text-secondary, #999)', pointerEvents: 'none' },
    },
  ], [trnRows]);

  const activeFilterCount = (filterLblId ? 1 : 0) + (filterMrCont ? 1 : 0);
  const trnAddDisabled = !selectedLbl || trnRows.length >= LANG_OPTIONS.length;

  return (
    <div className="page-container">
      {contextHolder}

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={activeFilterCount}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">라벨 키</span>
          <Input
            value={filterLblId}
            onChange={(e) => setFilterLblId(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">기본 텍스트</span>
          <Input
            value={filterMrCont}
            onChange={(e) => setFilterMrCont(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* ── 좌우 분할 그리드 */}
      <div className={styles.splitBody}>

        {/* 좌: 라벨 키 목록 */}
        <div className={styles.leftPane}>
          <div className={styles.paneTitleRow}>라벨 키 목록</div>
          <div className={styles.gridWrapper}>
            <GridPanel<LblItem>
              totalCount={filteredList.length}
              columnDefs={grid1Cols}
              rowData={filteredList}
              rowKey="lblId"
              gridRef={grid1Ref}
              onRowClick={handleRowClick}
              height="100%"
              pagination={false}
              defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
            />
          </div>
        </div>

        {/* 우: 다국어 설정 */}
        <div className={styles.rightPane}>
          <div className={styles.paneTitleRow}>
            <span className={styles.paneTitleLabel}>다국어 설정</span>
            <div className={styles.paneProjArea}>
              <span className={styles.paneProjLabel}>프로젝트</span>
              <Select
                value={selectedProj}
                onChange={handleProjChange}
                size="small"
                className={styles.paneProjSelector}
                options={MOCK_PROJECTS.map((p) => ({ label: p.projNm, value: p.projId }))}
              />
            </div>
          </div>
          <div className={styles.gridWrapper}>
            <GridPanel<LblTrnItem>
              totalCount={trnRows.length}
              columnDefs={grid2Cols}
              rowData={trnRows}
              rowKey={(r) => r._rowId ?? r.lclCd}
              gridRef={grid2Ref}
              height="100%"
              pagination={false}
              rowSelection="multiRow"
              checkboxSelection
              editable
              onCellValueChanged={handleCellValueChanged}
              onCellEditingStarted={handleCellEditingStarted}
              defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
              actions={
                <div style={{ display: 'flex', width: '100%', gap: 4 }}>
                  <Button size="middle" onClick={handleTrnAdd} disabled={trnAddDisabled}>추가</Button>
                  <div style={{ flex: 1 }} />
                  <Button size="middle" type="primary" onClick={handleTrnSave} disabled={!selectedLbl}>저장</Button>
                  <Button size="middle" danger onClick={handleTrnDelete} disabled={!selectedLbl}>삭제</Button>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* ── 하단 입력 폼 */}
      <FormPanel
        title="라벨 등록"
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleFormReset}>초기화</Button>
            <VerticalDivider />
            <Button size="middle" type="primary" onClick={handleSave}>저장</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>삭제</Button>
            <VerticalDivider />
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ style: { width: 72, textAlign: 'right' } }}
          wrapperCol={{ style: { flex: 1, minWidth: 0 } }}
          initialValues={{ section: '', type: '' }}
          onValuesChange={handleValuesChange}
        >
          <Row gutter={[12, 0]}>
            {/* 좌: 화면ID / 섹션 / 타입 / 세부코드 / 라벨 키 */}
            <Col span={15}>
              <Row gutter={[12, 0]}>
                <Col span={8}>
                  <Form.Item
                    label="화면ID"
                    name="screenId"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <Input
                      readOnly={isEditMode}
                      maxLength={30}
                      placeholder="CCO102003SC"
                      style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="섹션"
                    name="section"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <Select
                      options={SECTION_OPTIONS}
                      style={{ width: '100%' }}
                      disabled={isEditMode}
                      placeholder="선택"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="타입"
                    name="type"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <Select
                      options={TYPE_OPTIONS}
                      style={{ width: '100%' }}
                      disabled={isEditMode}
                      placeholder="선택"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[12, 0]}>
                <Col span={8}>
                  <Form.Item
                    label="세부코드"
                    name="detail"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: 0 }}
                  >
                    <Input
                      readOnly={isEditMode}
                      maxLength={160}
                      style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                    />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    label="라벨 키"
                    name="lblId"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: 0 }}
                  >
                    <Input
                      readOnly
                      maxLength={160}
                      style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* 우: 기본 텍스트 */}
            <Col span={9}>
              <Form.Item
                label="기본 텍스트"
                name="mrCont"
                style={{ margin: 0, height: '100%' }}
              >
                <Input.TextArea
                  maxLength={500}
                  style={{ resize: 'none', height: '100%', minHeight: 60 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>
    </div>
  );
}
