import { useState, useMemo, useCallback, useRef, useSyncExternalStore } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent, CellEditingStartedEvent } from 'ag-grid-community';
import { Button, Form, Row, Col, Space, Input, Select } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import FilterPanel from '@/components/layout/FilterPanel';
import { useComcdStore } from '@/stores/comcdStore';
import FormPanel from '@/components/layout/FormPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import {
  ComcdSelectCellRenderer,
  ComcdSelectCellEditor,
} from '@/components/grid/ComcdSelectCell';
import type { CodeDetail } from '@/api/common';
import { getMyProjects } from '@/api/project';
import type { MyProjectResponseDto } from '@/lib/api/types';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useNotify } from '@/hooks/useNotify';
import { useMenuPermission } from '@/hooks/useMenuPermission';
import {
  getLblList, getLblTrnList, saveLbl, deleteLbl,
  getProjLblTrnList, saveLblTrnBatch, deleteLblTrnBatch,
} from './api';
import type { LblItem, LblTrnItem } from './api';
import styles from './index.module.css';

// ── Local form fields type ──────────────────────────────────────────────────

interface FormFields {
  screenId: string;
  section:  string;
  type:     string;   // key-building type (LBL_TYPE_CD), e.g. TEXT / BTN / MSG
  detail:   string;
  lblId:    string;   // auto-generated readonly
  mrCont:   string;
}

// ── Helper: parse lblId → parts ─────────────────────────────────────────────
// lblId format: {screenId}.{section}.{type}_{detail}

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

