import { useState, useMemo, useCallback } from 'react';
import { Input, Button, Form, InputNumber, App, Row, Col, Space, Divider } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import GridPanel from '@/components/grid/GridPanel';
import { ComcdSelectCellRenderer } from '@/components/grid/ComcdSelectCell';
import FilterPanel from '@/components/layout/FilterPanel';
import FormPanel from '@/components/layout/FormPanel';
import DeptSelectField from '@/components/inputs/selectors/DeptSelectField';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getUsrList, saveUsr, deleteUsr, resetPwdErrCnt, resetPwd, unlockUsr } from '@/api/usr';
import type { ColDef } from 'ag-grid-community';
import type { User, UserFormValues } from './types';

// ── Module-level constants ─────────────────────────────────────────────────────

const stdCostFormatter = (v: number | string | undefined) =>
  `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CCO101001SC() {
  const { message, modal } = App.useApp();
  const { tvt, tvb, tsg, tsm } = useScreenLabel();
  const [filterEmpNo, setFilterEmpNo] = useState('');
  const [filterEmpNm, setFilterEmpNm] = useState('');
  // Snapshot of applied filter (only changes on Search click)
  const [appliedFilter, setAppliedFilter] = useState({ usrId: '', usrNm: '' });
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [selectedRow, setSelectedRow] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const isEditMode = selectedRow !== null;

  // ── API ───────────────────────────────────────────────────────────────────

  const { data: usrList = [], isLoading, refetch } = useApiQuery<User[]>(
    ['usr', 'list', appliedFilter],
    () => getUsrList(appliedFilter),
  );

  const saveMutation = useApiMutation<void, User>(saveUsr);
  const deleteMutation = useApiMutation<void, string>(deleteUsr);
  const pwErrResetMutation = useApiMutation<void, string>(resetPwdErrCnt);
  const pwResetMutation    = useApiMutation<void, string>(resetPwd);
  const unlockMutation     = useApiMutation<void, string>(unlockUsr);

  // ── Column definitions ────────────────────────────────────────────────────

  const columnDefs = useMemo<ColDef<User>[]>(() => [
    { field: 'usrId',  headerName: tsg('usrId'),  width: 130, flex: 0 },
    { field: 'usrNm',  headerName: tsg('usrNm'),  width: 140, flex: 0 },
    { field: 'jbcCd',  headerName: tsg('jbcCd'),  width: 100, flex: 0, cellRenderer: ComcdSelectCellRenderer, cellRendererParams: { cdDmnId: 'JBC_CD' } },
    { field: 'dpNm',   headerName: tsg('orgNm'),   width: 130, flex: 0 },
    { field: 'gdCd',   headerName: tsg('gdCd'),   width: 90,  flex: 0, cellRenderer: ComcdSelectCellRenderer, cellRendererParams: { cdDmnId: 'GD_CD' } },
    { field: 'stdCost',headerName: tsg('stdCost'),width: 110, flex: 0 },
    { field: 'grpNm',  headerName: tsg('grpNm'),  width: 140, flex: 0 },
    { field: 'phnNo',  headerName: tsg('phnNo'),  width: 150, flex: 0 },
    { field: 'email',  headerName: tsg('emailAddr'), minWidth: 200 },
    { field: 'usrIp',  headerName: tsg('usrIp'),  width: 150, flex: 0 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setAppliedFilter({ usrId: filterEmpNo, usrNm: filterEmpNm });
  }, [filterEmpNo, filterEmpNm]);

  const handleRowClick = useCallback((user: User) => {
    setSelectedRow(user);
    // Single setFieldsValue (no resetFields) to avoid double form re-render.
    // All fields are explicitly set so stale values are overwritten.
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
    setFilterEmpNo('');
    setFilterEmpNm('');
    setAppliedFilter({ usrId: '', usrNm: '' });
  }, [form]);

  // Filter-only reset (FilterPanel reset button — does not clear the form/selection)
  const handleFilterReset = useCallback(() => {
    setFilterEmpNo('');
    setFilterEmpNm('');
    setAppliedFilter({ usrId: '', usrNm: '' });
  }, []);

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      // Convert dpNm SearchSelectValue back to flat string fields for the API
      const payload = {
        ...values,
        dpNm: values.dpNm?.label ?? '',
        dpCd: values.dpNm?.value ?? '',
      } as User;
      saveMutation.mutate(payload, {
        onSuccess: () => {
          message.success(isEditMode ? tsm('updateSuccess') : tsm('regSuccess'));
          handleReset();
          refetch();
        },
      });
    }).catch(() => {
      message.error(tsm('requiredCheck'));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, saveMutation, isEditMode, message, tsm, refetch]);

  const handleDelete = useCallback(() => {
    if (!selectedRow) return;
    modal.confirm({
      title: tsm('deleteConfirmTitle'),
      content: `${selectedRow.usrNm}(${selectedRow.usrId}) ${tsm('deleteConfirmBody')}`,
      okText: tvb('delete'),
      okButtonProps: { danger: true },
      cancelText: tvb('cancel'),
      onOk: () => {
        deleteMutation.mutate(selectedRow.usrId, {
          onSuccess: () => {
            message.success(tsm('deleteSuccess'));
            handleReset();
            refetch();
          },
        });
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow, modal, deleteMutation, message, tsm, tvb, refetch]);

  const handlePwAction = useCallback((action: 'pwErrReset' | 'pwReset' | 'unlock') => {
    if (!selectedRow) return;
    const id = selectedRow.usrId;
    const onSuccess = () => { message.success(tsm('processed')); };
    if (action === 'pwErrReset') pwErrResetMutation.mutate(id, { onSuccess });
    else if (action === 'pwReset') pwResetMutation.mutate(id, { onSuccess });
    else unlockMutation.mutate(id, { onSuccess });
  }, [selectedRow, pwErrResetMutation, pwResetMutation, unlockMutation, message, tsm]);

  const handlePwErrReset = useCallback(() => handlePwAction('pwErrReset'), [handlePwAction]);
  const handlePwReset    = useCallback(() => handlePwAction('pwReset'),    [handlePwAction]);
  const handleUnlock     = useCallback(() => handlePwAction('unlock'),     [handlePwAction]);

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
          <span className="ds-filter-field-label">{tvt('usrId')}</span>
          <Input
            value={filterEmpNo}
            onChange={(e) => setFilterEmpNo(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">{tvt('usrNm')}</span>
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
                {tvb('exceldown')}
              </Button>
              <Button icon={<UploadOutlined />}>{tvb('btnExcelUpload')}</Button>
            </Space>
          }
          columnDefs={columnDefs}
          rowData={usrList}
          rowKey="usrId"
          onRowClick={handleRowClick}
          pagination={false}
          height="100%"
          loading={isLoading}
          defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
        />
      </div>

      {/* ── 하단 입력 폼 패널 */}
      <FormPanel
        title={tvt('input')}
        editMode={isEditMode}
        collapsed={formCollapsed}
        onCollapsedChange={setFormCollapsed}
        actions={
          <Space size={4} align="center">
            <Button size="middle" onClick={handleReset}>{tvb('btnInit2')}</Button>
            <Divider orientation="vertical" />
            <Button size="middle" disabled={!isEditMode} onClick={handlePwErrReset}>
              {tvb('setPasswdErCntEarCnvrs')}
            </Button>
            <Button size="middle" disabled={!isEditMode} onClick={handlePwReset}>
              {tvb('setUsrPasswdEarCnvrs')}
            </Button>
            <Button size="middle" disabled={!isEditMode} onClick={handleUnlock}>
              {tvb('setLoginUnlock')}
            </Button>
            <Divider orientation="vertical" />
            <Button size="middle" type="primary" onClick={handleSave}>{tvb('btnMer')}</Button>
            <Button size="middle" danger disabled={!isEditMode} onClick={handleDelete}>{tvb('btnDel')}</Button>
            <Divider orientation="vertical" />
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
              <Form.Item label={tvt('usrId')} name="usrId" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input
                  readOnly={isEditMode}
                  style={isEditMode ? { background: 'var(--tab-bar-bg)', cursor: 'not-allowed' } : undefined}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('usrNm')} name="usrNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('jbcCd')} name="jbcCd" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <ComcdSelect cdDmnId="JBC_CD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('org')} name="dpNm" rules={[{ required: true, message: '' }]} style={{ margin: '0 0 8px' }}>
                <DeptSelectField placeholder="부서명 검색" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: 등급 / 표준단가 / 전화번호 / 이메일 */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('gdCd')} name="gdCd" style={{ margin: '0 0 8px' }}>
                <ComcdSelect cdDmnId="GD_CD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('stdCost')} name="stdCost" style={{ margin: '0 0 8px' }}>
                <InputNumber style={{ width: '100%' }} min={0} formatter={stdCostFormatter} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('phnNo')} name="phnNo" style={{ margin: '0 0 8px' }}>
                <Input placeholder="000-0000-0000" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={tvt('emailAddr')} name="email" rules={[{ type: 'email', message: '' }]} style={{ margin: '0 0 8px' }}>
                <Input placeholder="example@shinhan.com" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: 사용자IP */}
          <Row gutter={[12, 4]}>
            <Col span={6}>
              <Form.Item label={tvt('usrIp')} name="usrIp" style={{ margin: 0 }}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </FormPanel>
    </div>
  );
}
