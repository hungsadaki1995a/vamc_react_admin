import { useState, useMemo } from 'react';
import { Input, Select, Space, Card, Button, Progress, Badge } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import GridTable from '@/components/grid/GridTable';
import { mockProjects } from '@/mock/projects';
import type { Project, ProjectStatus } from '@/mock/projects';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  active: { label: '진행중', color: 'processing' },
  completed: { label: '완료', color: 'success' },
  hold: { label: '보류', color: 'error' },
};

function StatusRenderer(params: ICellRendererParams<Project, ProjectStatus>) {
  if (!params.value) return null;
  const cfg = statusConfig[params.value];
  return <Badge status={cfg.color as import('antd').BadgeProps['status']} text={cfg.label} />;
}

function ProgressRenderer(params: ICellRendererParams<Project, number>) {
  return <Progress percent={params.value ?? 0} size="small" />;
}

function PeriodRenderer(params: ICellRendererParams<Project>) {
  if (!params.data) return null;
  return <>{params.data.startDate} ~ {params.data.endDate}</>;
}

interface ProjectListProps {
  filterStatus?: ProjectStatus;
}

export default function ProjectList({ filterStatus }: ProjectListProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>(filterStatus ?? 'all');

  const filteredData = useMemo(
    () =>
      mockProjects.filter((p) => {
        const matchSearch = p.name.includes(searchText) || p.description.includes(searchText);
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [searchText, statusFilter],
  );

  const columnDefs = useMemo<ColDef<Project>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 80, flex: 0 },
      { field: 'name', headerName: '프로젝트명', minWidth: 200 },
      { field: 'description', headerName: '설명', minWidth: 200 },
      { field: 'status', headerName: '상태', width: 110, flex: 0, cellRenderer: StatusRenderer },
      { field: 'progress', headerName: '진행률', width: 160, flex: 0, cellRenderer: ProgressRenderer, filter: false },
      { field: 'manager', headerName: '담당자', width: 100, flex: 0 },
      { field: 'category', headerName: '분류', width: 110, flex: 0 },
      { headerName: '기간', width: 210, flex: 0, cellRenderer: PeriodRenderer, filter: false, sortable: false },
    ],
    [],
  );

  return (
    <div className="page-container">
      <div className="ds-section-header">
        <h2>{filterStatus ? statusConfig[filterStatus].label + ' 프로젝트' : '프로젝트 목록'}</h2>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="프로젝트명 검색"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          {!filterStatus && (
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
              options={[
                { label: '전체 상태', value: 'all' },
                { label: '진행중', value: 'active' },
                { label: '완료', value: 'completed' },
                { label: '보류', value: 'hold' },
              ]}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />}>새 프로젝트</Button>
        </Space>
      </Card>
      <GridTable<Project>
        columnDefs={columnDefs}
        rowData={filteredData}
        rowKey="id"
      />
    </div>
  );
}