export default function CCO102003SC() {
  const { toast, notify, dialog } = useNotify();
  const { tvt, tvb, tsg, tmi, labels } = useScreenLabel();
  const { canWrite } = useMenuPermission();

  // ── Filter state
  const [filterLblId, setFilterLblId]   = useState('');
  const [filterMrCont, setFilterMrCont] = useState('');
  const [appliedLblId, setAppliedLblId]   = useState('');
  const [appliedMrCont, setAppliedMrCont] = useState('');
  const [appliedTpCd, setAppliedTpCd]     = useState<string | undefined>(undefined);
  const [searched, setSearched]           = useState(false);

  // ── GRID1 state
  const grid1Ref  = useRef<AgGridReact<LblItem>>(null);
  const [selectedLbl, setSelectedLbl] = useState<LblItem | null>(null);

  // ── GRID2 state
  const grid2Ref    = useRef<AgGridReact<LblTrnItem>>(null);
  const [trnRows, setTrnRows]     = useState<LblTrnItem[]>([]);
  const [trnLoading, setTrnLoading] = useState(false);

  // ── 프로젝트 선택 state (다국어 설정 우측 패널) — PJ000(공통) 기본
  const [selectedProj, setSelectedProj] = useState<string>('PJ000');
  const selectedProjRef = useRef(selectedProj);
  selectedProjRef.current = selectedProj;
  // projectStore no longer exposes a myProjects list (post-merge) — fetch directly, same as ProjSelectField
  const { data: myProjects = [] } = useApiQuery<MyProjectResponseDto[]>(
    ['proj', 'my'],
    () => getMyProjects(),
  );

  // ── Form state
  const [form]           = Form.useForm<FormFields>();
  const [formCollapsed, setFormCollapsed] = useState(false);
  const isEditMode       = selectedLbl !== null;

  // ── API ──────────────────────────────────────────────────────────────────

  const { data: lblList = [], isLoading, refetch } = useApiQuery<LblItem[]>(
    ['lbl', 'list', appliedTpCd],
    () => getLblList(appliedTpCd),
    { enabled: searched },
  );

  // client-side filter by lblId / mrCont
  const filteredList = useMemo(() => {
    if (!searched) return [];
    let result = lblList;
    if (appliedLblId.trim()) {
      const kw = appliedLblId.trim().toLowerCase();
      result = result.filter((r) => r.lblId.toLowerCase().includes(kw));
    }
    if (appliedMrCont.trim()) {
      const kw = appliedMrCont.trim().toLowerCase();
      result = result.filter((r) => (r.mrCont ?? '').toLowerCase().includes(kw));
    }
    return result;
  }, [lblList, appliedLblId, appliedMrCont, searched]);

  const saveMutation   = useApiMutation<void, Parameters<typeof saveLbl>[0]>(saveLbl);
  const deleteMutation = useApiMutation<void, string>(deleteLbl);

  // ── 번역 목록 로드
  const loadTrnList = useCallback(async (lblId: string) => {
    setTrnLoading(true);
    try {
      const rows = await getLblTrnList(lblId);
      setTrnRows(rows.map((r) => ({ ...r, _rowId: r.lclCd })));
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : '번역 조회 실패');
      setTrnRows([]);
    } finally {
      setTrnLoading(false);
    }
  }, [notify]);

  // ── 프로젝트별 번역 로드 → trnRows의 projTxt 필드 병합
  const loadProjTrnList = useCallback(async (projId: string, lblId: string) => {
    try {
      const projRows = await getProjLblTrnList(projId, lblId);
      const map: Record<string, string> = {};
      for (const r of projRows) map[r.lclCd] = r.lblTxt;
      setTrnRows((prev) => prev.map((r) => ({ ...r, projTxt: map[r.lclCd] ?? '', _isProjDirty: false })));
    } catch {
      // 프로젝트 번역이 없으면 빈값으로 초기화
      setTrnRows((prev) => prev.map((r) => ({ ...r, projTxt: '', _isProjDirty: false })));
    }
  }, []);

  // ── 프로젝트 선택 변경 (PJ000=공통이면 프로젝트 텍스트 초기화)
  const handleProjChange = useCallback((val: string | undefined) => {
    const proj = val ?? 'PJ000';
    selectedProjRef.current = proj;  // re-render 전에 ref 먼저 갱신
    setSelectedProj(proj);
    // cellStyle 즉시 반영
    setTimeout(() => grid2Ref.current?.api?.refreshCells({ force: true }), 0);
    if (proj !== 'PJ000' && selectedLbl) {
      loadProjTrnList(proj, selectedLbl.lblId);
    } else {
      setTrnRows((prev) => prev.map((r) => ({ ...r, projTxt: '', _isProjDirty: false })));
    }
  }, [selectedLbl, loadProjTrnList]);

  // ── 폼 필드 변경 → 라벨 키 자동 생성
  const handleValuesChange = useCallback(
    (changed: Partial<FormFields>, all: FormFields) => {
      if ('screenId' in changed || 'section' in changed || 'type' in changed || 'detail' in changed) {
        form.setFieldValue('lblId', buildLblId(all.screenId ?? '', all.section ?? '', all.type ?? '', all.detail ?? ''));
      }
    },
    [form],
  );

  // ── 핸들러 — 검색
  const handleSearch = useCallback(() => {
    setSearched(true);
    setAppliedTpCd(undefined);    // type filter removed (key-type vs lblTpCd conflict)
    setAppliedLblId(filterLblId);
    setAppliedMrCont(filterMrCont);
    setSelectedLbl(null);
    setTrnRows([]);
    form.resetFields();
    grid1Ref.current?.api?.deselectAll();
  }, [filterLblId, filterMrCont, form]);

  // ── 핸들러 — 필터 초기화 (검색 조건만, 그리드/폼 상태 유지)
  const handleFilterReset = useCallback(() => {
    setFilterLblId('');
    setFilterMrCont('');
  }, []);

  // ── 핸들러 — GRID1 행 클릭
  const handleRowClick = useCallback(async (row: LblItem) => {
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
    await loadTrnList(row.lblId);
    if (selectedProj !== 'PJ000') {
      loadProjTrnList(selectedProj, row.lblId);
    }
  }, [form, formCollapsed, loadTrnList, selectedProj, loadProjTrnList]);

  // ── 핸들러 — 폼 초기화
  const handleFormReset = useCallback(() => {
    setSelectedLbl(null);
    setTrnRows([]);
    form.resetFields();
    grid1Ref.current?.api?.deselectAll();
  }, [form]);

  // ── 핸들러 — 라벨 저장
  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      dialog.confirm({
        content: isEditMode ? '수정하시겠습니까?' : '등록하시겠습니까?',
        onOk: () => {
          saveMutation.mutate(
            { lblId: values.lblId, mrCont: values.mrCont },
            {
              onSuccess: () => {
                notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
                if (!isEditMode) handleFormReset();
                refetch();
              },
              onError: (err) => notify.error(err.message),
            },
          );
        },
      });
    }).catch(() => {
      notify.error('필수 항목을 입력해 주세요.');
    });
  }, [form, isEditMode, dialog, saveMutation, selectedLbl, notify, tmi, handleFormReset, refetch]);

  // ── 핸들러 — 라벨 삭제
  const handleDelete = useCallback(() => {
    if (!selectedLbl) return;
    dialog.confirm({
      content: '삭제하시겠습니까?',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutation.mutate(selectedLbl.lblId, {
          onSuccess: () => {
            notify.success(tmi('I100004'));
            selectedProjRef.current = 'PJ000';
            setSelectedProj('PJ000');
            handleFormReset();
            refetch();
          },
          onError: (err) => notify.error(err.message),
        });
      },
    });
  }, [selectedLbl, dialog, deleteMutation, notify, tmi, handleFormReset, refetch]);

  // ── 핸들러 — GRID2 번역 추가 (언어 코드 총 갯수 초과 방지)
  const handleTrnAdd = useCallback(() => {
    if (!selectedLbl) return;
    const maxLang = useComcdStore.getState().codes['LBL_LANG_CD']?.length ?? 0;
    if (maxLang > 0 && trnRows.length >= maxLang) {
      toast.warning(`언어 코드는 최대 ${maxLang}개까지 추가할 수 있습니다.`);
      return;
    }
    setTrnRows((prev) => [
      ...prev,
      { lblId: selectedLbl.lblId, lclCd: '', lblTxt: '', _isNew: true, _rowId: `new_${Date.now()}_${Math.random()}` },
    ]);
  }, [selectedLbl, trnRows.length, toast]);

  // ── 핸들러 — GRID2 번역 행 삭제
  const handleTrnDelete = useCallback(async () => {
    const api = grid2Ref.current?.api;
    if (!api) return;
    const selected = api.getSelectedRows() as LblTrnItem[];
    if (selected.length === 0) { toast.warning('삭제할 행을 선택하세요.'); return; }

    const newRows   = selected.filter((r) => r._isNew);
    const savedRows = selected.filter((r) => !r._isNew);

    dialog.confirm({
      content: `선택한 ${selected.length}건을 삭제하시겠습니까?`,
      okButtonProps: { danger: true },
      onOk: async () => {
        // 신규 행 로컬 제거
        if (newRows.length > 0) {
          setTrnRows((prev) => prev.filter((r) => !newRows.some((n) => n._rowId === r._rowId)));
        }
        // 저장된 행 API 삭제
        if (savedRows.length > 0) {
          try {
            const projId = selectedProjRef.current !== 'PJ000' ? selectedProjRef.current : undefined;
            const res = await deleteLblTrnBatch(
              savedRows[0].lblId,
              savedRows.map((r) => r.lclCd),
              projId,
            );
            if (!res.success) throw new Error(res.message ?? '삭제 실패');
            notify.success(`${savedRows.length}건 삭제되었습니다.`);
            await loadTrnList(savedRows[0].lblId);
            if (projId) loadProjTrnList(projId, savedRows[0].lblId);
          } catch (e: unknown) {
            notify.error(e instanceof Error ? e.message : '삭제 오류');
          }
        }
      },
    });
  }, [toast, dialog, notify, loadTrnList, loadProjTrnList]);

  // ── 핸들러 — GRID2 번역 저장 (선택 행 일괄 트랜잭션)
  const handleTrnSave = useCallback(async () => {
    if (!selectedLbl) return;

    const selected = (grid2Ref.current?.api?.getSelectedRows() ?? []) as LblTrnItem[];
    if (selected.length === 0) { toast.warning('저장할 행을 선택하세요.'); return; }

    // ── 사전 검증 (API 호출 전 전체 확인)
    if (selected.some((r) => !r.lclCd)) {
      toast.warning('언어 코드를 선택하세요.');
      return;
    }
    const emptyTxt = selected.find((r) => (r._isNew || r._isDirty) && !r.lblTxt?.trim());
    if (emptyTxt) {
      toast.warning(`[${emptyTxt.lclCd}] 공통 번역 텍스트를 입력하세요.`);
      return;
    }
    const allCodes = selected.map((r) => r.lclCd);
    if (allCodes.some((c, i) => allCodes.indexOf(c) !== i)) {
      toast.warning('중복된 언어 코드가 있습니다.');
      return;
    }

    // ── batch 저장 목록 구성 (행당 1개 — common + project 통합)
    const projId = selectedProj !== 'PJ000' ? selectedProj : null;
    const batchItems: { lblId: string; lclCd: string; lblTxt: string; saveCommon: boolean; projId?: string; projTxt?: string }[] = [];

    for (const row of selected) {
      const saveCommon = !!(row._isNew || row._isDirty);
      const saveProjTxt = !!(projId && row._isProjDirty);
      if (saveCommon || saveProjTxt) {
        batchItems.push({
          lblId: row.lblId,
          lclCd: row.lclCd,
          lblTxt: row.lblTxt,
          saveCommon,
          ...(saveProjTxt && { projId: projId!, projTxt: row.projTxt ?? '' }),
        });
      }
    }

    if (batchItems.length === 0) { toast.warning('변경된 내용이 없습니다.'); return; }

    dialog.confirm({
      content: `선택한 ${selected.length}건을 저장하시겠습니까?`,
      onOk: async () => {
        try {
          const res = await saveLblTrnBatch(batchItems);
          if (!res.success) throw new Error(res.message ?? '저장 실패');
          notify.success(`${selected.length}건 저장되었습니다.`);
          grid2Ref.current?.api?.deselectAll();
          await loadTrnList(selectedLbl.lblId);
          if (projId) loadProjTrnList(projId, selectedLbl.lblId);
        } catch (e: unknown) {
          notify.error(`저장 실패 (전체 롤백): ${e instanceof Error ? e.message : '오류'}`);
        }
      },
    });
  }, [selectedLbl, selectedProj, dialog, notify, toast, loadTrnList, loadProjTrnList]);

  // ── GRID2 편집 시작 — PJ000(공통) 선택 시 projTxt 편집 차단
  const handleCellEditingStarted = useCallback((e: CellEditingStartedEvent<LblTrnItem>) => {
    if (e.column.getColId() === 'projTxt' && selectedProjRef.current === 'PJ000') {
      e.api.stopEditing(true);
    }
  }, []);

  // ── GRID2 onCellValueChanged
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

  // ── GRID1 컬럼 (레거시 기준)
  const grid1Cols = useMemo<ColDef<LblItem>[]>(() => [
    {
      headerName: tsg('lblId', '라벨 키'),
      field: 'lblId',
      minWidth: 250,
    },
    {
      headerName: tsg('screenId', '화면ID'),
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).screenId : '',
      minWidth: 120,
    },
    {
      headerName: tsg('section', '섹션'),
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).section : '',
      width: 90, flex: 0,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'LBL_SEC_CD' },
    },
    {
      headerName: tsg('type', '타입'),
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).type : '',
      width: 90, flex: 0,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'LBL_TYPE_CD' },
    },
    {
      headerName: tsg('detail', '세부코드'),
      valueGetter: (p) => p.data ? parseLblId(p.data.lblId).detail : '',
      minWidth: 120,
    },
    {
      headerName: tsg('mrCont', '기본 텍스트'),
      field: 'mrCont',
      minWidth: 180,
    },
  ], [labels, tsg]);

  // ── GRID2 컬럼 (레거시 기준)
  const grid2Cols = useMemo<ColDef<LblTrnItem>[]>(() => [
    {
      field: 'lclCd',
      headerName: tsg('lclCd', '언어'),
      width: 130, flex: 0,
      editable: (params) => Boolean(params.data?._isNew),
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'LBL_LANG_CD', prefixOption: '선택' },
      cellEditor: ComcdSelectCellEditor,
      cellEditorParams: (params: { data?: LblTrnItem }) => ({
        cdDmnId: 'LBL_LANG_CD',
        prefixOption: '선택',
        filterFn: (code: CodeDetail) =>
          !trnRows.some((r) => r.lclCd === code.cd && r._rowId !== params.data?._rowId),
      }),
    },
    {
      field: 'lblTxt',
      headerName: tsg('lblTxt', '공통 텍스트'),
      minWidth: 185,
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
      field: 'projTxt',
      headerName: tsg('projTranslatedText', '프로젝트별 텍스트'),
      minWidth: 185,
      cellEditor: 'agTextCellEditor',
      cellStyle: () => selectedProjRef.current !== 'PJ000'
        ? { color: '', pointerEvents: '' }
        : { color: 'var(--text-secondary, #999)', pointerEvents: 'none' },
    },
  ], [labels, tsg, trnRows, canWrite, selectedProj]);

  const activeFilterCount = (filterLblId ? 1 : 0) + (filterMrCont ? 1 : 0);
  const langCount = useSyncExternalStore(
    useComcdStore.subscribe,
    () => useComcdStore.getState().codes['LBL_LANG_CD']?.length ?? 0,
  );
  const trnAddDisabled = !selectedLbl || (langCount > 0 && trnRows.length >= langCount);

  return (
    <div className="page-container">

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={activeFilterCount}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('lblId', '라벨 키')}</span>
          <Input
            value={filterLblId}
            onChange={(e) => setFilterLblId(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('mrCont', '기본 텍스트')}</span>
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
          {tvt('lblList', '라벨 키 목록') && <div className={styles.paneTitleRow}>{tvt('lblList', '라벨 키 목록')}</div>}
          <div className={styles.gridWrapper}>
            <GridPanel<LblItem>
              totalCount={filteredList.length}
              columnDefs={grid1Cols}
              rowData={filteredList}
              rowKey="lblId"
              gridRef={grid1Ref}
              onRowClick={handleRowClick}
              loading={isLoading}
              height="100%"
              pagination={false}
              defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
            />
          </div>
        </div>

        {/* 우: 다국어 설정 */}
        <div className={styles.rightPane}>
          <div className={styles.paneTitleRow}>
            <span className={styles.paneTitleLabel}>{tvt('trnList', '다국어 설정')}</span>
            <div className={styles.paneProjArea}>
              <span className={styles.paneProjLabel}>프로젝트</span>
              <Select
                value={selectedProj}
                onChange={handleProjChange}
                size="small"
                className={styles.paneProjSelector}
                options={[...myProjects]
                  .sort((a, b) => (a.projId === 'PJ000' ? -1 : b.projId === 'PJ000' ? 1 : 0))
                  .map((p) => ({ label: p.projNm ?? p.projId, value: p.projId }))}
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
              loading={trnLoading}
              height="100%"
              pagination={false}
              rowSelection="multiRow"
              checkboxSelection={canWrite}
              editable={canWrite}
              onCellValueChanged={handleCellValueChanged}
              onCellEditingStarted={handleCellEditingStarted}
              defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
              actions={canWrite ? (
                <div style={{ display: 'flex', width: '100%', gap: 4 }}>
                  <Button size="middle" onClick={handleTrnAdd} disabled={trnAddDisabled}>
                    {tvb('btnAdd', '추가')}
                  </Button>
                  <div style={{ flex: 1 }} />
                  <Button size="middle" type="primary" onClick={handleTrnSave} disabled={!selectedLbl}>
                    {tvb('btnSave', '저장')}
                  </Button>
                  <Button size="middle" danger onClick={handleTrnDelete} disabled={!selectedLbl}>
                    {tvb('btnDel', '삭제')}
                  </Button>
                </div>
              ) : undefined}
            />
          </div>
        </div>
      </div>

      {/* ── 하단 입력 폼 (라벨 등록) */}
      <FormPanel
        title={tvt('input', '라벨 등록')}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleFormReset}>{tvb('btnInit2', '초기화')}</Button>
            <VerticalDivider />
            {canWrite && (
              <>
                <Button size="middle" type="primary" onClick={handleSave}>{tvb('btnSave', '저장')}</Button>
                <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>
                  {tvb('btnDel', '삭제')}
                </Button>
                <VerticalDivider />
              </>
            )}
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
                    label={tvt('screenId', '화면ID')}
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
                    label={tvt('section', '섹션')}
                    name="section"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <ComcdSelect
                      cdDmnId="LBL_SEC_CD"
                      prefixOption="선택"
                      style={{ width: '100%' }}
                      disabled={isEditMode}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={tvt('type', '타입')}
                    name="type"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <ComcdSelect
                      cdDmnId="LBL_TYPE_CD"
                      prefixOption="선택"
                      style={{ width: '100%' }}
                      disabled={isEditMode}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[12, 0]}>
                <Col span={8}>
                  <Form.Item
                    label={tvt('detail', '세부코드')}
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
                    label={tvt('lblId', '라벨 키')}
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

            {/* 우: 기본 텍스트 (두 행에 걸쳐 표시) */}
            <Col span={9}>
              <Form.Item
                label={tvt('mrCont', '기본 텍스트')}
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
