import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { Form, Row, Col, Input, Select } from 'antd';
import GridPanel from '@/components/grid/grid-panel';
import TipInput from '@/components/inputs/tip-input';
import ActionButton from '@/components/common/actions/action-button';
import ActionButtonGroup from '@/components/common/actions/action-button-group';
import FilterPanel from '@/components/layout/filter-panel';
import FormPanel from '@/components/layout/form-panel';
import SplitPanel from '@/components/layout/split-panel';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useLabelStore } from '@/stores/label-store';
import { formatLabel } from '@/lib/i18n/format-label';
import { getLanguages } from '@/api/common/lbl-bulk-api';
import type { LangItem } from '@/api/common/lbl-bulk-api';
import {
  getLabelRows, saveLabelBatch, deleteLabel, groupLabelRows,
} from '@/api/sys/lbl-mng-api';
import type { LblRow, LblMaster, LblKey } from '@/api/sys/lbl-mng-api';

// ─────────────────────────────────────────────────────────────────────────────
// Multilingual label management (A06040300)
//
// LANG_LBL has a 3-column PK (LBL_CD, SCRN_ID, LBL_SE_CD). The entire screen treats these 3 as a single
// identifier and never shortens it to a single key (lblId) — LBL_CD alone does not identify a row.
//
// Translation languages are defined by LANG_MNG. The right grid creates as many rows as languages fetched,
// so adding a language in DB automatically reflects on this screen.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Label type code (LBL_SE_CD) candidates and description label keys.
 *
 * Common code (COM_CD) lacks a label-type domain and full code lookup (`/api/comcd/all`) is
 * unimplemented (`src/api/common/comCdApi.ts`), so options are kept as screen constants. Replace with
 * `ComcdSelect` once common codes are registered. MENU / CODE are values from existing seeded data.
 *
 * Descriptions are fetched from the label table — hardcoding Korean in constants would persist across language switches.
 */
const LBL_SE_VALUES: { value: string; field: string; ko: string }[] = [
  { value: 'TEXT',  field: 'seText',  ko: '화면 텍스트' },
  { value: 'BTN',   field: 'seBtn',   ko: '버튼' },
  { value: 'TITLE', field: 'seTitle', ko: '제목' },
  { value: 'GRID',  field: 'seGrid',  ko: '그리드 헤더' },
  { value: 'MSG',   field: 'seMsg',   ko: '메시지' },
  { value: 'MENU',  field: 'seMenu',  ko: '메뉴' },
  { value: 'CODE',  field: 'seCode',  ko: '공통코드' },
];

/** Second segment of label key — `{screenId}.{section}.{type}_{detail}` */
const SECTION_VALUES: { value: string; field: string; ko: string }[] = [
  { value: 'VIEW',   field: 'sectionView',   ko: '화면 템플릿' },
  { value: 'SCRIPT', field: 'sectionScript', ko: '이벤트 핸들러' },
];

interface FormFields {
  scrnId:   string;
  section:  string;
  lblSeCd:  string;
  detail:   string;
  lblCd:    string;   // Auto-generated on new registration (readonly)
  lblExpln: string;
}

/** One row in the right translation grid */
interface TrnRow {
  langCd:  string;
  langNm:  string;
  trslLtr: string;
  _dirty?: boolean;
}

function buildLblCd(scrnId: string, section: string, lblSeCd: string, detail: string) {
  if (!scrnId && !section && !lblSeCd && !detail) return '';
  return `${scrnId}.${section}.${lblSeCd}_${detail}`;
}

