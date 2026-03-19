/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Button, Form, Row, Col, Space } from 'antd';
import DateField from '@/components/inputs/DateField';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import GridPanel from '@/components/grid/GridPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import UsrSelectField from '@/components/inputs/selectors/UsrSelectField';
import SceSelectField from '@/components/inputs/selectors/SceSelectField';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useNotify } from '@/hooks/useNotify';
import { getProjList, saveProj, deleteProj } from './api';
import type { ProjItem, ProjSaveReq } from './api';
import type { ColDef } from 'ag-grid-community';

// ── Form value type ────────────────────────────────────────────────────────────

interface ProjFormValues {
  projId?: string;
  projNm: string;
  clnNm: string;
  bzDpNm: string;
  pmNm?: SearchSelectValue | null;
  adminNm?: SearchSelectValue | null;
  pnSrDt?: Dayjs | null;
  pnEdDt?: Dayjs | null;
  mainSceId?: SearchSelectValue | null;
  showYn?: string;
  projType?: string;
  childProjs?: SearchSelectValue[] | null;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CCO104002SC() {
  const { notify, dialog } = useNotify();
  const { tvt, tvb, tsg, tmc, tmi, labels } = useScreenLabel();

  // Filter state
  const [filterProjNm,  setFilterProjNm]  = useState('');
  const [filterClnNm,   setFilterClnNm]   = useState('');
  const [filterBzDpNm,  setFilterBzDpNm]  = useState('');
  const [filterPmId,    setFilterPmId]    = useState<SearchSelectValue | null>(null);
  const [filterAdminId, setFilterAdminId] = useState<SearchSelectValue | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [appliedFilter, setAppliedFilter] = useState<Record<string, string>>({});
  const [hasSearched,   setHasSearched]   = useState(false);

  // Form state
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow]     = useState<ProjItem | null>(null);
  const [form]                            = Form.useForm<ProjFormValues>();
  const gridRef                           = useRef<AgGridReact<ProjItem>>(null);

  const isEditMode = selectedRow !== null;

  // ── API ───────────────────────────────────────────────────────────────────

  const { data: projList = [], isLoading, refetch } = useApiQuery<ProjItem[]>(
    ['proj', 'mgmt', 'list', appliedFilter],
    () => getProjList(appliedFilter),
    { enabled: hasSearched },
  );

  const saveMutation   = useApiMutation<void, ProjSaveReq>(saveProj);
  const deleteMutation = useApiMutation<void, string>(deleteProj);

