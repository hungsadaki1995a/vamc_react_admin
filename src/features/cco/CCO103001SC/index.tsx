/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Button, Form, Row, Col, Space } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import { ComcdSelectCellRenderer } from '@/components/grid/ComcdSelectCell';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getSceList, saveSce, deleteSce } from './api';
import type { ColDef } from 'ag-grid-community';
import type { Sce, SceSaveReq } from './api';
import { useNotify } from '@/hooks/useNotify';

// Screen ID validation: 화면 = 3 uppercase + 6 digits + SC (e.g. CCO103001SC)
//                       팝업 = 3 uppercase + 7 digits + P  (e.g. CCO1010011P)
const SCE_ID_PATTERN = /^[A-Z]{3}(\d{6}SC|\d{7}P)$/;

export default function CCO103001SC() {
  const { notify, dialog } = useNotify();
  const { tvt, tvb, tsg, tmc, tmi, labels } = useScreenLabel();

  // Filter state
  const [filterBzLrgCzCd, setFilterBzLrgCzCd] = useState('');
  const [filterSceId, setFilterSceId]         = useState('');
  const [filterSceNm, setFilterSceNm]         = useState('');
  const [appliedFilter, setAppliedFilter]     = useState({ bzLrgCzCd: '', sceId: '', sceNm: '' });
  const [searched, setSearched]               = useState(false);

  // Form state
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow]     = useState<Sce | null>(null);
  const [form]                            = Form.useForm<SceSaveReq>();
  const gridRef                           = useRef<AgGridReact<Sce>>(null);

  const isEditMode = selectedRow !== null;

  // ── API ─────────────────────────────────────────────────────────────────

  const { data: sceList = [], isLoading, refetch } = useApiQuery<Sce[]>(
    ['sce', 'list', appliedFilter],
    () => getSceList(appliedFilter),
    { enabled: searched },
  );

  const saveMutation = useApiMutation<void, SceSaveReq>(saveSce);
  const deleteMutation = useApiMutation<void, { bzLrgCzCd: string; sceId: string }>(
    ({ bzLrgCzCd, sceId }) => deleteSce(bzLrgCzCd, sceId),
  );

  // ── Column definitions ───────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<Sce>[]>(() => [
    {
      field: 'bzLrgCzCd', headerName: tsg('bzLrgCzCd'), width: 120, flex: 0,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'BZ_LRG_CZ_CD' },
    },
    { field: 'sceId',   headerName: tsg('sceId'),    width: 150, flex: 0 },
    { field: 'sceNm',   headerName: tsg('sceNm'),    minWidth: 200 },
    { field: 'labelNm', headerName: tsg('labelNm'),  minWidth: 200 },
    { field: 'labelKey',headerName: tsg('labelKey'), minWidth: 250 },
    {
      field: 'popupYn', headerName: tsg('popupYn'), width: 90, flex: 0,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'YN' },
    },
    { field: 'mrCont', headerName: tsg('mrCont'), minWidth: 200 },
  ], [labels]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setSearched(true);
    setAppliedFilter({ bzLrgCzCd: filterBzLrgCzCd, sceId: filterSceId, sceNm: filterSceNm });
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [filterBzLrgCzCd, filterSceId, filterSceNm, form]);

  const handleFilterReset = useCallback(() => {
    setFilterBzLrgCzCd('');
    setFilterSceId('');
    setFilterSceNm('');
    setAppliedFilter({ bzLrgCzCd: '', sceId: '', sceNm: '' });
  }, []);

  const handleRowClick = useCallback((row: Sce) => {
    setSelectedRow(row);
    form.setFieldsValue({
      bzLrgCzCd: row.bzLrgCzCd,
      sceId:     row.sceId,
      sceNm:     row.sceNm,
      popupYn:   row.popupYn,
      labelKey:  row.labelKey,
      mrCont:    row.mrCont,
    });
    if (formCollapsed) setFormCollapsed(false);
  }, [form, formCollapsed]);

  const handleFormReset = useCallback(() => {
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [form]);

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      // Screen ID format validation (new mode only)
      if (!isEditMode && !SCE_ID_PATTERN.test(values.sceId)) {
        notify.error('화면ID 형식이 올바르지 않습니다. (화면: CCO103001SC, 팝업: CCO1010011P)');
        return;
      }
      dialog.confirm({
        content: isEditMode ? tmc('C100002') : tmc('C100001'),
        onOk: () => {
          saveMutation.mutate({ ...values, newYn: !isEditMode }, {
            onSuccess: () => {
              notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
              if (!isEditMode) handleFormReset();
              refetch();
            },
            onError: (err) => notify.error(err.message),
          });
        },
      });
    }).catch(() => {
      notify.error('필수 항목을 입력해 주세요.');
    });
  }, [form, isEditMode, dialog, saveMutation, notify, tmc, tmi, handleFormReset, refetch]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: tmc('C100003'),
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutation.mutate(
          { bzLrgCzCd: selectedRow.bzLrgCzCd, sceId: selectedRow.sceId },
          {
            onSuccess: () => {
              notify.success(tmi('I100004'));
              handleFormReset();
              refetch();
            },
            onError: (err) => notify.error(err.message),
          },
        );
      },
    });
  }, [selectedRow, dialog, deleteMutation, notify, tmc, tmi, handleFormReset, refetch]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={[filterBzLrgCzCd, filterSceId, filterSceNm].filter(Boolean).length}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('bzLrgCzCd', '업무')}</span>
          <ComcdSelect
            cdDmnId="BZ_LRG_CZ_CD"
            prefixOption="전체"
            value={filterBzLrgCzCd}
            onChange={(v) => setFilterBzLrgCzCd((v as string) ?? '')}
            style={{ width: '100%' }}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('sceId', '화면ID')}</span>
          <Input
            value={filterSceId}
            onChange={(e) => setFilterSceId(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('sceNm', '화면명')}</span>
          <Input
            value={filterSceNm}
            onChange={(e) => setFilterSceNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* ── 그리드 패널 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<Sce>
          totalCount={sceList.length}
          columnDefs={columnDefs}
          rowData={sceList}
          rowKey="sceId"
          gridRef={gridRef}
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          loading={isLoading}
          defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
        />
      </div>

      {/* ── 하단 입력 폼 패널 */}
      <FormPanel
        title={tvt('input', '입력 정보')}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleFormReset}>{tvb('btnInit2', '초기화')}</Button>
            <VerticalDivider />
            <Button size="middle" type="primary" onClick={handleSave}>{tvb('btnMer', '저장')}</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>
              {tvb('btnDel', '삭제')}
            </Button>
            <VerticalDivider />
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ style: { width: 80, textAlign: 'right' } }}
          wrapperCol={{ style: { flex: 1, minWidth: 0 } }}
        >
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item
                label={tvt('bzLrgCzCd', '업무')}
                name="bzLrgCzCd"
                initialValue=""
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <ComcdSelect cdDmnId="BZ_LRG_CZ_CD" prefixOption="선택" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('sceId', '화면ID')}
                name="sceId"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <Input
                  readOnly={isEditMode}
                  maxLength={20}
                  placeholder="CCO103001SC / CCO1010011P"
                  style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('sceNm', '화면명')}
                name="sceNm"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <Input maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('popupYn', '팝업 여부')}
                name="popupYn"
                initialValue=""
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <ComcdSelect cdDmnId="YN" prefixOption="선택" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item
                label={tvt('labelKey', '라벨키')}
                name="labelKey"
                style={{ margin: 0 }}
              >
                <Input maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('mrCont', '비고')}
                name="mrCont"
                style={{ margin: 0 }}
              >
                <Input maxLength={50} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>
    </div>
  );
}
