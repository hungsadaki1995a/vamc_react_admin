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
  { value: 'SYS', label: '시스템' },
  { value: 'PRJ', label: '프로젝트' },
  { value: 'RSC', label: '자원' },
  { value: 'RPT', label: '보고서' },
];

const YN_OPTIONS = [
  { value: 'Y', label: '예(Y)' },
  { value: 'N', label: '아니오(N)' },
];

// Mock 화면 목록 — SceSelectField 대신 정적 옵션으로 사용
const MOCK_SCREENS: SearchSelectOption[] = [
  { value: 'CCO101001SC', label: '사용자관리',   bzLrgCzCd: 'SYS' },
  { value: 'CCO102001SC', label: '공통코드관리', bzLrgCzCd: 'SYS' },
  { value: 'CCO103002SC', label: '메뉴관리',    bzLrgCzCd: 'SYS' },
  { value: 'PRJ101001SC', label: '프로젝트목록', bzLrgCzCd: 'PRJ' },
  { value: 'PRJ102001SC', label: '업무관리',    bzLrgCzCd: 'PRJ' },
  { value: 'PRJ103001SC', label: '일정관리',    bzLrgCzCd: 'PRJ' },
  { value: 'RSC101001SC', label: '인력현황',    bzLrgCzCd: 'RSC' },
  { value: 'RSC102001SC', label: '비용현황',    bzLrgCzCd: 'RSC' },
  { value: 'RPT101001SC', label: '월별보고서',  bzLrgCzCd: 'RPT' },
  { value: 'RPT102001SC', label: '분기별보고서', bzLrgCzCd: 'RPT' },
];

const SCE_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: '업무',   dataIndex: 'bzLrgCzCd', key: 'bzLrgCzCd', width: 80,  ellipsis: true },
  { title: '화면명', dataIndex: 'label',     key: 'label',     ellipsis: true },
  { title: '화면ID', dataIndex: 'value',     key: 'value',     width: 150, ellipsis: true },
];

