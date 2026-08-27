import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Button, Space, Row, Col, Typography, Spin } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { AgGridReact } from 'ag-grid-react';
import GridPanel from '@/components/grid/GridPanel';
import type { ColDef } from 'ag-grid-community';
import { getAddChildProjList } from '../api';

const { Text } = Typography;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  parentsProjId: string;
  parentsProjNm: string;
  initialChildIds: string;    // comma-separated child proj IDs
  initialChildNms: string;    // comma-separated child proj names
  onOk: (result: { childProjIds: string; childProjNms: string; childProjList: { childProjId: string }[] }) => void;
  onCancel: () => void;
}

type SelectedChild = { childProjId: string; childProjNm: string };
type AvailChild    = { projId: string; projNm: string };

// ── Component ─────────────────────────────────────────────────────────────────

export default function CCO1040021P({
  open,
  parentsProjId,
  parentsProjNm,
  initialChildIds,
  initialChildNms,
  onOk,
  onCancel,
}: Props) {
  const [searchProjNm, setSearchProjNm] = useState('');
  const [searchClnNm,  setSearchClnNm]  = useState('');
  const [selectedList, setSelectedList] = useState<SelectedChild[]>([]);
  const [availList,    setAvailList]    = useState<AvailChild[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [leftSelected,  setLeftSelected]  = useState<SelectedChild[]>([]);
  const [rightSelected, setRightSelected] = useState<AvailChild[]>([]);

  const leftGridRef  = useRef<AgGridReact<SelectedChild>>(null);
  const rightGridRef = useRef<AgGridReact<AvailChild>>(null);

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const ids = initialChildIds ? initialChildIds.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const nms = initialChildNms ? initialChildNms.split(',').map((s) => s.trim())               : [];
    const initList = ids.map((id, i) => ({ childProjId: id, childProjNm: nms[i] ?? id }));
    setSelectedList(initList);
    setSearchProjNm('');
    setSearchClnNm('');
    setLeftSelected([]);
    setRightSelected([]);
    loadAvailList(initList, '', '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentsProjId, initialChildIds, initialChildNms]);

  const loadAvailList = useCallback(async (
    currentSelected: SelectedChild[],
    projNm: string,
    clnNm: string,
  ) => {
    if (!parentsProjId) {
      setAvailList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getAddChildProjList({ parentsProjId, projNm, clnNm });
      const selectedIds = new Set(currentSelected.map((s) => s.childProjId));
      const filtered = (res.data ?? []).filter((r) => !selectedIds.has(r.projId ?? ''));
      setAvailList(filtered as AvailChild[]);
    } finally {
      setLoading(false);
    }
  }, [parentsProjId]);

  // ── Column defs ─────────────────────────────────────────────────────────────

  const leftCols = useMemo<ColDef<SelectedChild>[]>(() => [
    { field: 'childProjId', headerName: '프로젝트 ID', width: 130, flex: 0 },
    { field: 'childProjNm', headerName: '프로젝트명',  minWidth: 180 },
  ], []);

  const rightCols = useMemo<ColDef<AvailChild>[]>(() => [
    { field: 'projId', headerName: '프로젝트 ID', width: 130, flex: 0 },
    { field: 'projNm', headerName: '프로젝트명',  minWidth: 180 },
  ], []);

  // ── Move handlers ────────────────────────────────────────────────────────────

  const handleMoveRight = useCallback(() => {
    // left → right: remove from selected
    if (!leftSelected.length) return;
    const ids = new Set(leftSelected.map((r) => r.childProjId));
    const removed = leftSelected.map((r) => ({ projId: r.childProjId, projNm: r.childProjNm }));
    setSelectedList((prev) => prev.filter((r) => !ids.has(r.childProjId)));
    setAvailList((prev) => [...prev, ...removed]);
    setLeftSelected([]);
  }, [leftSelected]);

  const handleMoveLeft = useCallback(() => {
    // right → left: add to selected
    if (!rightSelected.length) return;
    const ids = new Set(rightSelected.map((r) => r.projId));
    const added = rightSelected.map((r) => ({ childProjId: r.projId, childProjNm: r.projNm }));
    setAvailList((prev) => prev.filter((r) => !ids.has(r.projId)));
    setSelectedList((prev) => [...prev, ...added]);
    setRightSelected([]);
  }, [rightSelected]);

  // ── Search ──────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    // Filter left grid locally by name
    const ids = initialChildIds ? initialChildIds.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const nms = initialChildNms ? initialChildNms.split(',').map((s) => s.trim())               : [];
    const all = ids.map((id, i) => ({ childProjId: id, childProjNm: nms[i] ?? id }));
    const filtered = searchProjNm
      ? all.filter((r) => r.childProjNm.includes(searchProjNm))
      : all;
    setSelectedList(filtered);
    loadAvailList(selectedList, searchProjNm, searchClnNm);
  }, [searchProjNm, searchClnNm, initialChildIds, initialChildNms, selectedList, loadAvailList]);

  const handleReset = useCallback(() => {
    setSearchProjNm('');
    setSearchClnNm('');
    const ids = initialChildIds ? initialChildIds.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const nms = initialChildNms ? initialChildNms.split(',').map((s) => s.trim())               : [];
    const initList = ids.map((id, i) => ({ childProjId: id, childProjNm: nms[i] ?? id }));
    setSelectedList(initList);
    loadAvailList(initList, '', '');
  }, [initialChildIds, initialChildNms, loadAvailList]);

  // ── OK handler ──────────────────────────────────────────────────────────────

  const handleOk = useCallback(() => {
    onOk({
      childProjIds: selectedList.map((r) => r.childProjId).join(','),
      childProjNms: selectedList.map((r) => r.childProjNm).join(','),
      childProjList: selectedList.map((r) => ({ childProjId: r.childProjId })),
    });
  }, [selectedList, onOk]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      title="하위프로젝트 관리"
      width={860}
      onOk={handleOk}
      onCancel={onCancel}
      okText="선택"
      cancelText="닫기"
      destroyOnHidden
    >
      {/* Search bar */}
      <Space style={{ marginBottom: 12 }}>
        <Input
          placeholder="부모 프로젝트"
          value={parentsProjNm}
          disabled
          style={{ width: 160 }}
        />
        <Input
          placeholder="프로젝트명"
          value={searchProjNm}
          onChange={(e) => setSearchProjNm(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 140 }}
          allowClear
        />
        <Input
          placeholder="고객"
          value={searchClnNm}
          onChange={(e) => setSearchClnNm(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 120 }}
          allowClear
        />
        <Button onClick={handleReset}>초기화</Button>
        <Button type="primary" onClick={handleSearch}>조회</Button>
      </Space>

      {/* Dual-grid */}
      <Spin spinning={loading}>
        <Row gutter={8} align="middle">
          {/* Left — current child projects */}
          <Col flex="1">
            <Text strong style={{ display: 'block', marginBottom: 4 }}>현재 하위프로젝트</Text>
            <GridPanel<SelectedChild>
              totalCount={selectedList.length}
              columnDefs={leftCols}
              rowData={selectedList}
              rowKey="childProjId"
              height={300}
              gridRef={leftGridRef}
              onSelectionChanged={setLeftSelected}
              defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
              pagination={false}
              rowSelection="multiRow"
              rowMultiSelectWithClick
            />
          </Col>

          {/* Center buttons */}
          <Col flex="none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button icon={<RightOutlined />} onClick={handleMoveRight} title="선택 해제" />
            <Button icon={<LeftOutlined  />} onClick={handleMoveLeft}  title="선택 추가" />
          </Col>

          {/* Right — available child projects */}
          <Col flex="1">
            <Text strong style={{ display: 'block', marginBottom: 4 }}>추가 가능한 하위프로젝트</Text>
            <GridPanel<AvailChild>
              totalCount={availList.length}
              columnDefs={rightCols}
              rowData={availList}
              rowKey="projId"
              height={300}
              gridRef={rightGridRef}
              onSelectionChanged={setRightSelected}
              defaultColDef={{ suppressHeaderMenuButton: true, suppressHeaderFilterButton: true }}
              pagination={false}
              rowSelection="multiRow"
              rowMultiSelectWithClick
            />
          </Col>
        </Row>
      </Spin>
    </Modal>
  );
}
