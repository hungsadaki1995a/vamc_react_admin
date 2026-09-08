import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { Form, Row, Col, Input, Select } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import TipInput from '@/components/inputs/TipInput';
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import SplitPanel from '@/components/layout/SplitPanel';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useNotify } from '@/hooks/useNotify';
import { useMenuPermission } from '@/hooks/useMenuPermission';
import { useLabelStore } from '@/stores/labelStore';
import { formatLabel } from '@/lib/i18n/formatLabel';
import { getLanguages } from '@/api/common/lblBulkApi';
import type { LangItem } from '@/api/common/lblBulkApi';
import {
  getLabelRows, saveLabelBatch, deleteLabel, groupLabelRows,
} from '@/api/sys/lblMngApi';
import type { LblRow, LblMaster, LblKey } from '@/api/sys/lblMngApi';

// ─────────────────────────────────────────────────────────────────────────────
// 다국어 라벨 관리 (A06050300)
//
// LANG_LBL 의 PK 는 (LBL_CD, SCRN_ID, LBL_SE_CD) 3개다. 화면 전체가 이 3개를 하나의
// 식별자로 다루며, 단일 키(lblId)로 줄여 부르지 않는다 — LBL_CD 만으로는 행이 특정되지 않는다.
//
// 번역 언어는 LANG_MNG 가 정한다. 우측 그리드는 조회된 언어 수만큼 행을 만들므로
// 언어가 늘어나면 DB 한 줄로 화면이 따라온다.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 라벨구분코드(LBL_SE_CD) 후보와 설명 라벨 키.
 *
 * 공통코드(COM_CD)에 라벨 구분 도메인이 아직 없고 전체 코드 조회(`/api/comcd/all`)도
 * 미구현이라(`src/api/common/comCdApi.ts`) 값 목록을 화면 상수로 둔다. 공통코드가 등록되면
 * `ComcdSelect` 로 교체한다. MENU / CODE 는 기존 적재 데이터(메뉴·공통코드 라벨)의 값이다.
 *
 * 설명 문구는 라벨 테이블에서 가져온다 — 상수에 한국어를 박아두면 언어를 바꿔도 남는다.
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

/** 라벨 키의 두 번째 마디 — `{화면ID}.{섹션}.{구분}_{세부}` */
const SECTION_VALUES: { value: string; field: string; ko: string }[] = [
  { value: 'VIEW',   field: 'sectionView',   ko: '화면 템플릿' },
  { value: 'SCRIPT', field: 'sectionScript', ko: '이벤트 핸들러' },
];

interface FormFields {
  scrnId:   string;
  section:  string;
  lblSeCd:  string;
  detail:   string;
  lblCd:    string;   // 신규 등록 시 자동 생성 (readonly)
  lblExpln: string;
}

