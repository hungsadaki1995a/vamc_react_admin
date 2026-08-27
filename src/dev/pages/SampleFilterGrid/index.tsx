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
  { id: 'ISS-001', title: '로그인 페이지 오류', type: 'bug', priority: 'high', status: 'open', assignee: '홍길동', createdAt: '2025-03-01' },
  { id: 'ISS-002', title: '다크모드 전환 시 깜빡임', type: 'bug', priority: 'medium', status: 'in-progress', assignee: '김철수', createdAt: '2025-03-02' },
  { id: 'ISS-003', title: '엑셀 다운로드 기능 추가', type: 'feature', priority: 'medium', status: 'open', assignee: '이영희', createdAt: '2025-03-03' },
  { id: 'ISS-004', title: '성능 최적화 작업', type: 'task', priority: 'low', status: 'closed', assignee: '박민수', createdAt: '2025-03-04' },
  { id: 'ISS-005', title: 'API 응답 오류 처리', type: 'bug', priority: 'high', status: 'open', assignee: '최지영', createdAt: '2025-03-05' },
  { id: 'ISS-006', title: '모바일 반응형 레이아웃', type: 'feature', priority: 'low', status: 'closed', assignee: '홍길동', createdAt: '2025-03-06' },
  { id: 'ISS-007', title: '세션 타임아웃 알림 미표시', type: 'bug', priority: 'medium', status: 'in-progress', assignee: '이미영', createdAt: '2025-03-07' },
  { id: 'ISS-008', title: '그리드 페이지네이션 버그', type: 'bug', priority: 'high', status: 'open', assignee: '송태현', createdAt: '2025-03-08' },
  { id: 'ISS-009', title: '다국어 지원 추가', type: 'feature', priority: 'medium', status: 'in-progress', assignee: '최수진', createdAt: '2025-03-09' },
  { id: 'ISS-010', title: '코드 리뷰 프로세스 수립', type: 'task', priority: 'low', status: 'closed', assignee: '김철수', createdAt: '2025-03-10' },
  { id: 'ISS-011', title: '파일 업로드 용량 제한 오류', type: 'bug', priority: 'high', status: 'open', assignee: '임재혁', createdAt: '2025-03-11' },
  { id: 'ISS-012', title: '대시보드 차트 데이터 갱신 지연', type: 'bug', priority: 'medium', status: 'in-progress', assignee: '정민우', createdAt: '2025-03-12' },
  { id: 'ISS-013', title: 'PDF 내보내기 기능 추가', type: 'feature', priority: 'medium', status: 'open', assignee: '오하늘', createdAt: '2025-03-13' },
  { id: 'ISS-014', title: '단위 테스트 커버리지 향상', type: 'task', priority: 'low', status: 'in-progress', assignee: '윤서연', createdAt: '2025-03-14' },
  { id: 'ISS-015', title: '알림 센터 읽음 처리 오류', type: 'bug', priority: 'high', status: 'open', assignee: '강민준', createdAt: '2025-03-15' },
  { id: 'ISS-016', title: '메뉴 권한 체계 개선', type: 'feature', priority: 'high', status: 'closed', assignee: '이미영', createdAt: '2025-03-16' },
  { id: 'ISS-017', title: 'DB 인덱스 최적화', type: 'task', priority: 'medium', status: 'closed', assignee: '권도현', createdAt: '2025-03-17' },
  { id: 'ISS-018', title: '비밀번호 변경 후 세션 초기화 누락', type: 'bug', priority: 'high', status: 'in-progress', assignee: '박정호', createdAt: '2025-03-18' },
  { id: 'ISS-019', title: '드래그앤드롭 탭 순서 저장', type: 'feature', priority: 'low', status: 'open', assignee: '한지은', createdAt: '2025-03-19' },
  { id: 'ISS-020', title: '배포 자동화 스크립트 작성', type: 'task', priority: 'medium', status: 'closed', assignee: '신예진', createdAt: '2025-03-20' },
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
    { field: 'title', headerName: '제목', flex: 1 },
    { field: 'type', headerName: '유형', width: 90, cellRenderer: (p: { value: string }) => <Tag color={typeColors[p.value]}>{p.value}</Tag> },
    { field: 'priority', headerName: '우선순위', width: 100, cellRenderer: (p: { value: string }) => <Tag color={priorityColors[p.value]}>{p.value}</Tag> },
    { field: 'status', headerName: '상태', width: 110, cellRenderer: (p: { value: string }) => <Tag color={statusColors[p.value]}>{p.value}</Tag> },
    { field: 'assignee', headerName: '담당자', width: 100 },
    { field: 'createdAt', headerName: '등록일', width: 110 },
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
        left="이슈 목록 (필터-그리드 샘플)"
        actions={<Button size="small" icon={<PlusOutlined />} type="primary">신규</Button>}
      />
      <FilterPanel activeFilterCount={activeFilterCount} onSearch={handleSearch} onReset={handleReset}>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">유형</span>
          <Select
            style={{ width: '100%' }}
            placeholder="전체"
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
          <span className="ds-filter-field-label">상태</span>
          <Select
            style={{ width: '100%' }}
            placeholder="전체"
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
          <span className="ds-filter-field-label">검색어</span>
          <Input placeholder="제목, 담당자" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
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
