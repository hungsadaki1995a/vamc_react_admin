import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Button, Form, Row, Col, Space } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import TipInput from '@/components/inputs/TipInput';
import { useNotify } from '@/hooks/useNotify';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MnuResponse } from '@/api/menu';
import type { ColDef } from 'ag-grid-community';

// ── Types ────────────────────────────────────────────────────────────────────

type FormValues = {
  menuCd: string;
  menuNmDisplay: string;
  upMenuCd: string;
  menuSeq: number | string;
  menuDpth: number | string;
  menuUrlAddr: string;
  lblCd: string;
  sortPath: string;
};

// ── API ──────────────────────────────────────────────────────────────────────

async function fetchAllMenus(): Promise<MnuResponse[]> {
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/common/menus/all');
  if (data.status !== 200 || !data.data) return [];
  return data.data;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminMenuManagement() {
  const { notify, dialog } = useNotify();

  // ── Server data ──────────────────────────────────────────────────────────
  const { data: allMenus = [], isLoading } = useQuery({
    queryKey: ['admin', 'menus', 'all'],
    queryFn: fetchAllMenus,
  });

  // ── Filter state ─────────────────────────────────────────────────────────
  const [filterMenuCd, setFilterMenuCd]   = useState('');
  const [filterMenuNm, setFilterMenuNm]   = useState('');
  const [appliedFilter, setAppliedFilter] = useState({ menuCd: '', menuNm: '' });
  const [hasSearched, setHasSearched]     = useState(true);

  // ── Form state ───────────────────────────────────────────────────────────
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow]     = useState<MnuResponse | null>(null);
  const [form]                            = Form.useForm<FormValues>();
  const gridRef                           = useRef<AgGridReact<MnuResponse>>(null);

  const isEditMode = selectedRow !== null;

  // ── Filtered data ────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    if (!hasSearched) return [];
    return allMenus.filter((item) => {
      if (appliedFilter.menuCd && !item.menuCd.includes(appliedFilter.menuCd)) return false;
      if (appliedFilter.menuNm && !item.menuNmDisplay.trim().includes(appliedFilter.menuNm)) return false;
      return true;
    });
  }, [hasSearched, allMenus, appliedFilter]);

  // ── Column definitions ───────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<MnuResponse>[]>(() => [
    { field: 'menuCd',        headerName: '메뉴코드',   width: 130, flex: 0 },
    {
      field: 'menuNmDisplay', headerName: '메뉴명', minWidth: 200,
      valueFormatter: ({ data }) =>
        data ? '\u00A0'.repeat(((data.menuDpth ?? 1) - 1) * 4) + (data.menuNmDisplay?.trim() ?? '') : '',
    },
    { field: 'upMenuCd',      headerName: '상위메뉴코드', width: 130, flex: 0 },
    { field: 'menuSeq',       headerName: '메뉴순서',   width: 90,  flex: 0 },
    { field: 'menuDpth',      headerName: '메뉴레벨',   width: 90,  flex: 0 },
    { field: 'menuUrlAddr',   headerName: '컴포넌트경로', minWidth: 180 },
    { field: 'lblCd',         headerName: '라벨코드',   minWidth: 220 },
    { field: 'sortPath',      headerName: '정렬경로',   width: 120, flex: 0 },
  ], []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setAppliedFilter({ menuCd: filterMenuCd, menuNm: filterMenuNm });
  }, [filterMenuCd, filterMenuNm]);

  const handleFilterReset = useCallback(() => {
    setFilterMenuCd('');
    setFilterMenuNm('');
    setAppliedFilter({ menuCd: '', menuNm: '' });
    setHasSearched(false);
  }, []);

  const handleRowClick = useCallback((row: MnuResponse) => {
    setSelectedRow(row);
    form.setFieldsValue({
      menuCd:       row.menuCd,
      menuNmDisplay: row.menuNmDisplay?.trim(),
      upMenuCd:     row.upMenuCd ?? '',
      menuSeq:      row.menuSeq,
      menuDpth:     row.menuDpth,
      menuUrlAddr:  row.menuUrlAddr ?? '',
      lblCd:        row.lblCd ?? '',
      sortPath:     row.sortPath ?? '',
    });
    if (formCollapsed) setFormCollapsed(false);
  }, [form, formCollapsed]);

  const handleFormReset = useCallback(() => {
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [form]);

  const handleSave = useCallback(() => {
    form.validateFields().then(() => {
      dialog.confirm({
        content: isEditMode ? '수정하시겠습니까?' : '등록하시겠습니까?',
        onOk: () => {
          // TODO: POST/PUT /api/common/menus
          notify.success(isEditMode ? '수정되었습니다.' : '등록되었습니다.');
          if (!isEditMode) handleFormReset();
        },
      });
    }).catch(() => {
      notify.error('필수 항목을 입력해 주세요.');
    });
  }, [form, isEditMode, dialog, notify, handleFormReset]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: `${selectedRow.menuNmDisplay.trim()}(${selectedRow.menuCd})을(를) 삭제하시겠습니까?`,
      okButtonProps: { danger: true },
      onOk: () => {
        // TODO: DELETE /api/common/menus/{menuCd}
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
        activeFilterCount={[filterMenuCd, filterMenuNm].filter(Boolean).length}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">메뉴코드</span>
          <Input
            value={filterMenuCd}
            onChange={(e) => setFilterMenuCd(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">메뉴명</span>
          <Input
            value={filterMenuNm}
            onChange={(e) => setFilterMenuNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* ── 그리드 패널 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<MnuResponse>
          totalCount={filteredList.length}
          columnDefs={columnDefs}
          rowData={filteredList}
          rowKey="menuCd"
          gridRef={gridRef}
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          loading={isLoading}
          defaultColDef={{ suppressHeaderMenuButton: false, suppressHeaderFilterButton: false }}
        />
      </div>

      {/* ── 하단 입력 폼 패널 */}
      <FormPanel
        title="메뉴 정보"
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
                label="메뉴코드"
                name="menuCd"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  readOnly={isEditMode}
                  maxLength={20}
                  style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="메뉴명"
                name="menuNmDisplay"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="상위메뉴코드"
                name="upMenuCd"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="메뉴순서"
                name="menuSeq"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  maxLength={10}
                  onChange={(e) => form.setFieldValue('menuSeq', e.target.value.replace(/\D/g, ''))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item
                label="메뉴레벨"
                name="menuDpth"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput readOnly style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="컴포넌트경로"
                name="menuUrlAddr"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={200} placeholder="예: AdminMenuManagement" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="라벨코드"
                name="lblCd"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="정렬경로"
                name="sortPath"
                style={{ margin: 0 }}
              >
                <TipInput readOnly style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>

    </div>
  );
}
