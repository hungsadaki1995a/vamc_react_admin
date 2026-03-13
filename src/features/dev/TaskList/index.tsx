import { useState, useMemo, useCallback } from 'react';
import { Input, Select, Descriptions, Tag, Avatar, Button, Space } from 'antd';
import { SearchOutlined, UserOutlined, EditOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import GridTable from '@/components/grid/GridTable';
import FilterPanel from '@/components/layout/FilterPanel';
import GridToolbar from '@/components/layout/GridToolbar';
import DetailPanel from '@/components/layout/DetailPanel';
import DateCellEditor from '@/components/grid/cellEditors/DateCellEditor';
import SelectCellEditor from '@/components/grid/cellEditors/SelectCellEditor';
import TagsCellEditor from '@/components/grid/cellEditors/TagsCellEditor';
import UserCellEditor from '@/components/grid/cellEditors/UserCellEditor';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { mockTasks, taskStatusLabels, taskStatusColors, taskPriorityLabels, taskPriorityColors } from '@/mock/tasks';
import type { Task, TaskStatus, TaskPriority } from '@/mock/tasks';
import type { ColDef, ICellRendererParams, CellValueChangedEvent } from 'ag-grid-community';

const allTags = ['DB', '설계', 'API', '백엔드', '프론트엔드', 'UI', '디자인', 'UX', '모바일', 'RN', 'AI', 'NLP', '데이터', 'ETL', '시각화', '보안', '점검', '클라우드', 'AWS', 'QA', '테스트', '문서', '매뉴얼', '성능', '최적화', '마이그레이션'];

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

const mockComments: Record<string, Comment[]> = {
  T001: [
    { id: 'C1', author: '김영수', content: '스키마 초안 리뷰 완료했습니다. 인덱스 설계 추가 필요합니다.', createdAt: '2025-02-10 14:30' },
    { id: 'C2', author: '이미영', content: '인덱스 설계 반영했습니다. 재검토 부탁드립니다.', createdAt: '2025-02-11 09:15' },
  ],
  T002: [
    { id: 'C3', author: '송태현', content: 'RESTful API 설계 완료. Swagger 문서 공유드립니다.', createdAt: '2025-03-01 10:00' },
  ],
};

function StatusRenderer(params: ICellRendererParams<Task, TaskStatus>) {
  if (!params.value) return null;
  return <span className={`ant-tag ant-tag-${taskStatusColors[params.value]}`}>{taskStatusLabels[params.value]}</span>;
}

function PriorityRenderer(params: ICellRendererParams<Task, TaskPriority>) {
  if (!params.value) return null;
  return <span className={`ant-tag ant-tag-${taskPriorityColors[params.value]}`}>{taskPriorityLabels[params.value]}</span>;
}

function TagsRenderer(params: ICellRendererParams<Task, string[]>) {
  if (!params.value) return null;
  return (
    <>
      {params.value.map((t) => (
        <span key={t} className="ant-tag" style={{ marginRight: 4 }}>{t}</span>
      ))}
    </>
  );
}

export default function TaskList() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [rowData, setRowData] = useState<Task[]>(mockTasks);

  // Detail panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  const activeFilterCount = [statusFilter !== 'all', priorityFilter !== 'all', searchText.length > 0].filter(Boolean).length;

  const filteredData = useMemo(
    () =>
      rowData.filter((t) => {
        const matchSearch = t.title.includes(searchText) || t.projectName.includes(searchText);
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
      }),
    [rowData, searchText, statusFilter, priorityFilter],
  );

  const columnDefs = useMemo<ColDef<Task>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 80, flex: 0, editable: false },
      { field: 'title', headerName: '업무명', minWidth: 200, editable: true },
      { field: 'projectName', headerName: '프로젝트', width: 180, flex: 0, editable: false },
      {
        field: 'status', headerName: '상태', width: 110, flex: 0,
        cellRenderer: StatusRenderer, editable: true,
        cellEditor: SelectCellEditor,
        cellEditorParams: { values: Object.keys(taskStatusLabels), valueLabels: taskStatusLabels },
      },
      {
        field: 'priority', headerName: '우선순위', width: 110, flex: 0,
        cellRenderer: PriorityRenderer, editable: true,
        cellEditor: SelectCellEditor,
        cellEditorParams: { values: Object.keys(taskPriorityLabels), valueLabels: taskPriorityLabels },
      },
      { field: 'assignee', headerName: '담당자', width: 130, flex: 0, editable: true, cellEditor: UserCellEditor },
      { field: 'startDate', headerName: '시작일', width: 130, flex: 0, editable: true, cellEditor: DateCellEditor },
      { field: 'dueDate', headerName: '마감일', width: 130, flex: 0, editable: true, cellEditor: DateCellEditor },
      {
        field: 'tags', headerName: '태그', minWidth: 180,
        cellRenderer: TagsRenderer, editable: true,
        cellEditor: TagsCellEditor, cellEditorParams: { presetTags: allTags },
        filter: false, sortable: false,
      },
    ],
    [],
  );

  const handleCellValueChanged = useCallback((event: CellValueChangedEvent<Task>) => {
    setRowData((prev) => prev.map((t) => (t.id === event.data.id ? { ...event.data } : t)));
  }, []);

  const handleRowClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setEditDescription(task.description);
    setIsEditing(false);
  }, []);

  const handleReset = () => {
    setSearchText('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const comments = selectedTask ? (mockComments[selectedTask.id] ?? []) : [];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="ds-section-header">
        <h2>전체 업무</h2>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">업무명/프로젝트</span>
          <Input
            placeholder="검색어 입력"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">상태</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: '100%' }}
            options={[
              { label: '전체 상태', value: 'all' },
              ...Object.entries(taskStatusLabels).map(([k, v]) => ({ label: v, value: k })),
            ]}
          />
        </div>
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">우선순위</span>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: '100%' }}
            options={[
              { label: '전체 우선순위', value: 'all' },
              ...Object.entries(taskPriorityLabels).map(([k, v]) => ({ label: v, value: k })),
            ]}
          />
        </div>
      </FilterPanel>

      {/* Toolbar */}
      <GridToolbar
        totalCount={filteredData.length}
        actions={
          <>
            <Button size="small" icon={<DownloadOutlined />}>엑셀</Button>
            <Button size="small" type="primary" icon={<PlusOutlined />}>등록</Button>
          </>
        }
      />

      {/* GridTable */}
      <div style={{ flex: 1, minHeight: 200 }}>
        <GridTable<Task>
          columnDefs={columnDefs}
          rowData={filteredData}
          rowKey="id"
          editable
          enableClipboard
          rowSelection="multiRow"
          onRowClick={handleRowClick}
          onCellValueChanged={handleCellValueChanged}
        />
      </div>

      {/* Detail Panel */}
      <DetailPanel
        visible={!!selectedTask}
        title={
          selectedTask ? (
            <Space>
              <Tag color={taskStatusColors[selectedTask.status]}>{taskStatusLabels[selectedTask.status]}</Tag>
              {selectedTask.title}
            </Space>
          ) : undefined
        }
        onClose={() => { setSelectedTask(null); setIsEditing(false); }}
        tabs={selectedTask ? [
          {
            key: 'info',
            label: '기본정보',
            children: (
              <>
                <Descriptions column={2} size="small" style={{ marginBottom: 12 }}>
                  <Descriptions.Item label="프로젝트">{selectedTask.projectName}</Descriptions.Item>
                  <Descriptions.Item label="우선순위">
                    <Tag color={taskPriorityColors[selectedTask.priority]}>{taskPriorityLabels[selectedTask.priority]}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="담당자">{selectedTask.assignee}</Descriptions.Item>
                  <Descriptions.Item label="보고자">{selectedTask.reporter}</Descriptions.Item>
                  <Descriptions.Item label="시작일">{selectedTask.startDate}</Descriptions.Item>
                  <Descriptions.Item label="마감일">{selectedTask.dueDate}</Descriptions.Item>
                  <Descriptions.Item label="태그" span={2}>
                    {selectedTask.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>설명</span>
                  {!isEditing && (
                    <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>편집</Button>
                  )}
                </div>
                <RichTextEditor
                  value={isEditing ? editDescription : `<p>${selectedTask.description}</p>`}
                  onChange={setEditDescription}
                  toolbar={isEditing ? 'compact' : 'minimal'}
                  readOnly={!isEditing}
                  placeholder="업무 설명을 입력하세요..."
                  minHeight={80}
                  maxHeight={200}
                />
                {isEditing && (
                  <Space style={{ marginTop: 8 }}>
                    <Button type="primary" size="small" onClick={() => setIsEditing(false)}>저장</Button>
                    <Button size="small" onClick={() => { setIsEditing(false); setEditDescription(selectedTask.description); }}>취소</Button>
                  </Space>
                )}
              </>
            ),
          },
          {
            key: 'comments',
            label: '댓글',
            badge: comments.length,
            children: comments.length > 0 ? (
              <div>
                {comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Avatar icon={<UserOutlined />} size={28} style={{ flexShrink: 0 }} />
                    <div>
                      <Space>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{c.createdAt}</span>
                      </Space>
                      <div style={{ fontSize: 13 }}>{c.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', padding: '12px 0', fontSize: 13 }}>댓글이 없습니다.</div>
            ),
          },
          {
            key: 'history',
            label: '이력',
            children: (
              <div style={{ color: 'var(--text-secondary)', padding: '12px 0', fontSize: 13 }}>
                이력 데이터가 없습니다.
              </div>
            ),
          },
        ] : undefined}
      />
    </div>
  );
}
