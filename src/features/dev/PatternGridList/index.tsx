import { useState, useMemo } from 'react';
import { Input, Select, Badge, Progress, Button } from 'antd';
import { SearchOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import GridPanel from '@/components/grid/GridPanel';
import FilterPanel from '@/components/layout/FilterPanel';
import { mockProjects } from '@/mock/projects';
import type { Project, ProjectStatus } from '@/mock/projects';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

const projStatusCfg: Record<ProjectStatus, { label: string; color: string }> = {
  active:    { label: '진행중', color: 'processing' },
  completed: { label: '완료',   color: 'success' },
  hold:      { label: '보류',   color: 'error' },
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
    { field: 'name',     headerName: '프로젝트명', minWidth: 180 },
    { field: 'status',   headerName: '상태',      width: 100, flex: 0,
      cellRenderer: (p: ICellRendererParams<Project, ProjectStatus>) =>
        p.value ? <Badge status={projStatusCfg[p.value].color as any} text={projStatusCfg[p.value].label} /> : null,
    },
    { field: 'progress', headerName: '진행률',    width: 150, flex: 0, filter: false,
      cellRenderer: (p: ICellRendererParams<Project, number>) =>
        <Progress percent={p.value ?? 0} size="small" />,
    },
    { field: 'manager',  headerName: '담당자',    width: 100, flex: 0 },
    { field: 'category', headerName: '분류',      width: 110, flex: 0 },
    { field: 'budget',   headerName: '예산(원)',   width: 140, flex: 0,
      valueFormatter: (p) => p.value?.toLocaleString() ?? '',
    },
    { headerName: '기간', width: 210, flex: 0, sortable: false, filter: false,
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
          <span className="ds-filter-field-label">검색어</span>
          <Input placeholder="프로젝트명, 담당자" prefix={<SearchOutlined />} value={keyword}
            onChange={(e) => setKeyword(e.target.value)} allowClear />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">상태</span>
          <Select style={{ width: '100%' }} value={status} onChange={setStatus}
            options={[
              { value: 'all', label: '전체' },
              { value: 'active', label: '진행중' },
              { value: 'completed', label: '완료' },
              { value: 'hold', label: '보류' },
            ]}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">분류</span>
          <Select style={{ width: '100%' }} value={category} onChange={setCategory}
            options={[{ value: 'all', label: '전체' }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      </FilterPanel>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GridPanel<Project>
          totalCount={filtered.length}
          actions={
            <>
              <Button size="small" icon={<DownloadOutlined />}>엑셀</Button>
              <Button size="small" type="primary" icon={<PlusOutlined />}>등록</Button>
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
