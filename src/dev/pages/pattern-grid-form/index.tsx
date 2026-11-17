import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Button, Form, Select, Row, Col, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import GridPanel from '@/components/grid/GridPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import TipInput from '@/components/inputs/TipInput';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectOption, SearchSelectValue } from '@/components/inputs/SearchSelectField';
import { useNotify } from '@/hooks/useNotify';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

// ── Types ────────────────────────────────────────────────────────────────────

type MockMnu = {
  mnuId: string;
  mnuNm: string;
  upMnuId: string;
  mnuRank: number;
  sceId: string;
  sceNm: string;
  mnuLevRank: number;
  sceXrsYn: 'Y' | 'N';
  mnuXrsYn: 'Y' | 'N';
  labelKey: string;
  bzLrgCzCd: string;
};

type FormValues = Omit<MockMnu, 'sceId' | 'sceNm' | 'mnuLevRank'> & {
  sceId?: SearchSelectValue | null;
};

// ── Constants ────────────────────────────────────────────────────────────────

const BZ_OPTIONS = [
  { value: 'SYS', label: 'System' },
  { value: 'PRJ', label: 'Project' },
  { value: 'RSC', label: 'Resources' },
  { value: 'RPT', label: 'Reports' },
];

const YN_OPTIONS = [
  { value: 'Y', label: 'Yes (Y)' },
  { value: 'N', label: 'No (N)' },
];

// Mock screen list — static options used instead of SceSelectField
const MOCK_SCREENS: SearchSelectOption[] = [
  { value: 'SYS010101SC', label: 'User management',   bzLrgCzCd: 'SYS' },
  { value: 'SYS010201SC', label: 'Common code management', bzLrgCzCd: 'SYS' },
  { value: 'SYS030101SC', label: 'Menu management',    bzLrgCzCd: 'SYS' },
  { value: 'PRJ101001SC', label: 'Project list', bzLrgCzCd: 'PRJ' },
  { value: 'PRJ102001SC', label: 'Task management',    bzLrgCzCd: 'PRJ' },
  { value: 'PRJ103001SC', label: 'Schedule management',    bzLrgCzCd: 'PRJ' },
  { value: 'RSC101001SC', label: 'Headcount status',    bzLrgCzCd: 'RSC' },
  { value: 'RSC102001SC', label: 'Cost status',    bzLrgCzCd: 'RSC' },
  { value: 'RPT101001SC', label: 'Monthly report',  bzLrgCzCd: 'RPT' },
  { value: 'RPT102001SC', label: 'Quarterly report', bzLrgCzCd: 'RPT' },
];

const SCE_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: 'Area',   dataIndex: 'bzLrgCzCd', key: 'bzLrgCzCd', width: 80,  ellipsis: true },
  { title: 'Screen name', dataIndex: 'label',     key: 'label',     ellipsis: true },
  { title: 'Screen ID', dataIndex: 'value',     key: 'value',     width: 150, ellipsis: true },
];