export default function SYS050301SC() {
  const { toast, notify, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  // ── Search filters
  const [filterScrnId, setFilterScrnId]   = useState('');
  const [filterLblCd, setFilterLblCd]     = useState('');
  const [filterLblSeCd, setFilterLblSeCd] = useState<string | undefined>(undefined);
  const [applied, setApplied] = useState<{ scrnId?: string; lblCd?: string; lblSeCd?: string } | null>(null);

  // ── Left grid
  const grid1Ref = useRef<AgGridReact<LblMaster>>(null);
  const [selected, setSelected] = useState<LblMaster | null>(null);

  // ── Right grid
  const grid2Ref = useRef<AgGridReact<TrnRow>>(null);
  const [trnRows, setTrnRows] = useState<TrnRow[]>([]);

  // ── Input form
  const [form] = Form.useForm<FormFields>();
  const [formCollapsed, setFormCollapsed] = useState(false);
  const isEditMode = selected !== null;

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: languages = [] } = useApiQuery<LangItem[]>(
    ['lbl', 'languages'],
    () => getLanguages(),
  );

  const { data: rows = [], isLoading } = useApiQuery<LblRow[]>(
    ['lbl', 'rows', applied],
    () => getLabelRows(applied ?? {}),
    { enabled: applied !== null },
  );

  const masters = useMemo(() => (applied === null ? [] : groupLabelRows(rows)), [rows, applied]);

  /**
   * Refresh cache after save/delete — clear both layers.
   *
   * ① react-query : `queryKey` includes search conditions (`applied`), so use **prefix invalidation**.
   *    `refetch()` only updates the current condition's cache, leaving stale results when filters change.
   * ② labelStore : app-wide label map. Server cache is evicted on save, but
   *    the client cache (IndexedDB, 5-min TTL) is force-cleared here.
   */
  const invalidateAfterWrite = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['lbl', 'rows'] });
    void useLabelStore.getState().invalidateLabelCache();
  }, [queryClient]);

  const saveMutation   = useApiMutation<void, LblRow[]>(saveLabelBatch);
  const deleteMutation = useApiMutation<void, LblKey>(deleteLabel);

  /** Selected label + language list → right grid rows (always filled for all languages) */
  const buildTrnRows = useCallback(
    (master: LblMaster): TrnRow[] =>
      languages.map((l) => ({
        langCd:  l.langCd,
        langNm:  l.langNm,
        trslLtr: master.trsl[l.langCd] ?? '',
      })),
    [languages],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const clearSelection = useCallback(() => {
    setSelected(null);
    setTrnRows([]);
    form.resetFields();
    grid1Ref.current?.api?.deselectAll();
  }, [form]);

  const handleSearch = useCallback(() => {
    setApplied({
      scrnId:  filterScrnId.trim()  || undefined,
      lblCd:   filterLblCd.trim()   || undefined,
      lblSeCd: filterLblSeCd        || undefined,
    });
    clearSelection();
  }, [filterScrnId, filterLblCd, filterLblSeCd, clearSelection]);

  /** Clear search filters only — keep grid/form state */
  const handleFilterReset = useCallback(() => {
    setFilterScrnId('');
    setFilterLblCd('');
    setFilterLblSeCd(undefined);
  }, []);

  const handleRowClick = useCallback((row: LblMaster) => {
    setSelected(row);
    // Existing seeded entries (lbl.menu.*, etc.) do not follow the key assembly rule, so do not reverse-parse them.
    // In edit mode, show the 3 PKs as-is and allow editing only the label description.
    form.setFieldsValue({
      scrnId:   row.scrnId,
      section:  '',
      lblSeCd:  row.lblSeCd,
      detail:   '',
      lblCd:    row.lblCd,
      lblExpln: row.lblExpln,
    });
    setTrnRows(buildTrnRows(row));
    if (formCollapsed) setFormCollapsed(false);
  }, [form, formCollapsed, buildTrnRows]);

  /** Auto-assemble key only in new registration mode */
  const handleValuesChange = useCallback(
    (changed: Partial<FormFields>, all: FormFields) => {
      if (isEditMode) return;
      if ('scrnId' in changed || 'section' in changed || 'lblSeCd' in changed || 'detail' in changed) {
        form.setFieldValue(
          'lblCd',
          buildLblCd(all.scrnId ?? '', all.section ?? '', all.lblSeCd ?? '', all.detail ?? ''),
        );
      }
    },
    [form, isEditMode],
  );

  /** Save label — upsert LANG_LBL only without translations */
  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      dialog.confirm({
        content: isEditMode ? tmc('C100002') : tmc('C100001'),
        onOk: () => {
          const item: LblRow = {
            lblCd:    values.lblCd,
            scrnId:   values.scrnId,
            lblSeCd:  values.lblSeCd,
            lblExpln: values.lblExpln ?? '',
          };
          // Do not attach onError — the apiClient interceptor already shows error toasts (avoids duplicates).
          // If screen-specific text is needed, pass `skipErrorToast: true` on the request and handle it here.
          saveMutation.mutate([item], {
            onSuccess: () => {
              notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
              if (!isEditMode) clearSelection();
              invalidateAfterWrite();
            },
          });
        },
      });
    }).catch(() => {
      notify.error(tme('E100001'));
    });
  }, [form, isEditMode, dialog, saveMutation, notify, tmc, tmi, tme, clearSelection, invalidateAfterWrite]);

  /** Delete label — translations are also deleted together */
  const handleDelete = useCallback(() => {
    if (!selected) return;
    dialog.confirm({
      content: tsm('deleteConfirm', '라벨과 번역이 함께 삭제됩니다. 삭제하시겠습니까?'),
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutation.mutate(
          { lblCd: selected.lblCd, scrnId: selected.scrnId, lblSeCd: selected.lblSeCd },
          {
            onSuccess: () => {
              notify.success(tmi('I100004'));
              clearSelection();
              invalidateAfterWrite();
            },
          },
        );
      },
    });
  }, [selected, dialog, deleteMutation, notify, tsm, tmi, clearSelection, invalidateAfterWrite]);

  /** Save translations — send only modified language rows */
  const handleTrnSave = useCallback(() => {
    if (!selected) return;
    const dirty = trnRows.filter((r) => r._dirty);
    if (dirty.length === 0) { toast.warning(tsm('noChanges', '변경된 내용이 없습니다.')); return; }

    dialog.confirm({
      content: formatLabel(tsm('trnSaveConfirm', '번역 {0}건을 저장하시겠습니까?'), dirty.length),
      onOk: () => {
        // Without sending lblExpln, the server's label upsert overwrites the description with an empty value.
        const items: LblRow[] = dirty.map((r) => ({
          lblCd:    selected.lblCd,
          scrnId:   selected.scrnId,
          lblSeCd:  selected.lblSeCd,
          lblExpln: selected.lblExpln,
          langCd:   r.langCd,
          trslLtr:  r.trslLtr,
        }));
        saveMutation.mutate(items, {
          onSuccess: () => {
            notify.success(tmi('I100003'));
            setTrnRows((prev) => prev.map((r) => ({ ...r, _dirty: false })));
            invalidateAfterWrite();
          },
        });
      },
    });
  }, [selected, trnRows, dialog, toast, saveMutation, notify, tsm, tmi, invalidateAfterWrite]);

  const handleCellValueChanged = useCallback((e: CellValueChangedEvent<TrnRow>) => {
    setTrnRows((prev) =>
      prev.map((r) => (r.langCd === e.data.langCd ? { ...r, trslLtr: e.data.trslLtr, _dirty: true } : r)),
    );
  }, []);

  // ── Columns ──────────────────────────────────────────────────────────────────

  const grid1Cols = useMemo<ColDef<LblMaster>[]>(() => [
    { headerName: tsg('lblCd',    '라벨코드'),   field: 'lblCd',    minWidth: 260 },
    { headerName: tsg('scrnId',   '화면ID'),     field: 'scrnId',   width: 140, flex: 0 },
    { headerName: tsg('lblSeCd',  '라벨구분'),   field: 'lblSeCd',  width: 110, flex: 0 },
    { headerName: tsg('lblExpln', '라벨설명'),   field: 'lblExpln', minWidth: 200 },
  // tsg 는 labelsVersion 이 바뀔 때만 새 함수가 되므로(useScreenLabel), 이것만 의존하면 충분하다.
  ], [tsg]);

  const grid2Cols = useMemo<ColDef<TrnRow>[]>(() => [
    { headerName: tsg('langCd',  '언어코드'), field: 'langCd',  width: 90,  flex: 0 },
    { headerName: tsg('langNm',  '언어'),     field: 'langNm',  width: 110, flex: 0 },
    { headerName: tsg('trslLtr', '번역문자'), field: 'trslLtr', minWidth: 200, editable: canWrite },
  ], [tsg, canWrite]);

  // Select display text is in "code — description" format. Keep the code as-is and translate only the description.
  const lblSeOptions = useMemo(
    () => LBL_SE_VALUES.map((o) => ({ value: o.value, label: `${o.value} — ${tvt(o.field, o.ko)}` })),
    [tvt],
  );
  const sectionOptions = useMemo(
    () => SECTION_VALUES.map((o) => ({ value: o.value, label: `${o.value} — ${tvt(o.field, o.ko)}` })),
    [tvt],
  );

  const activeFilterCount =
    (filterScrnId ? 1 : 0) + (filterLblCd ? 1 : 0) + (filterLblSeCd ? 1 : 0);

  return (
    <div className="page-container">

      {/* ── Search filter */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={activeFilterCount}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('scrnId', '화면ID')}</span>
          <Input
            value={filterScrnId}
            onChange={(e) => setFilterScrnId(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('lblCd', '라벨코드')}</span>
          <Input
            value={filterLblCd}
            onChange={(e) => setFilterLblCd(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('lblSeCd', '라벨구분')}</span>
          <Select
            value={filterLblSeCd}
            onChange={setFilterLblSeCd}
            options={lblSeOptions}
            placeholder={tvt('all', '전체')}
            allowClear
            style={{ width: '100%' }}
          />
        </div>
      </FilterPanel>

      {/* ── Left/right split grid
          SplitPanel owns the layout — do not re-create flex layouts on the screen.
          Put section titles in GridPanel's `title` slot (= left of toolbar) instead of a separate row,
          so left and right toolbar heights align automatically. */}
      <div className="page-body">
        <SplitPanel direction="horizontal" defaultRatio={0.6} primaryMinSize={320} secondaryMinSize={280}>

          {/* Left: label list */}
          <GridPanel<LblMaster>
            title={tvh('lblList', '라벨 목록')}
            totalCount={masters.length}
            columnDefs={grid1Cols}
            rowData={masters}
            rowKey="rowId"
            gridRef={grid1Ref}
            onRowClick={handleRowClick}
            loading={isLoading}
            height="100%"
            pagination={false}
          />

          {/* Right: translations by language */}
          <GridPanel<TrnRow>
            title={tvh('trnList', '언어별 번역')}
            totalCount={trnRows.length}
            columnDefs={grid2Cols}
            rowData={trnRows}
            rowKey="langCd"
            gridRef={grid2Ref}
            height="100%"
            pagination={false}
            editable={canWrite}
            onCellValueChanged={handleCellValueChanged}
            actions={
              <ActionButtonGroup canWrite={canWrite}>
                <ActionButton action="saveChanges" onClick={handleTrnSave} disabled={!selected}>
                  {tvb('save', '저장')}
                </ActionButton>
              </ActionButtonGroup>
            }
          />
        </SplitPanel>
      </div>

      {/* ── Bottom input form (register/edit label) */}
      <FormPanel
        title={tvh('input', '라벨 등록')}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <ActionButtonGroup
            preset="formEdit"
            canWrite={canWrite}
            items={[
              { key: 'reset',  action: 'reset',       label: tvb('reset', '초기화'),  onClick: clearSelection },
              { key: 'delete', action: 'deleteRow',   label: tvb('delete', '삭제'),   onClick: handleDelete, disabled: !isEditMode },
              { key: 'save',   action: 'saveChanges', label: tvb('save', '저장'),     onClick: handleSave },
            ]}
          />
        }
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ style: { width: 72, textAlign: 'right' } }}
          wrapperCol={{ style: { flex: 1, minWidth: 0 } }}
          initialValues={{ section: 'VIEW', lblSeCd: 'TEXT' }}
          onValuesChange={handleValuesChange}
        >
          <Row gutter={[12, 0]}>
            {/* Left: screenId / section / labelType / detailCode / labelCode */}
            <Col span={15}>
              <Row gutter={[12, 0]}>
                <Col span={8}>
                  <Form.Item
                    label={tvt('scrnId', '화면ID')}
                    name="scrnId"
                    rules={[{ required: true, message: '' }, { max: 20, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <TipInput readOnly={isEditMode} maxLength={20} placeholder="SYS050301SC" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={tvt('section', '섹션')}
                    name="section"
                    rules={[{ required: !isEditMode, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <Select options={sectionOptions} disabled={isEditMode} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={tvt('lblSeCd', '라벨구분')}
                    name="lblSeCd"
                    rules={[{ required: true, message: '' }]}
                    style={{ margin: '0 0 6px' }}
                  >
                    <Select options={lblSeOptions} disabled={isEditMode} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[12, 0]}>
                <Col span={8}>
                  <Form.Item
                    label={tvt('detail', '세부코드')}
                    name="detail"
                    rules={[{ required: !isEditMode, message: '' }]}
                    style={{ margin: 0 }}
                  >
                    <TipInput readOnly={isEditMode} maxLength={60} placeholder="usrId" />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    label={tvt('lblCd', '라벨코드')}
                    name="lblCd"
                    rules={[{ required: true, message: '' }, { max: 100, message: '' }]}
                    style={{ margin: 0 }}
                  >
                    <TipInput readOnly maxLength={100} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Right: label description (spans two rows) */}
            <Col span={9}>
              <Form.Item
                label={tvt('lblExpln', '라벨설명')}
                name="lblExpln"
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
