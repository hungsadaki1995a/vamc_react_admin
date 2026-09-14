import { useState, useMemo } from 'react';
import { Input, Select, Button, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import GridToolbar from '@/components/layout/GridToolbar';
import FilterPanel from '@/components/layout/FilterPanel';
import GridTable from '@/components/grid/GridTable';
import type { ColDef } from 'ag-grid-community';
import styles from './index.module.css';

interface Issue {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'task';
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'closed';
  assignee: string;
  createdAt: string;
}

const rawData: Issue[] = [
  { id: 'ISS-001', title: 'Login page error', type: 'bug', priority: 'high', status: 'open', assignee: 'John Doe', createdAt: '2025-03-01' },
  { id: 'ISS-002', title: 'Flicker when switching to dark mode', type: 'bug', priority: 'medium', status: 'in-progress', assignee: 'Michael Chen', createdAt: '2025-03-02' },
  { id: 'ISS-003', title: 'Add Excel download', type: 'feature', priority: 'medium', status: 'open', assignee: 'Emily Park', createdAt: '2025-03-03' },
  { id: 'ISS-004', title: 'Performance optimization', type: 'task', priority: 'low', status: 'closed', assignee: 'David Kim', createdAt: '2025-03-04' },
  { id: 'ISS-005', title: 'Handle API response errors', type: 'bug', priority: 'high', status: 'open', assignee: 'Sarah Lee', createdAt: '2025-03-05' },
  { id: 'ISS-006', title: 'Responsive mobile layout', type: 'feature', priority: 'low', status: 'closed', assignee: 'John Doe', createdAt: '2025-03-06' },
  { id: 'ISS-007', title: 'Session timeout warning not shown', type: 'bug', priority: 'medium', status: 'in-progress', assignee: 'Michelle Lee', createdAt: '2025-03-07' },
  { id: 'ISS-008', title: 'Grid pagination bug', type: 'bug', priority: 'high', status: 'open', assignee: 'Thomas Song', createdAt: '2025-03-08' },
  { id: 'ISS-009', title: 'Add multi-language support', type: 'feature', priority: 'medium', status: 'in-progress', assignee: 'Susan Choi', createdAt: '2025-03-09' },
  { id: 'ISS-010', title: 'Establish a code review process', type: 'task', priority: 'low', status: 'closed', assignee: 'Michael Chen', createdAt: '2025-03-10' },
  { id: 'ISS-011', title: 'File upload size limit error', type: 'bug', priority: 'high', status: 'open', assignee: 'Jacob Lim', createdAt: '2025-03-11' },
  { id: 'ISS-012', title: 'Dashboard chart data refresh lag', type: 'bug', priority: 'medium', status: 'in-progress', assignee: 'Andrew Jung', createdAt: '2025-03-12' },
  { id: 'ISS-013', title: 'Add PDF export', type: 'feature', priority: 'medium', status: 'open', assignee: 'Hannah Oh', createdAt: '2025-03-13' },
  { id: 'ISS-014', title: 'Improve unit test coverage', type: 'task', priority: 'low', status: 'in-progress', assignee: 'Laura Yoon', createdAt: '2025-03-14' },
  { id: 'ISS-015', title: 'Notification center read-state bug', type: 'bug', priority: 'high', status: 'open', assignee: 'Justin Kang', createdAt: '2025-03-15' },
  { id: 'ISS-016', title: 'Improve the menu permission model', type: 'feature', priority: 'high', status: 'closed', assignee: 'Michelle Lee', createdAt: '2025-03-16' },
  { id: 'ISS-017', title: 'Database index optimization', type: 'task', priority: 'medium', status: 'closed', assignee: 'Kevin Kwon', createdAt: '2025-03-17' },
  { id: 'ISS-018', title: 'Session not reset after password change', type: 'bug', priority: 'high', status: 'in-progress', assignee: 'Paul Park', createdAt: '2025-03-18' },
  { id: 'ISS-019', title: 'Persist tab order after drag and drop', type: 'feature', priority: 'low', status: 'open', assignee: 'Jane Han', createdAt: '2025-03-19' },
  { id: 'ISS-020', title: 'Write deployment automation scripts', type: 'task', priority: 'medium', status: 'closed', assignee: 'Erin Shin', createdAt: '2025-03-20' },
];

const typeColors: Record<string, string> = { bug: 'red', feature: 'blue', task: 'default' };
const priorityColors: Record<string, string> = { high: 'red', medium: 'orange', low: 'default' };
const statusColors: Record<string, string> = { open: 'blue', 'in-progress': 'orange', closed: 'default' };

export default function SampleFilterGrid() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [activeType, setActiveType] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  const filtered = useMemo(() => rawData.filter((row) => {
    if (activeType && row.type !== activeType) return false;
    if (activeStatus && row.status !== activeStatus) return false;
    if (activeKeyword && !row.title.includes(activeKeyword) && !row.assignee.includes(activeKeyword)) return false;
    return true;
  }), [activeType, activeStatus, activeKeyword]);

  const activeFilterCount = [activeType, activeStatus, activeKeyword].filter(Boolean).length;

  const colDefs: ColDef<Issue>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'type', headerName: 'Type', width: 90, cellRenderer: (p: { value: string }) => <Tag color={typeColors[p.value]}>{p.value}</Tag> },
    { field: 'priority', headerName: 'Priority', width: 100, cellRenderer: (p: { value: string }) => <Tag color={priorityColors[p.value]}>{p.value}</Tag> },
    { field: 'status', headerName: 'Status', width: 110, cellRenderer: (p: { value: string }) => <Tag color={statusColors[p.value]}>{p.value}</Tag> },
    { field: 'assignee', headerName: 'Assignee', width: 100 },
    { field: 'createdAt', headerName: 'Created', width: 110 },
  ];

  const handleSearch = () => {
    setActiveKeyword(keyword);
    setActiveType(typeFilter);
    setActiveStatus(statusFilter);
  };

  const handleReset = () => {
    setKeyword('');
    setTypeFilter('');
    setStatusFilter('');
    setActiveKeyword('');
    setActiveType('');
    setActiveStatus('');
  };

  return (
    <div className={styles['sample-filter-grid']}>
      <GridToolbar
        left="Issue list (filter-grid sample)"
        actions={<Button size="small" icon={<PlusOutlined />} type="primary">New</Button>}
      />
      <FilterPanel activeFilterCount={activeFilterCount} onSearch={handleSearch} onReset={handleReset}>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Type</span>
          <Select
            style={{ width: '100%' }}
            placeholder="All"
            value={typeFilter || undefined}
            onChange={setTypeFilter}
            allowClear
            options={[
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: 'Feature' },
              { value: 'task', label: 'Task' },
            ]}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Status</span>
          <Select
            style={{ width: '100%' }}
            placeholder="All"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            allowClear
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Keyword</span>
          <Input placeholder="Title, assignee" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </FilterPanel>
      <div className={styles['sample-grid-area']}>
        <GridTable
          rowData={filtered}
          columnDefs={colDefs}
          height="100%"
          rowHeight={24}
          headerHeight={26}
          defaultColDef={{ resizable: true, sortable: true }}
        />
      </div>
    </div>
  );
}
