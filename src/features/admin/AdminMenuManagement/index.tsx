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
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useLocaleStore } from '@/stores/localeStore';
import { useMenuStore } from '@/stores/menuStore';
import { getLanguages } from '@/api/common/lbl';
import type { LangItem } from '@/api/common/lbl';
import { formatLabel } from '@/lib/i18n/formatLabel';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MnuResponse } from '@/api/common/menu';
import type { ColDef } from 'ag-grid-community';

// ── Constants ────────────────────────────────────────────────────────────────

/** DB 언어코드 (LANG_MNG.LANG_CD) — KR / EN / VN */
type LangCd = string;

/** 프론트 로케일(ko/en/vn) → DB 언어코드(KR/EN/VN). 서버 LangCdResolver 와 같은 보정이다. */
function toDbLangCd(locale: string): LangCd {
  return locale === 'ko' ? 'KR' : locale.toUpperCase();
}

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
  const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();

  // 조회 대상 언어의 기본값은 화면 로케일을 따른다 — 한국어로 보면서 영어 라벨만 나오던 문제.
  const defaultLangCd = toDbLangCd(useLocaleStore((s) => s.locale));

  // 언어 목록은 LANG_MNG 가 정한다 (화면에 하드코딩하지 않는다).
  const { data: languages = [] } = useApiQuery<LangItem[]>(['lbl', 'languages'], () => getLanguages());
  const langOptions = useMemo(
    () => languages.map((l) => ({ value: l.langCd, label: `${l.langNm} (${l.langCd})` })),
    [languages],
  );

  // ── Filter state ─────────────────────────────────────────────────────────
  const [filterMenuCd, setFilterMenuCd]   = useState('');
  const [filterMenuNm, setFilterMenuNm]   = useState('');
  const [filterLangCd, setFilterLangCd]   = useState<LangCd>(defaultLangCd);
  const [appliedFilter, setAppliedFilter] = useState({ menuCd: '', menuNm: '', langCd: defaultLangCd });
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
    const langLabel = langOptions.find((o) => o.value === appliedFilter.langCd)?.label
      ?? appliedFilter.langCd;
    return [
      { field: 'menuCd',        headerName: tsg('menuCd', '메뉴코드'),   width: 130, flex: 0 },
      {
        // 메뉴명(KR) 은 원본 언어 데이터를 그대로 보여주는 컬럼이다 — 값은 번역 대상이 아니고
        // 헤더만 번역한다. 오른쪽 '다국어 메뉴명' 컬럼이 선택 언어의 번역을 보여준다.
        field: 'menuNmDisplay', headerName: tsg('menuNmDisplay', '메뉴명(KR)'), minWidth: 180,
        valueFormatter: ({ data }) =>
          data ? '\u00A0'.repeat(((data.menuDpth ?? 1) - 1) * 4) + (data.menuNmDisplay?.trim() ?? '') : '',
      },
      { field: 'menuLblVal',    headerName: formatLabel(tsg('menuLblVal', '다국어 메뉴명 ({0})'), langLabel), minWidth: 200 },
      { field: 'upMenuCd',      headerName: tsg('upMenuCd', '상위메뉴코드'),  width: 130, flex: 0 },
      { field: 'menuSeq',       headerName: tsg('menuSeq', '메뉴순서'),      width: 90,  flex: 0 },
      { field: 'menuDpth',      headerName: tsg('menuDpth', '메뉴레벨'),      width: 90,  flex: 0 },
      { field: 'menuUrlAddr',   headerName: tsg('menuUrlAddr', '컴포넌트경로'), minWidth: 180 },
      { field: 'lblCd',         headerName: tsg('lblCd', '라벨코드'),        minWidth: 220 },
    ];
  }, [appliedFilter.langCd, langOptions, tsg]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setAppliedFilter({ menuCd: filterMenuCd, menuNm: filterMenuNm, langCd: filterLangCd });
  }, [filterMenuCd, filterMenuNm, filterLangCd]);

  const handleFilterReset = useCallback(() => {
    setFilterMenuCd('');
    setFilterMenuNm('');
    setFilterLangCd(defaultLangCd);
    setAppliedFilter({ menuCd: '', menuNm: '', langCd: defaultLangCd });
    setHasSearched(false);
  }, [defaultLangCd]);

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
        content: isEditMode ? tmc('C100002') : tmc('C100001'),
        onOk: () => {
          // TODO: POST/PUT /api/common/menus
          notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
          useMenuStore.getState().invalidateMenuCache();
          if (!isEditMode) handleFormReset();
        },
      });
    }).catch(() => {
      notify.error(tme('E100001'));
    });
  }, [form, isEditMode, dialog, notify, handleFormReset, tmc, tmi, tme]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: formatLabel(
        tsm('deleteConfirm', '{0}({1})을(를) 삭제하시겠습니까?'),
        selectedRow.menuNmDisplay.trim(),
        selectedRow.menuCd,
      ),
      okButtonProps: { danger: true },
      onOk: () => {
        // TODO: DELETE /api/common/menus/{menuCd}
        notify.success(tmi('I100004'));
        useMenuStore.getState().invalidateMenuCache();
        handleFormReset();
      },
    });
  }, [selectedRow, dialog, notify, handleFormReset, tsm, tmi]);

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
            {tvt('lang', '언어')} <span style={{ color: 'red' }}>*</span>
          </span>
          <Select<LangCd>
            value={filterLangCd}
            onChange={setFilterLangCd}
            options={langOptions}
            style={{ width: '100%' }}
            allowClear={false}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('menuCd', '메뉴코드')}</span>
          <Input
            value={filterMenuCd}
            onChange={(e) => setFilterMenuCd(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('menuNm', '메뉴명')}</span>
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
        title={tvh('menuInfo', '메뉴 정보')}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleFormReset}>{tvb('reset', '초기화')}</Button>
            <VerticalDivider />
            <Button size="middle" type="primary" onClick={handleSave}>{tvb('save', '저장')}</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>{tvb('delete', '삭제')}</Button>
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
                label={tvt('menuCd', '메뉴코드')}
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
                label={tvt('menuNmDisplay', '메뉴명(KR)')}
                name="menuNmDisplay"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('menuLblValLabel', '다국어 메뉴명')}
                name="menuLblVal"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput
                  readOnly
                  style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }}
                  placeholder={tvt('phMenuLblVal', '라벨 테이블에서 자동 조회')}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('upMenuCd', '상위메뉴코드')}
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
                label={tvt('menuSeq', '메뉴순서')}
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
                label={tvt('menuDpth', '메뉴레벨')}
                name="menuDpth"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput readOnly style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('menuUrlAddr', '컴포넌트경로')}
                name="menuUrlAddr"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={200} placeholder={tvt('phMenuUrlAddr', '예: AdminMenuManagement')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('lblCd', '라벨코드')}
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
