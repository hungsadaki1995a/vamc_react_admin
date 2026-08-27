import { useState, useMemo, useCallback } from 'react';
import { Input, Tag, Descriptions, Button, Space, Empty } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import GridPanel from '@/components/grid/GridPanel';
import FilterPanel from '@/components/layout/FilterPanel';
import DetailPanel from '@/components/layout/DetailPanel';
import { mockProjects } from '@/mock/projects';
import { mockTasks, taskStatusLabels, taskStatusColors, taskPriorityLabels, taskPriorityColors } from '@/mock/tasks';
import type { Project, ProjectStatus } from '@/mock/projects';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

const projStatusCfg: Record<ProjectStatus, { label: string; color: string }> = {
  active:    { label: '진행중', color: 'blue' },
  completed: { label: '완료',   color: 'green' },
  hold:      { label: '보류',   color: 'red' },
};

export default function PatternMasterDetail() {
  const [search, setSearch]     = useState('');
  const [activeKw, setActiveKw] = useState('');
  const [selected, setSelected] = useState<Project | null>(mockProjects[0]);

  const filtered = useMemo(() =>
    mockProjects.filter((p) =>
      !activeKw || p.name.includes(activeKw) || p.manager.includes(activeKw)
    ),
    [activeKw],
  );

  const colDefs: ColDef<Project>[] = [
    { field: 'id',       headerName: 'ID',       width: 80,  flex: 0 },
    { field: 'name',     headerName: '프로젝트명', minWidth: 150 },
    { field: 'status',   headerName: '상태',     width: 90,  flex: 0,
      cellRenderer: (p: ICellRendererParams<Project, ProjectStatus>) =>
        p.value ? <Tag color={projStatusCfg[p.value].color}>{projStatusCfg[p.value].label}</Tag> : null,
    },
    { field: 'manager',  headerName: '담당자',   width: 90,  flex: 0 },
    { field: 'category', headerName: '분류',     width: 100, flex: 0 },
    { field: 'progress', headerName: '진행률',   width: 80,  flex: 0,
      valueFormatter: (p) => `${p.value}%`,
    },
  ];

  const handleRowClick = useCallback((row: Project) => setSelected(row), []);

  return (
    <div className="page-container">
      <FilterPanel
        activeFilterCount={activeKw ? 1 : 0}
        onSearch={() => setActiveKw(search)}
        onReset={() => { setSearch(''); setActiveKw(''); }}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">검색어</span>
          <Input placeholder="프로젝트명, 담당자" prefix={<SearchOutlined />} value={search}
            onChange={(e) => setSearch(e.target.value)} allowClear />
        </div>
      </FilterPanel>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<Project>
          totalCount={filtered.length}
          actions={<Button size="small" type="primary" icon={<PlusOutlined />}>등록</Button>}
          columnDefs={colDefs}
          rowData={filtered}
          rowKey="id"
          height="100%"
          onRowClick={handleRowClick}
          defaultColDef={{ resizable: true, sortable: true }}
        />
      </div>

      <DetailPanel
        visible={!!selected}
        title={selected?.name}
        onClose={() => setSelected(null)}
        tabs={selected ? [
          {
            key: 'info',
            label: '프로젝트 정보',
            children: (
              <>
                <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
                  <Descriptions.Item label="상태">
                    <Tag color={projStatusCfg[selected.status].color}>{projStatusCfg[selected.status].label}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="담당 PM">{selected.manager}</Descriptions.Item>
                  <Descriptions.Item label="분류">{selected.category}</Descriptions.Item>
                  <Descriptions.Item label="시작일">{selected.startDate}</Descriptions.Item>
                  <Descriptions.Item label="종료일">{selected.endDate}</Descriptions.Item>
                  <Descriptions.Item label="예산">{selected.budget.toLocaleString()}원</Descriptions.Item>
                  <Descriptions.Item label="진행률">{selected.progress}%</Descriptions.Item>
                  <Descriptions.Item label="구성원" span={2}>{selected.members.join(', ')}</Descriptions.Item>
                  <Descriptions.Item label="설명" span={2}>{selected.description}</Descriptions.Item>
                </Descriptions>
                <Space>
                  <Button type="primary" size="small">저장</Button>
                  <Button size="small" danger>삭제</Button>
                </Space>
              </>
            ),
          },
          {
            key: 'tasks',
            label: '업무 목록',
            badge: mockTasks.filter((t) => t.projectId === selected.id).length,
            children: (() => {
              const tasks = mockTasks.filter((t) => t.projectId === selected.id);
              return tasks.length > 0 ? (
                <div>
                  {tasks.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                      <Tag color={taskStatusColors[t.status]} style={{ margin: 0 }}>{taskStatusLabels[t.status]}</Tag>
                      <Tag color={taskPriorityColors[t.priority]} style={{ margin: 0 }}>{taskPriorityLabels[t.priority]}</Tag>
                      <span style={{ flex: 1 }}>{t.title}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{t.assignee}</span>
                    </div>
                  ))}
                </div>
              ) : <Empty description="등록된 업무가 없습니다." />;
            })(),
          },
        ] : undefined}
      />
    </div>
  );
}
