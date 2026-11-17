import { useState, useMemo } from 'react';
import { Input, Select, Badge, Progress, Button } from 'antd';
import { SearchOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import GridPanel from '@/components/grid/GridPanel';
import FilterPanel from '@/components/layout/FilterPanel';
import { mockProjects } from '@/mock/projects';
import type { Project, ProjectStatus } from '@/mock/projects';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

const projStatusCfg: Record<ProjectStatus, { label: string; color: string }> = {
  active:    { label: 'In progress', color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
  hold:      { label: 'On hold',   color: 'error' },
};

export default function PatternGridList() {
  const [keyword, setKeyword]     = useState('');
  const [status, setStatus]       = useState('all');
  const [category, setCategory]   = useState('all');
  const [activeKw, setActiveKw]   = useState('');
  const [activeSt, setActiveSt]   = useState('all');
  const [activeCat, setActiveCat] = useState('all');

  const categories = useMemo(() => [...new Set(mockProjects.map((p) => p.category))], []);

  const filtered = useMemo(() =>
    mockProjects.filter((p) => {
      if (activeSt !== 'all' && p.status !== activeSt) return false;
      if (activeCat !== 'all' && p.category !== activeCat) return false;
      if (activeKw && !p.name.includes(activeKw) && !p.manager.includes(activeKw)) return false;
      return true;
    }),
    [activeKw, activeSt, activeCat],
  );

  const colDefs: ColDef<Project>[] = [
    { field: 'id',       headerName: 'ID',       width: 80,  flex: 0 },
    { field: 'name',     headerName: 'Project name', minWidth: 180 },
    { field: 'status',   headerName: 'Status',    width: 100, flex: 0,
      cellRenderer: (p: ICellRendererParams<Project, ProjectStatus>) =>
        p.value ? <Badge status={projStatusCfg[p.value].color as import('antd').BadgeProps['status']} text={projStatusCfg[p.value].label} /> : null,
    },
    { field: 'progress', headerName: 'Progress',  width: 150, flex: 0, filter: false,
      cellRenderer: (p: ICellRendererParams<Project, number>) =>
        <Progress percent={p.value ?? 0} size="small" />,
    },
    { field: 'manager',  headerName: 'Manager',   width: 100, flex: 0 },
    { field: 'category', headerName: 'Category',  width: 110, flex: 0 },
    { field: 'budget',   headerName: 'Budget (KRW)', width: 140, flex: 0,
      valueFormatter: (p) => p.value?.toLocaleString() ?? '',
    },
    { headerName: 'Period', width: 210, flex: 0, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Project>) =>
        p.data ? <>{p.data.startDate} ~ {p.data.endDate}</> : null,
    },
  ];

  const activeFilterCount = [activeSt !== 'all', activeCat !== 'all', !!activeKw].filter(Boolean).length;

  return (
    <div className="page-container">
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onSearch={() => { setActiveKw(keyword); setActiveSt(status); setActiveCat(category); }}
        onReset={() => {
          setKeyword(''); setStatus('all'); setCategory('all');
          setActiveKw(''); setActiveSt('all'); setActiveCat('all');
        }}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Keyword</span>
          <Input placeholder="Project name, manager" prefix={<SearchOutlined />} value={keyword}
            onChange={(e) => setKeyword(e.target.value)} allowClear />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Status</span>
          <Select style={{ width: '100%' }} value={status} onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'In progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'hold', label: 'On hold' },
            ]}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Category</span>
          <Select style={{ width: '100%' }} value={category} onChange={setCategory}
            options={[{ value: 'all', label: 'All' }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      </FilterPanel>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<Project>
          totalCount={filtered.length}
          actions={
            <>
              <Button size="small" icon={<DownloadOutlined />}>Excel</Button>
              <Button size="small" type="primary" icon={<PlusOutlined />}>New</Button>
            </>
          }
          columnDefs={colDefs}
          rowData={filtered}
          rowKey="id"
          height="100%"
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
        />
      </div>
    </div>
  );
}
