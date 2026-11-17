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
  active:    { label: 'In progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  hold:      { label: 'On hold',   color: 'red' },
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
    { field: 'name',     headerName: 'Project name', minWidth: 150 },
    { field: 'status',   headerName: 'Status',   width: 90,  flex: 0,
      cellRenderer: (p: ICellRendererParams<Project, ProjectStatus>) =>
        p.value ? <Tag color={projStatusCfg[p.value].color}>{projStatusCfg[p.value].label}</Tag> : null,
    },
    { field: 'manager',  headerName: 'Manager',  width: 90,  flex: 0 },
    { field: 'category', headerName: 'Category', width: 100, flex: 0 },
    { field: 'progress', headerName: 'Progress', width: 80,  flex: 0,
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
          <span className="ds-filter-field-label">Keyword</span>
          <Input placeholder="Project name, manager" prefix={<SearchOutlined />} value={search}
            onChange={(e) => setSearch(e.target.value)} allowClear />
        </div>
      </FilterPanel>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<Project>
          totalCount={filtered.length}
          actions={<Button size="small" type="primary" icon={<PlusOutlined />}>New</Button>}
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
            label: 'Project information',
            children: (
              <>
                <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={projStatusCfg[selected.status].color}>{projStatusCfg[selected.status].label}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Project manager">{selected.manager}</Descriptions.Item>
                  <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
                  <Descriptions.Item label="Start date">{selected.startDate}</Descriptions.Item>
                  <Descriptions.Item label="End date">{selected.endDate}</Descriptions.Item>
                  <Descriptions.Item label="Budget">KRW {selected.budget.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Progress">{selected.progress}%</Descriptions.Item>
                  <Descriptions.Item label="Members" span={2}>{selected.members.join(', ')}</Descriptions.Item>
                  <Descriptions.Item label="Description" span={2}>{selected.description}</Descriptions.Item>
                </Descriptions>
                <Space>
                  <Button type="primary" size="small">Save</Button>
                  <Button size="small" danger>Delete</Button>
                </Space>
              </>
            ),
          },
          {
            key: 'tasks',
            label: 'Tasks',
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
              ) : <Empty description="No tasks registered." />;
            })(),
          },
        ] : undefined}
      />
    </div>
  );
}