const INITIAL_DATA: MockMnu[] = [
  { mnuId: '100000', mnuNm: 'System management', upMnuId: '',       mnuRank: 1, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.TITLE', bzLrgCzCd: 'SYS' },
  { mnuId: '100100', mnuNm: 'User management', upMnuId: '100000', mnuRank: 1, sceId: 'SYS010101SC', sceNm: 'User management', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.USR',   bzLrgCzCd: 'SYS' },
  { mnuId: '100200', mnuNm: 'Menu management', upMnuId: '100000', mnuRank: 2, sceId: 'SYS030101SC', sceNm: 'Menu management', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.MNU',   bzLrgCzCd: 'SYS' },
  { mnuId: '100300', mnuNm: 'Common code management', upMnuId: '100000', mnuRank: 3, sceId: 'SYS010201SC', sceNm: 'Common code management', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.CD',    bzLrgCzCd: 'SYS' },
  { mnuId: '200000', mnuNm: 'Project management', upMnuId: '',       mnuRank: 2, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.PRJ.TITLE', bzLrgCzCd: 'PRJ' },
  { mnuId: '200100', mnuNm: 'Project list', upMnuId: '200000', mnuRank: 1, sceId: 'PRJ101001SC', sceNm: 'Project list', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.PRJ.LIST',  bzLrgCzCd: 'PRJ' },
  { mnuId: '200200', mnuNm: 'Task management', upMnuId: '200000', mnuRank: 2, sceId: 'PRJ102001SC', sceNm: 'Task management', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.PRJ.TASK',  bzLrgCzCd: 'PRJ' },
  { mnuId: '200300', mnuNm: 'Schedule management', upMnuId: '200000', mnuRank: 3, sceId: 'PRJ103001SC', sceNm: 'Schedule management', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'N', labelKey: 'MNU.PRJ.SCH',   bzLrgCzCd: 'PRJ' },
  { mnuId: '300000', mnuNm: 'Resource management', upMnuId: '',       mnuRank: 3, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.RSC.TITLE', bzLrgCzCd: 'RSC' },
  { mnuId: '300100', mnuNm: 'Headcount status', upMnuId: '300000', mnuRank: 1, sceId: 'RSC101001SC', sceNm: 'Headcount status', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.RSC.HR',    bzLrgCzCd: 'RSC' },
  { mnuId: '300200', mnuNm: 'Cost status', upMnuId: '300000', mnuRank: 2, sceId: 'RSC102001SC', sceNm: 'Cost status', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'N', labelKey: 'MNU.RSC.COST',  bzLrgCzCd: 'RSC' },
  { mnuId: '400000', mnuNm: 'Reports', upMnuId: '',       mnuRank: 4, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.RPT.TITLE', bzLrgCzCd: 'RPT' },
  { mnuId: '400100', mnuNm: 'Monthly report', upMnuId: '400000', mnuRank: 1, sceId: 'RPT101001SC', sceNm: 'Monthly report', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.RPT.MON',   bzLrgCzCd: 'RPT' },
  { mnuId: '400200', mnuNm: 'Quarterly report', upMnuId: '400000', mnuRank: 2, sceId: 'RPT102001SC', sceNm: 'Quarterly report', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.RPT.QRT',   bzLrgCzCd: 'RPT' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function PatternGridForm() {
  const { notify, dialog } = useNotify();

  // Filter state
  const [filterBzLrgCzCd, setFilterBzLrgCzCd] = useState('');
  const [filterMnuId, setFilterMnuId]           = useState('');
  const [filterMnuNm, setFilterMnuNm]           = useState('');
  const [appliedFilter, setAppliedFilter]       = useState({ bzLrgCzCd: '', mnuId: '', mnuNm: '' });
  const [hasSearched, setHasSearched]           = useState(false);

  // Mock data state
  const [dataList, setDataList] = useState<MockMnu[]>(INITIAL_DATA);

  // Form state
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow]     = useState<MockMnu | null>(null);
  const [form]                            = Form.useForm<FormValues>();
  const gridRef                           = useRef<AgGridReact<MockMnu>>(null);

  const isEditMode = selectedRow !== null;

  // ── Filtered data (local, no API) ─────────────────────────────────────────

  const filteredList = useMemo(() => {
    if (!hasSearched) return [];
    return dataList.filter((item) => {
      if (appliedFilter.bzLrgCzCd && item.bzLrgCzCd !== appliedFilter.bzLrgCzCd) return false;
      if (appliedFilter.mnuId && !item.mnuId.includes(appliedFilter.mnuId)) return false;
      if (appliedFilter.mnuNm && !item.mnuNm.includes(appliedFilter.mnuNm)) return false;
      return true;
    });
  }, [hasSearched, dataList, appliedFilter]);

  // ── Column definitions ────────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<MockMnu>[]>(() => [
    { field: 'mnuId',      headerName: 'Menu ID',   width: 90,  flex: 0 },
    {
      field: 'mnuNm', headerName: 'Menu name', minWidth: 200,
      valueFormatter: ({ data }) =>
        data ? '\u00A0'.repeat(((data.mnuLevRank ?? 1) - 1) * 4) + (data.mnuNm ?? '') : '',
    },
    { field: 'upMnuId',    headerName: 'Parent menu ID', width: 100, flex: 0 },
    { field: 'mnuRank',    headerName: 'Order',   width: 90,  flex: 0 },
    { field: 'sceId',      headerName: 'Screen ID', width: 140, flex: 0 },
    { field: 'sceNm',      headerName: 'Screen name', minWidth: 180 },
    { field: 'mnuLevRank', headerName: 'Level',   width: 90,  flex: 0 },
    {
      field: 'sceXrsYn', headerName: 'Show screen', width: 90, flex: 0,
      cellRenderer: ({ value }: ICellRendererParams<MockMnu>) => (
        <Tag color={value === 'Y' ? 'green' : 'default'}>{value}</Tag>
      ),
    },
    {
      field: 'mnuXrsYn', headerName: 'Show menu', width: 90, flex: 0,
      cellRenderer: ({ value }: ICellRendererParams<MockMnu>) => (
        <Tag color={value === 'Y' ? 'blue' : 'default'}>{value}</Tag>
      ),
    },
    { field: 'labelKey',   headerName: 'Label key', minWidth: 220 },
    {
      field: 'bzLrgCzCd', headerName: 'Area', width: 80, flex: 0,
      valueFormatter: ({ value }) => BZ_OPTIONS.find((o) => o.value === value)?.label ?? value,
    },
  ], []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setAppliedFilter({ bzLrgCzCd: filterBzLrgCzCd, mnuId: filterMnuId, mnuNm: filterMnuNm });
  }, [filterBzLrgCzCd, filterMnuId, filterMnuNm]);

  const handleFilterReset = useCallback(() => {
    setFilterBzLrgCzCd('');
    setFilterMnuId('');
    setFilterMnuNm('');
    setAppliedFilter({ bzLrgCzCd: '', mnuId: '', mnuNm: '' });
    setHasSearched(false);
  }, []);

  const handleRowClick = useCallback((row: MockMnu) => {
    setSelectedRow(row);
    form.setFieldsValue({
      bzLrgCzCd: row.bzLrgCzCd,
      mnuId:     row.mnuId,
      mnuNm:     row.mnuNm?.trim(),
      upMnuId:   row.upMnuId,
      mnuRank:   row.mnuRank,
      sceId:     row.sceId ? { label: row.sceNm || row.sceId, value: row.sceId } : null,
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
      dialog.confirm({
        content: isEditMode ? 'Save these changes?' : 'Register this menu?',
        onOk: () => {
          const { sceId: sceVal, ...rest } = values;
          const sceIdStr = sceVal?.value ?? '';
          const sceNmStr = sceVal?.label ?? '';
          if (isEditMode) {
            setDataList((prev) =>
              prev.map((item) =>
                item.mnuId === rest.mnuId
                  ? { ...item, ...rest, sceId: sceIdStr, sceNm: sceNmStr, mnuRank: Number(rest.mnuRank) }
                  : item,
              ),
            );
            notify.success('Updated.');
          } else {
            if (dataList.some((item) => item.mnuId === rest.mnuId)) {
              notify.error('That menu ID already exists.');
              return;
            }
            const upMnu = dataList.find((item) => item.mnuId === rest.upMnuId);
            const newItem: MockMnu = {
              ...rest,
              sceId:      sceIdStr,
              sceNm:      sceNmStr,
              mnuRank:    Number(rest.mnuRank),
              mnuLevRank: upMnu ? upMnu.mnuLevRank + 1 : 1,
            };
            setDataList((prev) => [...prev, newItem]);
            notify.success('Registered.');
            handleFormReset();
          }
        },
      });
    }).catch(() => {
      notify.error('Please fill in the required fields.');
    });
  }, [form, isEditMode, dialog, dataList, notify, handleFormReset]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: `${selectedRow.mnuNm}(${selectedRow.mnuId})? This cannot be undone.`,
      okButtonProps: { danger: true },
      onOk: () => {
        setDataList((prev) => prev.filter((item) => item.mnuId !== selectedRow.mnuId));
        notify.success('Deleted.');
        handleFormReset();
      },
    });
  }, [selectedRow, dialog, notify, handleFormReset]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── Search filter */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={[filterBzLrgCzCd, filterMnuId, filterMnuNm].filter(Boolean).length}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Area</span>
          <Select
            options={[{ value: '', label: 'All' }, ...BZ_OPTIONS]}
            value={filterBzLrgCzCd}
            onChange={(v) => setFilterBzLrgCzCd(v ?? '')}
            style={{ width: '100%' }}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Menu ID</span>
          <Input
            value={filterMnuId}
            onChange={(e) => setFilterMnuId(e.target.value.replace(/\D/g, ''))}
            onPressEnter={handleSearch}
            maxLength={6}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Menu name</span>
          <Input
            value={filterMnuNm}
            onChange={(e) => setFilterMnuNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* ── Grid panel */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<MockMnu>
          totalCount={filteredList.length}
          columnDefs={columnDefs}
          rowData={filteredList}
          rowKey="mnuId"
          gridRef={gridRef}
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          defaultColDef={{ suppressHeaderMenuButton: false, suppressHeaderFilterButton: false }}
        />
      </div>

      {/* ── Input form panel at the bottom */}
      <FormPanel
        title="Input details"
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleFormReset}>Reset</Button>
            <VerticalDivider />
            <Button size="middle" type="primary" onClick={handleSave}>Save</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>Delete</Button>
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
                label="Area"
                name="bzLrgCzCd"
                initialValue=""
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <Select options={[{ value: '', label: 'Select' }, ...BZ_OPTIONS]} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Menu ID"
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
                label="Menu name"
                name="mnuNm"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={60} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Parent menu ID"
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
                label="Order"
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
                label="Screen ID"
                name="sceId"
                style={{ margin: '0 0 8px' }}
              >
                <SearchSelectField
                  options={MOCK_SCREENS}
                  columns={SCE_COLUMNS}
                  modalTitle="Search screens"
                  modalWidth={560}
                  modalSearchFields={['label', 'value', 'bzLrgCzCd']}
                  placeholder="Select a screen"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Show screen"
                name="sceXrsYn"
                initialValue="Y"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <Select options={YN_OPTIONS} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Show menu"
                name="mnuXrsYn"
                initialValue="Y"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <Select options={YN_OPTIONS} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item
                label="Label key"
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