/** 우측 번역 그리드 1행 */
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

  // ── 검색 조건
  const [filterScrnId, setFilterScrnId]   = useState('');
  const [filterLblCd, setFilterLblCd]     = useState('');
  const [filterLblSeCd, setFilterLblSeCd] = useState<string | undefined>(undefined);
  const [applied, setApplied] = useState<{ scrnId?: string; lblCd?: string; lblSeCd?: string } | null>(null);

  // ── 좌측 그리드
  const grid1Ref = useRef<AgGridReact<LblMaster>>(null);
  const [selected, setSelected] = useState<LblMaster | null>(null);

  // ── 우측 그리드
  const grid2Ref = useRef<AgGridReact<TrnRow>>(null);
  const [trnRows, setTrnRows] = useState<TrnRow[]>([]);

  // ── 입력 폼
  const [form] = Form.useForm<FormFields>();
  const [formCollapsed, setFormCollapsed] = useState(false);
  const isEditMode = selected !== null;

  // ── 조회 ──────────────────────────────────────────────────────────────────

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
   * 저장/삭제 후 캐시 갱신 — 두 층을 모두 비운다.
   *
   * ① react-query : `queryKey` 에 검색조건(`applied`)이 붙어 있으므로 **접두 무효화**를 쓴다.
   *    `refetch()` 는 지금 조건의 캐시만 갱신해서, 조건을 바꿔 다시 조회하면 낡은 결과가 나온다.
   * ② labelStore : 앱 전체가 쓰는 라벨 맵. 서버 캐시는 저장 시 evict 되지만
   *    클라이언트 캐시(IndexedDB, TTL 5분)는 여기서 강제로 비운다.
   */
  const invalidateAfterWrite = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['lbl', 'rows'] });
    void useLabelStore.getState().invalidateLabelCache();
  }, [queryClient]);

  const saveMutation   = useApiMutation<void, LblRow[]>(saveLabelBatch);
  const deleteMutation = useApiMutation<void, LblKey>(deleteLabel);

  /** 선택된 라벨 + 언어 목록 → 우측 그리드 행 (언어 수만큼 항상 채운다) */
  const buildTrnRows = useCallback(
    (master: LblMaster): TrnRow[] =>
      languages.map((l) => ({
        langCd:  l.langCd,
        langNm:  l.langNm,
        trslLtr: master.trsl[l.langCd] ?? '',
      })),
    [languages],
  );

  // ── 핸들러 ────────────────────────────────────────────────────────────────

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

  /** 검색 조건만 비운다 — 그리드/폼 상태는 유지 */
  const handleFilterReset = useCallback(() => {
    setFilterScrnId('');
    setFilterLblCd('');
    setFilterLblSeCd(undefined);
  }, []);

  const handleRowClick = useCallback((row: LblMaster) => {
    setSelected(row);
    // 기존 적재분(lbl.menu.* 등)은 키 조립 규약을 따르지 않으므로 역파싱하지 않는다.
    // 편집 모드에서는 PK 3개를 있는 그대로 보여주고 라벨설명만 수정한다.
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

  /** 신규 등록 모드에서만 키를 자동 조립한다 */
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

  /** 라벨 저장 — 번역 없이 LANG_LBL 만 upsert */
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
          // onError 를 달지 않는다 — 에러 토스트는 apiClient 인터셉터가 이미 띄운다(중복 방지).
          // 화면 고유 문구가 필요하면 요청에 `skipErrorToast: true` 를 주고 여기서 처리한다.
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

  /** 라벨 삭제 — 번역까지 함께 지워진다 */
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

  /** 번역 저장 — 변경된 언어 행만 전송 */
  const handleTrnSave = useCallback(() => {
    if (!selected) return;
    const dirty = trnRows.filter((r) => r._dirty);
    if (dirty.length === 0) { toast.warning(tsm('noChanges', '변경된 내용이 없습니다.')); return; }

    dialog.confirm({
      content: formatLabel(tsm('trnSaveConfirm', '번역 {0}건을 저장하시겠습니까?'), dirty.length),
      onOk: () => {
        // lblExpln 을 함께 보내지 않으면 서버의 라벨 upsert 가 라벨설명을 빈값으로 덮어쓴다.
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

  // ── 컬럼 ──────────────────────────────────────────────────────────────────

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

  // 셀렉트 표시 문구는 "코드 — 설명" 형태다. 코드는 그대로 두고 설명만 번역한다.
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

      {/* ── 검색 필터 */}
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

      {/* ── 좌우 분할 그리드
          레이아웃은 SplitPanel 이 전담한다 — 화면에서 flex 를 다시 짜지 않는다.
          영역 제목도 별도 줄을 얹지 않고 GridPanel 의 `title` 슬롯(= 툴바 좌측)에 넣는다.
          그래야 좌우 툴바 높이가 저절로 맞는다. */}
      <div className="page-body">
        <SplitPanel direction="horizontal" defaultRatio={0.6} primaryMinSize={320} secondaryMinSize={280}>

          {/* 좌: 라벨 목록 */}
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

          {/* 우: 언어별 번역 */}
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

      {/* ── 하단 입력 폼 (라벨 등록/수정) */}
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
            {/* 좌: 화면ID / 섹션 / 라벨구분 / 세부코드 / 라벨코드 */}
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

            {/* 우: 라벨설명 (두 행에 걸쳐 표시) */}
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