  // ── Column definitions ────────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<ProjItem>[]>(() => [
    { field: 'projId',      headerName: tsg('projId',      '프로젝트 ID'),   width: 110, flex: 0 },
    { field: 'projNm',      headerName: tsg('projNm',      '프로젝트명'),    minWidth: 160 },
    { field: 'clnNm',       headerName: tsg('clnNm',       '고객'),          width: 120, flex: 0 },
    { field: 'bzDpNm',      headerName: tsg('bzDpNm',      '사업부서'),      width: 120, flex: 0 },
    { field: 'pmNm',        headerName: tsg('pmNm',        'PM'),            width: 100, flex: 0 },
    { field: 'adminNm',     headerName: tsg('adminNm',     '관리자'),        width: 100, flex: 0 },
    { field: 'childProjNm', headerName: tsg('childProjNm', '하위프로젝트'),  minWidth: 160 },
    { field: 'pnSrDt',      headerName: tsg('pnSrDt',      '계획시작일'),    width: 110, flex: 0 },
    { field: 'pnEdDt',      headerName: tsg('pnEdDt',      '계획종료일'),    width: 110, flex: 0 },
    { field: 'rltSrDt',     headerName: tsg('rltSrDt',     '실제시작일'),    width: 110, flex: 0 },
    { field: 'rltEdDt',     headerName: tsg('rltEdDt',     '실제종료일'),    width: 110, flex: 0 },
    { field: 'rgNm',        headerName: tsg('rgNm',        '등록자'),        width: 90,  flex: 0 },
    { field: 'rgDttm',      headerName: tsg('rgDttm',      '등록일시'),      width: 160, flex: 0 },
    { field: 'mfNm',        headerName: tsg('mfNm',        '수정자'),        width: 90,  flex: 0 },
    { field: 'mfDttm',      headerName: tsg('mfDttm',      '수정일시'),      width: 160, flex: 0 },
  ], [labels]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setAppliedFilter({
      projNm:  filterProjNm,
      clnNm:   filterClnNm,
      bzDpNm:  filterBzDpNm,
      pmId:    filterPmId?.value  ?? '',
      adminId: filterAdminId?.value ?? '',
      pnSrDt1: filterDateRange?.[0]?.format('YYYYMMDD') ?? '',
      pnSrDt2: filterDateRange?.[1]?.format('YYYYMMDD') ?? '',
    });
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [filterProjNm, filterClnNm, filterBzDpNm, filterPmId, filterAdminId, filterDateRange, form]);

  const handleFilterReset = useCallback(() => {
    setFilterProjNm('');
    setFilterClnNm('');
    setFilterBzDpNm('');
    setFilterPmId(null);
    setFilterAdminId(null);
    setFilterDateRange(null);
  }, []);

  const handleFormReset = useCallback(() => {
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [form]);

  const handleRowClick = useCallback((proj: ProjItem) => {
    setSelectedRow(proj);
    // childProjId / childProjNm: comma-separated strings from server
    // → convert to SearchSelectValue[] for ProjSelectField (multiple)
    const ids = (proj.childProjId ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const nms = (proj.childProjNm ?? '').split(',').map((s) => s.trim());
    form.setFieldsValue({
      projId:    proj.projId,
      projNm:    proj.projNm,
      clnNm:     proj.clnNm,
      bzDpNm:    proj.bzDpNm,
      pmNm:      proj.pmId    ? { label: proj.pmNm,    value: proj.pmId    } : null,
      adminNm:   proj.adminId ? { label: proj.adminNm, value: proj.adminId } : null,
      pnSrDt:    proj.pnSrDt ? dayjs(proj.pnSrDt, 'YYYYMMDD') : null,
      pnEdDt:    proj.pnEdDt ? dayjs(proj.pnEdDt, 'YYYYMMDD') : null,
      mainSceId: proj.mainSceId ? { label: proj.sceNm ?? proj.mainSceId, value: proj.mainSceId } : null,
      showYn:    proj.showYn,
      projType:  proj.projType,
      childProjs: ids.map((id, i) => ({ value: id, label: nms[i] ?? id })),
    });
    if (formCollapsed) setFormCollapsed(false);
  }, [form, formCollapsed]);

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const projType = values.projType ?? '1';
      // Child projects: only included when projType === '2' (dashboard)
      // ProjSelectField returns SearchSelectValue[] → map to { childProjId } for API
      const childProjs = values.childProjs ?? [];
      const payload: ProjSaveReq = {
        projId:    values.projId ?? '',
        projNm:    values.projNm,
        clnNm:     values.clnNm,
        bzDpNm:    values.bzDpNm,
        pmId:      values.pmNm?.value ?? '',
        adminId:   values.adminNm?.value ?? '',
        projType,
        pnSrDt:    values.pnSrDt?.format('YYYYMMDD') ?? '',
        pnEdDt:    values.pnEdDt?.format('YYYYMMDD') ?? '',
        mainSceId: values.mainSceId?.value ?? '',
        showYn:    values.showYn ?? 'Y',
        childProjList: projType === '2' ? childProjs.map((v) => ({ childProjId: v.value })) : [],
      };
      dialog.confirm({
        content: tmc('C100004'),
        onOk: () => {
          saveMutation.mutate(payload, {
            onSuccess: () => {
              notify.success(tmi('I100005'));
              handleFormReset();
              refetch();
            },
            onError: (err) => notify.error(err.message),
          });
        },
      });
    }).catch(() => {
      notify.error('필수 항목을 확인해주세요.');
    });
  }, [form, dialog, saveMutation, notify, tmc, tmi, handleFormReset, refetch]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      content: tmc('C100003'),
      onOk: () => {
        deleteMutation.mutate(selectedRow.projId, {
          onSuccess: () => {
            notify.success(tmi('I100004'));
            handleFormReset();
            refetch();
          },
          onError: (err) => notify.error(err.message),
        });
      },
    });
  }, [selectedRow, dialog, deleteMutation, notify, tmc, tmi, handleFormReset, refetch]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={[filterProjNm, filterClnNm, filterBzDpNm,
          filterPmId, filterAdminId, filterDateRange].filter(Boolean).length}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('projNm') || '프로젝트명'}</span>
          <Input
            value={filterProjNm}
            onChange={(e) => setFilterProjNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('clnNm') || '고객'}</span>
          <Input
            value={filterClnNm}
            onChange={(e) => setFilterClnNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('bzDpNm') || '사업부서'}</span>
          <Input
            value={filterBzDpNm}
            onChange={(e) => setFilterBzDpNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('pnSrDt') || '계획시작일'}</span>
          <DateField.RangePicker
            value={filterDateRange ?? undefined}
            onChange={(dates) => setFilterDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('pmNm') || 'PM'}</span>
          <UsrSelectField
            value={filterPmId}
            onChange={(v) => setFilterPmId(v as SearchSelectValue | null)}
            placeholder="PM 검색"
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('adminNm') || '관리자'}</span>
          <UsrSelectField
            value={filterAdminId}
            onChange={(v) => setFilterAdminId(v as SearchSelectValue | null)}
            placeholder="관리자 검색"
          />
        </div>
      </FilterPanel>

      {/* ── 그리드 패널 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<ProjItem>
          totalCount={projList.length}
          gridRef={gridRef}
          columnDefs={columnDefs}
          rowData={hasSearched ? projList : []}
          rowKey="projId"
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          loading={hasSearched && isLoading}
          defaultColDef={{ suppressHeaderMenuButton: false, suppressHeaderFilterButton: false, suppressHeaderContextMenu: false }}
        />
      </div>

      {/* ── 하단 입력 폼 패널 */}
      <FormPanel
        title={tvt('input') || '입력값'}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleFormReset}>{tvb('btnInit2') || '초기화'}</Button>
            <VerticalDivider />
            <Button size="middle" type="primary" onClick={handleSave}>{tvb('btnMer') || '저장'}</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>{tvb('btnDel') || '삭제'}</Button>
            <VerticalDivider />
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ style: { width: 90, textAlign: 'right' } }}
          wrapperCol={{ style: { flex: 1, minWidth: 0 } }}
        >
          {/* Row 1: 프로젝트ID / 프로젝트명 / 사업부서 / PM */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('projId') || '프로젝트 ID'} name="projId" style={{ margin: '0 0 8px' }}>
                <Input
                  readOnly
                  placeholder="자동 생성"
                  style={{ background: 'var(--tab-bar-bg)', cursor: 'not-allowed' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('projNm') || '프로젝트명'} name="projNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('bzDpNm') || '사업부서'} name="bzDpNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('pmNm') || 'PM'} name="pmNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <UsrSelectField placeholder="PM 검색" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: 고객 / 계획시작일 / 계획종료일 / 관리자 */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('clnNm') || '고객'} name="clnNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('pnSrDt') || '계획시작일'} name="pnSrDt" style={{ margin: '0 0 8px' }}>
                <DateField style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('pnEdDt') || '계획종료일'} name="pnEdDt" style={{ margin: '0 0 8px' }}>
                <DateField style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('adminNm') || '관리자'} name="adminNm" rules={[{ required: true, message: ' ' }]} style={{ margin: '0 0 8px' }}>
                <UsrSelectField placeholder="관리자 검색" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: 홈 화면 / 운영담당자노출여부 / 유형 */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('mainSceId') || '홈 화면'} name="mainSceId" style={{ margin: '0 0 8px' }}>
                <SceSelectField placeholder="화면 검색" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('showYn') || '운영 담당자 노출 여부'} name="showYn" style={{ margin: '0 0 8px' }} labelCol={{ style: { whiteSpace: 'normal', lineHeight: '1.3' } }}>
                <ComcdSelect cdDmnId="YN" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>

    </div>
  );
}
