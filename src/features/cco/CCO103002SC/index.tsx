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
import SceSelectField from '@/components/inputs/selectors/SceSelectField';
import TipInput from '@/components/inputs/TipInput';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useMenuStore } from '@/stores/menuStore';
import { getMnuList, saveMnu, deleteMnu } from './api';
import type { ColDef } from 'ag-grid-community';
import type { Mnu, MnuSaveReq } from './api';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';
import { useNotify } from '@/hooks/useNotify';

type MnuFormValues = Omit<MnuSaveReq, 'sceId'> & { sceId?: SearchSelectValue | null };

export default function CCO103002SC() {
  const { notify, dialog } = useNotify();
  const { tvt, tvb, tsg, tmc, tmi, labels } = useScreenLabel();
  const loadMenuForProject = useMenuStore((s) => s.loadMenuForProject);
  const clearServerMenus   = useMenuStore((s) => s.clearServerMenus);

  // Filter state
  const [filterBzLrgCzCd, setFilterBzLrgCzCd] = useState('');
  const [filterMnuId, setFilterMnuId]           = useState('');
  const [filterMnuNm, setFilterMnuNm]           = useState('');
  const [appliedFilter, setAppliedFilter]       = useState({ bzLrgCzCd: '', mnuId: '', mnuNm: '' });
  const [searched, setSearched]                 = useState(false);

  // Form state
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow]     = useState<Mnu | null>(null);
  const [form]                            = Form.useForm<MnuFormValues>();
  const gridRef                           = useRef<AgGridReact<Mnu>>(null);

  const isEditMode = selectedRow !== null;

  // ── API ─────────────────────────────────────────────────────────────────

  const { data: mnuList = [], isLoading, refetch } = useApiQuery<Mnu[]>(
    ['mnu', 'list', appliedFilter],
    () => getMnuList(appliedFilter),
    { enabled: searched },
  );

  const saveMutation   = useApiMutation<void, MnuSaveReq>(saveMnu);
  const deleteMutation = useApiMutation<void, { bzLrgCzCd: string; mnuId: string }>(
    ({ bzLrgCzCd, mnuId }) => deleteMnu(bzLrgCzCd, mnuId),
  );

  // ── Column definitions ───────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<Mnu>[]>(() => [
    { field: 'mnuId',      headerName: tsg('mnuId',      '메뉴ID'),     width: 90,  flex: 0 },
    {
      field: 'mnuNm', headerName: tsg('mnuNm', '메뉴명'), minWidth: 200,
      valueFormatter: ({ data }) =>
        data ? '\u00A0'.repeat(((data.mnuLevRank ?? 1) - 1) * 4) + (data.mnuNm ?? '') : '',
    },
    { field: 'labelNm',    headerName: tsg('labelNm',    '라벨명'),     minWidth: 180 },
    { field: 'upMnuId',    headerName: tsg('upMnuId',    '상위메뉴ID'), width: 100, flex: 0 },
    { field: 'mnuRank',    headerName: tsg('mnuRank',    '메뉴순서'),   width: 90,  flex: 0 },
    { field: 'sceId',      headerName: tsg('sceId',      '화면ID'),     width: 140, flex: 0 },
    { field: 'sceNm',      headerName: tsg('sceNm',      '화면명'),     minWidth: 200 },
    { field: 'mnuLevRank', headerName: tsg('mnuLevRank', '메뉴레벨'),   width: 95,  flex: 0 },
    {
      field: 'sceXrsYn', headerName: tsg('sceXrsYn', '화면보기'), width: 95, flex: 0,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'YN' },
    },
    {
      field: 'mnuXrsYn', headerName: tsg('mnuXrsYn', '메뉴표시'), width: 95, flex: 0,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'YN' },
    },
    { field: 'labelKey', headerName: tsg('labelKey', '라벨키'), minWidth: 250 },
  ], [labels]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setSearched(true);
    setAppliedFilter({ bzLrgCzCd: filterBzLrgCzCd, mnuId: filterMnuId, mnuNm: filterMnuNm });
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [filterBzLrgCzCd, filterMnuId, filterMnuNm, form]);

  const handleFilterReset = useCallback(() => {
    setFilterBzLrgCzCd('');
    setFilterMnuId('');
    setFilterMnuNm('');
    setAppliedFilter({ bzLrgCzCd: '', mnuId: '', mnuNm: '' });
  }, []);

  const handleRowClick = useCallback((row: Mnu) => {
    setSelectedRow(row);
    form.setFieldsValue({
      bzLrgCzCd: row.bzLrgCzCd,
      mnuId:     row.mnuId,
      mnuNm:     row.mnuNm?.trim(),
      upMnuId:   row.upMnuId,
      mnuRank:   row.mnuRank,
      sceId:     row.sceId ? { label: row.sceNm ?? row.sceId, value: row.sceId } : null,
      sceXrsYn:  row.sceXrsYn,
      mnuXrsYn:  row.mnuXrsYn,
      labelKey:  row.labelKey,
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
      const { sceId: sceVal, ...rest } = values;
      const req: MnuSaveReq = { ...rest, sceId: sceVal?.value };
      dialog.confirm({
        content: isEditMode ? tmc('C100002') : tmc('C100001'),
        onOk: () => {
          saveMutation.mutate(req, {
            onSuccess: () => {
              notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
              if (!isEditMode) handleFormReset();
              refetch();
              clearServerMenus();
              loadMenuForProject();
            },
            onError: (err) => notify.error(err.message),
          });
        },
      });
    }).catch(() => {
      notify.error('필수 항목을 입력해 주세요.');
    });
  }, [form, isEditMode, dialog, saveMutation, notify, tmc, tmi, handleFormReset, refetch, clearServerMenus, loadMenuForProject]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: tmc('C100003'),
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutation.mutate(
          { bzLrgCzCd: selectedRow.bzLrgCzCd, mnuId: selectedRow.mnuId },
          {
            onSuccess: () => {
              notify.success(tmi('I100004'));
              handleFormReset();
              refetch();
              clearServerMenus();
              loadMenuForProject();
            },
            onError: (err) => notify.error(err.message),
          },
        );
      },
    });
  }, [selectedRow, dialog, deleteMutation, notify, tmc, tmi, handleFormReset, refetch, clearServerMenus, loadMenuForProject]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={[filterBzLrgCzCd, filterMnuId, filterMnuNm].filter(Boolean).length}
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
          <span className="ds-filter-field-label">{tvt('mnuId', '메뉴ID')}</span>
          <Input
            value={filterMnuId}
            onChange={(e) => setFilterMnuId(e.target.value.replace(/\D/g, ''))}
            onPressEnter={handleSearch}
            maxLength={6}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('mnuNm', '메뉴명')}</span>
          <Input
            value={filterMnuNm}
            onChange={(e) => setFilterMnuNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* ── 그리드 패널 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<Mnu>
          totalCount={mnuList.length}
          columnDefs={columnDefs}
          rowData={mnuList}
          rowKey="mnuId"
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

          labelCol={{ style: { width: 96, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' } }}
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
                label={tvt('mnuId', '메뉴ID')}
                name="mnuId"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  readOnly={isEditMode}
                  maxLength={6}
                  onChange={(e) => form.setFieldValue('mnuId', e.target.value.replace(/\D/g, ''))}
                  style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('mnuNm', '메뉴명')}
                name="mnuNm"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={60} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('upMnuId', '상위메뉴ID')}
                name="upMnuId"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  maxLength={6}
                  onChange={(e) => form.setFieldValue('upMnuId', e.target.value.replace(/\D/g, ''))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item
                label={tvt('mnuRank', '메뉴순서')}
                name="mnuRank"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  maxLength={10}
                  onChange={(e) => form.setFieldValue('mnuRank', e.target.value.replace(/\D/g, ''))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('sceId', '화면ID')}
                name="sceId"
                style={{ margin: '0 0 8px' }}
              >
                <SceSelectField style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('sceXrsYn', '화면보기여부')}
                name="sceXrsYn"
                initialValue="Y"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <ComcdSelect cdDmnId="YN" prefixOption="선택" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('mnuXrsYn', '메뉴표시여부')}
                name="mnuXrsYn"
                initialValue="Y"
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
                <TipInput maxLength={200} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>

    </div>
  );
}