const INITIAL_DATA: MockMnu[] = [
  { mnuId: '100000', mnuNm: '시스템 관리',   upMnuId: '',       mnuRank: 1, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.TITLE', bzLrgCzCd: 'SYS' },
  { mnuId: '100100', mnuNm: '사용자 관리',   upMnuId: '100000', mnuRank: 1, sceId: 'CCO101001SC', sceNm: '사용자관리',  mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.USR',   bzLrgCzCd: 'SYS' },
  { mnuId: '100200', mnuNm: '메뉴 관리',     upMnuId: '100000', mnuRank: 2, sceId: 'CCO103002SC', sceNm: '메뉴관리',   mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.MNU',   bzLrgCzCd: 'SYS' },
  { mnuId: '100300', mnuNm: '공통코드 관리', upMnuId: '100000', mnuRank: 3, sceId: 'CCO102001SC', sceNm: '공통코드관리', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.SYS.CD',    bzLrgCzCd: 'SYS' },
  { mnuId: '200000', mnuNm: '프로젝트 관리', upMnuId: '',       mnuRank: 2, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.PRJ.TITLE', bzLrgCzCd: 'PRJ' },
  { mnuId: '200100', mnuNm: '프로젝트 목록', upMnuId: '200000', mnuRank: 1, sceId: 'PRJ101001SC', sceNm: '프로젝트목록', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.PRJ.LIST',  bzLrgCzCd: 'PRJ' },
  { mnuId: '200200', mnuNm: '업무 관리',     upMnuId: '200000', mnuRank: 2, sceId: 'PRJ102001SC', sceNm: '업무관리',   mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.PRJ.TASK',  bzLrgCzCd: 'PRJ' },
  { mnuId: '200300', mnuNm: '일정 관리',     upMnuId: '200000', mnuRank: 3, sceId: 'PRJ103001SC', sceNm: '일정관리',   mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'N', labelKey: 'MNU.PRJ.SCH',   bzLrgCzCd: 'PRJ' },
  { mnuId: '300000', mnuNm: '자원 관리',     upMnuId: '',       mnuRank: 3, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.RSC.TITLE', bzLrgCzCd: 'RSC' },
  { mnuId: '300100', mnuNm: '인력 현황',     upMnuId: '300000', mnuRank: 1, sceId: 'RSC101001SC', sceNm: '인력현황',   mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.RSC.HR',    bzLrgCzCd: 'RSC' },
  { mnuId: '300200', mnuNm: '비용 현황',     upMnuId: '300000', mnuRank: 2, sceId: 'RSC102001SC', sceNm: '비용현황',   mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'N', labelKey: 'MNU.RSC.COST',  bzLrgCzCd: 'RSC' },
  { mnuId: '400000', mnuNm: '보고서',        upMnuId: '',       mnuRank: 4, sceId: '',            sceNm: '',        mnuLevRank: 1, sceXrsYn: 'N', mnuXrsYn: 'Y', labelKey: 'MNU.RPT.TITLE', bzLrgCzCd: 'RPT' },
  { mnuId: '400100', mnuNm: '월별 보고서',   upMnuId: '400000', mnuRank: 1, sceId: 'RPT101001SC', sceNm: '월별보고서',  mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.RPT.MON',   bzLrgCzCd: 'RPT' },
  { mnuId: '400200', mnuNm: '분기별 보고서', upMnuId: '400000', mnuRank: 2, sceId: 'RPT102001SC', sceNm: '분기별보고서', mnuLevRank: 2, sceXrsYn: 'Y', mnuXrsYn: 'Y', labelKey: 'MNU.RPT.QRT',   bzLrgCzCd: 'RPT' },
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
    { field: 'mnuId',      headerName: '메뉴ID',    width: 90,  flex: 0 },
    {
      field: 'mnuNm', headerName: '메뉴명', minWidth: 200,
      valueFormatter: ({ data }) =>
        data ? '\u00A0'.repeat(((data.mnuLevRank ?? 1) - 1) * 4) + (data.mnuNm ?? '') : '',
    },
    { field: 'upMnuId',    headerName: '상위메뉴ID', width: 100, flex: 0 },
    { field: 'mnuRank',    headerName: '메뉴순서',   width: 90,  flex: 0 },
    { field: 'sceId',      headerName: '화면ID',    width: 140, flex: 0 },
    { field: 'sceNm',      headerName: '화면명',    minWidth: 180 },
    { field: 'mnuLevRank', headerName: '메뉴레벨',   width: 90,  flex: 0 },
    {
      field: 'sceXrsYn', headerName: '화면보기', width: 90, flex: 0,
      cellRenderer: ({ value }: ICellRendererParams<MockMnu>) => (
        <Tag color={value === 'Y' ? 'green' : 'default'}>{value}</Tag>
      ),
    },
    {
      field: 'mnuXrsYn', headerName: '메뉴표시', width: 90, flex: 0,
      cellRenderer: ({ value }: ICellRendererParams<MockMnu>) => (
        <Tag color={value === 'Y' ? 'blue' : 'default'}>{value}</Tag>
      ),
    },
    { field: 'labelKey',   headerName: '라벨키',    minWidth: 220 },
    {
      field: 'bzLrgCzCd', headerName: '업무', width: 80, flex: 0,
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
        content: isEditMode ? '수정하시겠습니까?' : '등록하시겠습니까?',
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
            notify.success('수정되었습니다.');
          } else {
            if (dataList.some((item) => item.mnuId === rest.mnuId)) {
              notify.error('이미 존재하는 메뉴ID입니다.');
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
            notify.success('등록되었습니다.');
            handleFormReset();
          }
        },
      });
    }).catch(() => {
      notify.error('필수 항목을 입력해 주세요.');
    });
  }, [form, isEditMode, dialog, dataList, notify, handleFormReset]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: `${selectedRow.mnuNm}(${selectedRow.mnuId})을(를) 삭제하시겠습니까?`,
      okButtonProps: { danger: true },
      onOk: () => {
        setDataList((prev) => prev.filter((item) => item.mnuId !== selectedRow.mnuId));
        notify.success('삭제되었습니다.');
        handleFormReset();
      },
    });
  }, [selectedRow, dialog, notify, handleFormReset]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={[filterBzLrgCzCd, filterMnuId, filterMnuNm].filter(Boolean).length}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">업무</span>
          <Select
            options={[{ value: '', label: '전체' }, ...BZ_OPTIONS]}
            value={filterBzLrgCzCd}
            onChange={(v) => setFilterBzLrgCzCd(v ?? '')}
            style={{ width: '100%' }}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">메뉴ID</span>
          <Input
            value={filterMnuId}
            onChange={(e) => setFilterMnuId(e.target.value.replace(/\D/g, ''))}
            onPressEnter={handleSearch}
            maxLength={6}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">메뉴명</span>
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
        <GridPanel<MockMnu>
          totalCount={filteredList.length}
          columnDefs={columnDefs}
          rowData={filteredList}
          rowKey="mnuId"
          gridRef={gridRef}
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
        />
      </div>

      {/* ── 하단 입력 폼 패널 */}
      <FormPanel
        title="입력 정보"
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
          labelCol={{ style: { width: 96, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' } }}
          wrapperCol={{ style: { flex: 1, minWidth: 0 } }}
        >
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item
                label="업무"
                name="bzLrgCzCd"
                initialValue=""
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <Select options={[{ value: '', label: '선택' }, ...BZ_OPTIONS]} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="메뉴ID"
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
                label="메뉴명"
                name="mnuNm"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={60} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="상위메뉴ID"
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
                label="메뉴순서"
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
                label="화면ID"
                name="sceId"
                style={{ margin: '0 0 8px' }}
              >
                <SearchSelectField
                  options={MOCK_SCREENS}
                  columns={SCE_COLUMNS}
                  modalTitle="화면 검색"
                  modalWidth={560}
                  modalSearchFields={['label', 'value', 'bzLrgCzCd']}
                  placeholder="화면 선택"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="화면보기여부"
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
                label="메뉴표시여부"
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
                label="라벨키"
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
