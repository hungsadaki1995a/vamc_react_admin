import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Form, Row, Col, Select } from 'antd';
import GridPanel from '@/components/grid/GridPanel';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import TipInput from '@/components/inputs/TipInput';
import { useNotify } from '@/hooks/useNotify';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useMenuPermission } from '@/hooks/useMenuPermission';
import { useLocaleStore } from '@/stores/localeStore';
import { useMenuStore } from '@/stores/menuStore';
import { getLanguages } from '@/api/common/lblBulkApi';
import type { LangItem } from '@/api/common/lblBulkApi';
import { formatLabel } from '@/lib/i18n/formatLabel';
import { getAllMenus, createMenu, updateMenu, deleteMenu } from '@/api/sys/menuMngApi';
import type { MnuResponse, MenuListParams, MenuSaveRequest } from '@/api/sys/menuMngApi';
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
  /** 메뉴명(원본) = MENU_EXPLN. 번역이 없는 언어에서 폴백으로 쓰인다 */
  menuNmDisplay: string;
  /** 조회 언어의 번역. 저장 시 그 언어의 LANG_LBL_TRSL 로 들어간다 */
  menuLblVal: string;
  upMenuCd: string;
  menuSeq: number | string;
  /** 상위 메뉴에서 서버가 계산한다 — 읽기전용 */
  menuDpth: number | string;
  menuUrlAddr: string;
  lblCd: string;
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function SYS030101SC() {
  const { notify, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

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
  const [appliedFilter, setAppliedFilter] = useState<MenuListParams>({ langCd: defaultLangCd });

  // ── Server data ──────────────────────────────────────────────────────────
  //
  // 검색은 서버가 한다 — queryKey 에 조건을 실어 조건이 바뀌면 다시 조회한다.
  // 받아온 목록을 화면에서 다시 걸러내지 않는다.
  //
  // ⚠️ 이 화면은 진입하자마자 조회한다. **표준이 아니라 예외다.**
  //    메뉴는 IA 가 정한 57건 + 루트로 건수가 고정돼 있고 관리자가 목록부터 보는 화면이라
  //    조회 버튼을 한 번 더 누르게 할 이유가 없다.
  //
  //    🔴 신규 화면은 이 패턴을 복제하지 않는다. 건수가 늘어날 수 있는 업무 데이터는
  //       `SYS050301SC` 처럼 `{ enabled: applied !== null }` 로 막고 조회 버튼에서 시작한다 —
  //       그러지 않으면 탭을 여는 것만으로 전건 조회가 돈다.
  const { data: menuList = [], isLoading } = useApiQuery<MnuResponse[]>(
    ['admin', 'menus', 'all', appliedFilter],
    () => getAllMenus(appliedFilter),
  );

  // ── Form state ───────────────────────────────────────────────────────────
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow]     = useState<MnuResponse | null>(null);
  const [form]                            = Form.useForm<FormValues>();
  const gridRef                           = useRef<AgGridReact<MnuResponse>>(null);

  const isEditMode = selectedRow !== null;

  const createMutation = useApiMutation<void, MenuSaveRequest>(createMenu);
  const updateMutation = useApiMutation<void, MenuSaveRequest>(updateMenu);
  const deleteMutation = useApiMutation<void, string>(deleteMenu);

  /**
   * 저장·삭제 후 캐시 갱신 — 두 층을 모두 비운다.
   * ① react-query : queryKey 에 검색조건이 붙어 있으므로 접두 무효화를 쓴다.
   * ② menuStore   : 좌측 레일·플라이아웃이 쓰는 메뉴 트리(IndexedDB 캐시).
   */
  const invalidateAfterWrite = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'menus'] });
    void useMenuStore.getState().invalidateMenuCache();
  }, [queryClient]);

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
    // 빈 문자열은 조건 없음(undefined)으로 보낸다 — 서버 매퍼 <if> 와 같은 기준이다.
    setAppliedFilter({
      langCd: filterLangCd,
      menuCd: filterMenuCd.trim() || undefined,
      menuNm: filterMenuNm.trim() || undefined,
    });
  }, [filterMenuCd, filterMenuNm, filterLangCd]);

  /** 검색 조건만 비운다 — 그리드/폼 상태는 유지 (조건을 다시 입력하는 중에 결과가 사라지지 않게) */
  const handleFilterReset = useCallback(() => {
    setFilterMenuCd('');
    setFilterMenuNm('');
    setFilterLangCd(defaultLangCd);
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
    form.validateFields().then((values) => {
      // menuDpth 는 보내지 않는다 — 서버가 상위 메뉴에서 계산한다.
      // lblCd 를 비우면 서버가 lbl.menu.{menuCd} 규약으로 채운다.
      const request: MenuSaveRequest = {
        menuCd:      values.menuCd.trim(),
        upMenuCd:    values.upMenuCd.trim(),
        menuExpln:   values.menuNmDisplay.trim(),
        menuSeq:     Number(values.menuSeq) || 0,
        lblCd:       values.lblCd?.trim() || undefined,
        menuUrlAddr: values.menuUrlAddr?.trim() || undefined,
        langCd:      appliedFilter.langCd,
        menuLblVal:  values.menuLblVal?.trim() || undefined,
      };

      dialog.confirm({
        content: isEditMode ? tmc('C100002') : tmc('C100001'),
        // onError 를 달지 않는다 — 에러 토스트는 apiClient 인터셉터가 이미 띄운다.
        onOk: () => {
          const mutation = isEditMode ? updateMutation : createMutation;
          mutation.mutate(request, {
            onSuccess: () => {
              notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
              if (!isEditMode) handleFormReset();
              invalidateAfterWrite();
            },
          });
        },
      });
    }).catch(() => {
      notify.error(tme('E100001'));
    });
  }, [form, isEditMode, appliedFilter.langCd, dialog, notify, handleFormReset,
      createMutation, updateMutation, invalidateAfterWrite, tmc, tmi, tme]);

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
        deleteMutation.mutate(selectedRow.menuCd, {
          onSuccess: () => {
            notify.success(tmi('I100004'));
            handleFormReset();
            invalidateAfterWrite();
          },
        });
      },
    });
  }, [selectedRow, dialog, notify, handleFormReset, deleteMutation, invalidateAfterWrite, tsm, tmi]);

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
      <div className="page-body">
        <GridPanel<MnuResponse>
          totalCount={menuList.length}
          columnDefs={columnDefs}
          rowData={menuList}
          rowKey="menuCd"
          gridRef={gridRef}
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          loading={isLoading}
        />
      </div>

      {/* ── 하단 입력 폼 패널 */}
      <FormPanel
        title={tvh('menuInfo', '메뉴 정보')}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <ActionButtonGroup
            preset="formEdit"
            canWrite={canWrite}
            items={[
              { key: 'reset',  action: 'reset',       label: tvb('reset', '초기화'),  onClick: handleFormReset },
              { key: 'delete', action: 'deleteRow',   label: tvb('delete', '삭제'),   onClick: handleDelete, disabled: !isEditMode },
              { key: 'save',   action: 'saveChanges', label: tvb('save', '저장'),     onClick: handleSave },
            ]}
          />
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
                <TipInput readOnly={isEditMode} maxLength={9} />
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
                <TipInput readOnly placeholder={tvt('phMenuLblVal', '라벨 테이블에서 자동 조회')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('upMenuCd', '상위메뉴코드')}
                name="upMenuCd"
                rules={[{ required: true, message: '' }]}
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={9} />
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
                {/* 서버가 상위 메뉴에서 계산한다 — 여기 값은 보내지 않는다 */}
                <TipInput readOnly placeholder={tvt('phMenuDpth', '상위 메뉴에서 자동 계산')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={tvt('menuUrlAddr', '컴포넌트경로')}
                name="menuUrlAddr"
                style={{ margin: '0 0 8px' }}
              >
                <TipInput maxLength={200} placeholder={tvt('phMenuUrlAddr', '예: SYS030101SC')} />
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
