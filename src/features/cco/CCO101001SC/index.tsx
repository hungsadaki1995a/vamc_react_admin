import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import { Input, Button, Form, InputNumber, Row, Col, Space } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import GridPanel from '@/components/grid/GridPanel';
import VerticalDivider from '@/components/layout/VerticalDivider';
import { ComcdSelectCellRenderer } from '@/components/grid/ComcdSelectCell';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import DeptSelectField from '@/components/inputs/selectors/DeptSelectField';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getUsrList, saveUsr, deleteUsr, resetPwdErrCnt, resetPwd, unlockUsr } from './api';
import type { ColDef } from 'ag-grid-community';
import type { User, UserFormValues } from './types';
import { useNotify } from '@/hooks/useNotify';
import CCO1010011P from '@/features/cco/CCO1010011P';

// ── Module-level constants ─────────────────────────────────────────────────────

const stdCostFormatter = (v: number | string | undefined) =>
  `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CCO101001SC() {
  const { toast: _toast, notify, dialog } = useNotify();
  const { tvt, tvb, tsg, tsm, tmc, tmi, labels } = useScreenLabel();
  const [filterEmpNo, setFilterEmpNo] = useState('');
  const [filterEmpNm, setFilterEmpNm] = useState('');
  // Snapshot of applied filter (only changes on Search click)
  const [appliedFilter, setAppliedFilter] = useState({ usrId: '', usrNm: '' });
  // Controls whether the query runs — false until user clicks Search
  const [hasSearched, setHasSearched] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormValues>();
  const [pwChangeOpen, setPwChangeOpen] = useState(false);
  const gridRef = useRef<AgGridReact<User>>(null);

  const isEditMode = selectedRow !== null;

  // ── API ───────────────────────────────────────────────────────────────────

  const { data: usrList = [], isLoading, refetch } = useApiQuery<User[]>(
    ['usr', 'list', appliedFilter],
    () => getUsrList(appliedFilter),
    { enabled: hasSearched },
  );

  const saveMutation    = useApiMutation<void, User>(saveUsr);
  const deleteMutation  = useApiMutation<void, string>(deleteUsr);
  const pwErrResetMutation = useApiMutation<void, string>(resetPwdErrCnt);
  const pwResetMutation    = useApiMutation<void, string>(resetPwd);
  const unlockMutation     = useApiMutation<void, string>(unlockUsr);

  // ── Column definitions ────────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<User>[]>(() => [
    { field: 'usrId',   headerName: tsg('usrId', '사용자ID'),    width: 130, flex: 0 },
    { field: 'usrNm',   headerName: tsg('usrNm', '사용자명'),    width: 140, flex: 0 },
    { field: 'jbcCd',   headerName: tsg('jbcCd', '직급'),    width: 100, flex: 0, cellRenderer: ComcdSelectCellRenderer, cellRendererParams: { cdDmnId: 'JBC_CD' } },
    { field: 'dpNm',    headerName: tsg('orgNm', '부서명'),    width: 130, flex: 0 },
    { field: 'gdCd',    headerName: tsg('gdCd', '등급'),     width: 90,  flex: 0, cellRenderer: ComcdSelectCellRenderer, cellRendererParams: { cdDmnId: 'GD_CD' } },
    { field: 'stdCost', headerName: tsg('stdCost', '표준단가'),  width: 110, flex: 0 },
    { field: 'grpNm',   headerName: tsg('grpNm', '그룹명'),    width: 140, flex: 0 },
    { field: 'phnNo',   headerName: tsg('phnNo', '전화번호'),    width: 150, flex: 0 },
    { field: 'email',   headerName: tsg('emailAddr', '이메일'), minWidth: 200 },
    { field: 'usrIp',   headerName: tsg('usrIp', '사용자IP'),    width: 150, flex: 0 },
  ], [labels]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setAppliedFilter({ usrId: filterEmpNo, usrNm: filterEmpNm });
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
  }, [filterEmpNo, filterEmpNm, form]);

  const handleRowClick = useCallback((user: User) => {
    setSelectedRow(user);
    // Single setFieldsValue (no resetFields) to avoid double form re-render.
    form.setFieldsValue({
      usrId:   user.usrId,
      usrNm:   user.usrNm,
      cpNm:    user.cpNm,
      email:   user.email,
      jbtCd:   user.jbtCd,
      jbcCd:   user.jbcCd,
      gdCd:    user.gdCd,
      stdCost: user.stdCost,
      phnNo:   user.phnNo,
      usrIp:   user.usrIp,
      mrCont:  user.mrCont,
      grpNm:   user.grpNm,
      dpNm: user.dpCd ? { label: user.dpNm, value: user.dpCd } : null,
    });
    if (formCollapsed) setFormCollapsed(false);
  }, [form, formCollapsed]);

  const handleReset = useCallback(() => {
    setSelectedRow(null);
    form.resetFields();
    gridRef.current?.api?.deselectAll();
    setFilterEmpNo('');
    setFilterEmpNm('');
    setAppliedFilter({ usrId: '', usrNm: '' });
    setHasSearched(false);
  }, [form]);

  // Filter-only reset (FilterPanel reset button — does not clear the form/selection)
  const handleFilterReset = useCallback(() => {
    setFilterEmpNo('');
    setFilterEmpNm('');
    setAppliedFilter({ usrId: '', usrNm: '' });
    setHasSearched(false);
  }, []);

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        dpNm: values.dpNm?.label ?? '',
        dpCd: values.dpNm?.value ?? '',
      } as User;
      dialog.confirm({
        content: isEditMode ? tmc('C100002') : tmc('C100001'),
        onOk: () => {
          saveMutation.mutate(payload, {
            onSuccess: () => {
              notify.success(isEditMode ? tmi('I100003') : tmi('I100002'));
              handleReset();
              refetch();
            },
            onError: (err) => {
              notify.error(err.message);
            },
          });
        },
      });
    }).catch(() => {
      notify.error(tsm('requiredCheck', '필수 항목을 입력해 주세요.'));
    });
  }, [form, dialog, saveMutation, isEditMode, notify, tmc, tmi, tsm, handleReset, refetch]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    dialog.confirm({
      title: tsm('deleteConfirmTitle', '사용자 삭제'),
      content: `${selectedRow.usrNm}(${selectedRow.usrId}) ${tsm('deleteConfirmBody', '사용자를 삭제하시겠습니까?')}`,
      okText: tvb('delete', '삭제'),
      okButtonProps: { danger: true },
      cancelText: tvb('cancel', '취소'),
      onOk: () => {
        deleteMutation.mutate(selectedRow.usrId, {
          onSuccess: () => {
            notify.success(tmi('I100004'));
            handleReset();
            refetch();
          },
          onError: (err) => {
            notify.error(err.message);
          },
        });
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow, dialog, deleteMutation, notify, tmi, tsm, tvb, refetch]);

  const handlePwAction = useCallback((action: 'pwErrReset' | 'pwReset' | 'unlock') => {
    if (!selectedRow) return;
    const id = selectedRow.usrId;
    const onError = (err: { message: string }) => notify.error(err.message);
    if (action === 'pwErrReset') {
      pwErrResetMutation.mutate(id, {
        onSuccess: () => notify.success(tmi('I100008')),
        onError,
      });
    } else if (action === 'pwReset') {
      pwResetMutation.mutate(id, {
        onSuccess: () => notify.success(tmi('I100008')),
        onError,
      });
    } else {
      unlockMutation.mutate(id, {
        onSuccess: () => notify.success(tmi('I100035')),
        onError,
      });
    }
  }, [selectedRow, pwErrResetMutation, pwResetMutation, unlockMutation, notify, tmi]);

  const handlePwReset = useCallback(() => {
    dialog.confirm({
      content: tmc('C100007'),
      onOk: async () => { handlePwAction('pwReset'); },
    });
  }, [handlePwAction, dialog, tmc]);

  const handleUnlock = useCallback(() => {
    dialog.confirm({
      content: tmc('C100022'),
      onOk: async () => { handlePwAction('unlock'); },
    });
  }, [handlePwAction, dialog, tmc]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── 검색 필터 */}
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleFilterReset}
        activeFilterCount={[filterEmpNo, filterEmpNm].filter(Boolean).length}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('usrId', '사용자ID')}</span>
          <Input
            value={filterEmpNo}
            onChange={(e) => setFilterEmpNo(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('usrNm', '사용자명')}</span>
          <Input
            value={filterEmpNm}
            onChange={(e) => setFilterEmpNm(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* ── 그리드 패널 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<User>
          totalCount={usrList.length}
          actions={
            <Space size={6}>
              <Button icon={<DownloadOutlined />} style={{ color: '#52c41a' }}>
                {tvb('exceldown', '엑셀 다운로드')}
              </Button>
              <Button icon={<UploadOutlined />}>{tvb('btnExcelUpload', '엑셀 업로드')}</Button>
            </Space>
          }
          gridRef={gridRef}
          columnDefs={columnDefs}
          rowData={hasSearched ? usrList : []}
          rowKey="usrId"
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          loading={hasSearched && isLoading}
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
            <Button size="middle" onClick={handleReset}>{tvb('btnInit2', '초기화')}</Button>
            <VerticalDivider />
            {/* <Button size="middle" disabled={!isEditMode} onClick={handlePwErrReset}>
              {tvb('setPasswdErCntEarCnvrs', '비밀번호 오류횟수 초기화')}
            </Button> */}
            <Button size="middle" disabled={!isEditMode} onClick={handlePwReset}>
              {tvb('setUsrPasswdEarCnvrs', '비밀번호 초기화')}
            </Button>
            <Button size="middle" disabled={!isEditMode} onClick={handleUnlock}>
              {tvb('setLoginUnlock', '로그인 잠금 해제')}
            </Button>
            <Button size="middle" disabled={!isEditMode} onClick={() => setPwChangeOpen(true)}>
              {tvb('btnChg', '비밀번호 변경')}
            </Button>
            <VerticalDivider />
            <Button size="middle" type="primary" onClick={handleSave}>{tvb('btnMer', '저장')}</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>{tvb('btnDel', '삭제')}</Button>
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
          {/* Row 1: 사용자ID / 사용자명 / 직급 / 소속부서 */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('usrId', '사용자ID')} name="usrId" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input
                  readOnly={isEditMode}
                  style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('usrNm', '사용자명')} name="usrNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('jbcCd', '직급')} name="jbcCd" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <ComcdSelect cdDmnId="JBC_CD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('org', '소속부서')} name="dpNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <DeptSelectField placeholder="부서명 검색" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: 등급 / 표준단가 / 전화번호 / 이메일 */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('gdCd', '등급')} name="gdCd" style={{ margin: '0 0 8px' }}>
                <ComcdSelect cdDmnId="GD_CD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('stdCost', '표준단가')} name="stdCost" style={{ margin: '0 0 8px' }}>
                <InputNumber style={{ width: '100%' }} min={0} formatter={stdCostFormatter} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('phnNo', '전화번호')} name="phnNo" style={{ margin: '0 0 8px' }}>
                <Input placeholder="000-0000-0000" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('emailAddr', '이메일')} name="email" rules={[{ type: 'email', message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input placeholder="example@shinhan.com" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: 사용자IP */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('usrIp', '사용자IP')} name="usrIp" style={{ margin: 0 }}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>

      {/* ── 패스워드 변경 팝업 (CCO1010011P) */}
      {selectedRow && (
        <CCO1010011P
          open={pwChangeOpen}
          usrId={selectedRow.usrId}
          usrNm={selectedRow.usrNm}
          onClose={() => setPwChangeOpen(false)}
        />
      )}
    </div>
  );
}
