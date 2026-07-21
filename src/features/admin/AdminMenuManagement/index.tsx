import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Button, Form, Row, Col, Space, Select } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import TipInput from '@/components/inputs/TipInput';
import { useNotify } from '@/hooks/useNotify';
import { useMenuStore } from '@/stores/menuStore';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MnuResponse } from '@/api/menu';
import type { ColDef } from 'ag-grid-community';

// ── Constants ────────────────────────────────────────────────────────────────

type LangCd = 'ko' | 'en' | 'vn';

const LANG_OPTIONS: { value: LangCd; label: string }[] = [
  { value: 'ko', label: '한국어 (KO)' },
  { value: 'en', label: 'English (EN)' },
  { value: 'vn', label: 'Tiếng Việt (VN)' },
];

// ── Types ────────────────────────────────────────────────────────────────────

type FormValues = {
  menuCd: string;
  menuNmDisplay: string;
  menuLblVal: string;
  upMenuCd: string;
  menuSeq: number | string;
  menuDpth: number | string;
  menuUrlAddr: string;
  lblCd: string;
};

// ── API ──────────────────────────────────────────────────────────────────────

async function fetchAllMenus(langCd: LangCd): Promise<MnuResponse[]> {
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/common/menus/all', {
    params: { langCd },
  });
  if (data.status !== 200 || !data.data) return [];
  return data.data;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminMenuManagement() {
  const { notify, dialog } = useNotify();

  // ── Filter state ─────────────────────────────────────────────────────────
  const [filterMenuCd, setFilterMenuCd]   = useState('');
  const [filterMenuNm, setFilterMenuNm]   = useState('');
  const [filterLangCd, setFilterLangCd]   = useState<LangCd>('en');
  const [appliedFilter, setAppliedFilter] = useState({ menuCd: '', menuNm: '', langCd: 'en' as LangCd });
  const [hasSearched, setHasSearched]     = useState(true);

  // ── Server data ──────────────────────────────────────────────────────────
  const { data: allMenus = [], isLoading } = useQuery({
    queryKey: ['admin', 'menus', 'all', appliedFilter.langCd],
    queryFn: () => fetchAllMenus(appliedFilter.langCd),
  });

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
      if (appliedFilter.menuNm) {
        const nm = item.menuNmDisplay.trim();
        const lbl = item.menuLblVal?.trim() ?? '';
        if (!nm.includes(appliedFilter.menuNm) && !lbl.includes(appliedFilter.menuNm)) return false;
      }
      return true;
    });
  }, [hasSearched, allMenus, appliedFilter]);

  // ── Column definitions ───────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<MnuResponse>[]>(() => {
    const langLabel = LANG_OPTIONS.find((o) => o.value === appliedFilter.langCd)?.label ?? appliedFilter.langCd.toUpperCase();
    return [
      { field: 'menuCd',        headerName: '메뉴코드',     width: 130, flex: 0 },
      {
        field: 'menuNmDisplay', headerName: '메뉴명(KR)', minWidth: 180,
        valueFormatter: ({ data }) =>
          data ? '\u00A0'.repeat(((data.menuDpth ?? 1) - 1) * 4) + (data.menuNmDisplay?.trim() ?? '') : '',
      },
      { field: 'menuLblVal',    headerName: `다국어 메뉴명 (${langLabel})`, minWidth: 200 },
      { field: 'upMenuCd',      headerName: '상위메뉴코드', width: 130, flex: 0 },
      { field: 'menuSeq',       headerName: '메뉴순서',     width: 90,  flex: 0 },
      { field: 'menuDpth',      headerName: '메뉴레벨',     width: 90,  flex: 0 },
      { field: 'menuUrlAddr',   headerName: '컴포넌트경로',  minWidth: 180 },
      { field: 'lblCd',         headerName: '라벨코드',     minWidth: 220 },
    ];
  }, [appliedFilter.langCd]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setAppliedFilter({ menuCd: filterMenuCd, menuNm: filterMenuNm, langCd: filterLangCd });
  }, [filterMenuCd, filterMenuNm, filterLangCd]);

  const handleFilterReset = useCallback(() => {
    setFilterMenuCd('');
    setFilterMenuNm('');
    setFilterLangCd('en');
    setAppliedFilter({ menuCd: '', menuNm: '', langCd: 'en' });
    setHasSearched(false);
  }, []);

  const handleRowClick = useCallback((row: MnuResponse) => {
    setSelectedRow(row);
    form.setFieldsValue({
      menuCd:        row.menuCd,
      menuNmDisplay: row.menuNmDisplay?.trim(),
      menuLblVal:    row.menuLblVal ?? '',
      upMenuCd:      row.upMenuCd ?? '',
      menuSeq:       row.menuSeq,
      menuDpth:      row.menuDpth,
      menuUrlAddr:   row.menuUrlAddr ?? '',
      lblCd:         row.lblCd ?? '',
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
          useMenuStore.getState().invalidateMenuCache();
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
        useMenuStore.getState().invalidateMenuCache();
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
        <div className="ds-filter-field" style={{ minWidth: 180 }}>
          <span className="ds-filter-field-label" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            언어 <span style={{ color: 'red' }}>*</span>
          </span>
          <Select<LangCd>
            value={filterLangCd}
            onChange={setFilterLangCd}
            options={LANG_OPTIONS}
            style={{ width: '100%' }}
            allowClear={false}
          />
        </div>
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
          {/* Row 1: 메뉴코드 / 메뉴명(KR) / 다국어 메뉴명 / 상위메뉴코드 */}
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
                label="메뉴명(KR)"
                name="menuNmDisplay"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="다국어 메뉴명"
                name="menuLblVal"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  readOnly
                  style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }}
                  placeholder="라벨 테이블에서 자동 조회"
                />
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
          </Row>
          {/* Row 2: 메뉴순서 / 메뉴레벨 / 컴포넌트경로 / 라벨코드 */}
          <Row gutter={[12, 4]}>
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
          </Row>
        </Form>
      </FormPanel>

    </div>
  );
}
