import { useState, useRef, useCallback } from 'react';
import { Select, Button, Space, Drawer, Tag, Progress, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { GanttSheet } from '@/components/gantt-sheet';
import type { GanttTask, GanttViewMode } from '@/components/gantt-sheet';
import GridToolbar from '@/components/layout/GridToolbar';

const { Text } = Typography;

// ─── Mock data: 2 projects with tree structure ───────────────────────────────
const initialTasks: GanttTask[] = [
  // ── Project 1: ERP System ──────────────────────────────────────────────
  { id: 'PRJ1', name: '차세대 ERP 시스템', start: '2025-01-02', end: '2026-06-30', progress: 45, isGroup: true, level: 0 },

  { id: 'P1-1', name: '기획 단계', start: '2025-01-02', end: '2025-03-31', progress: 100, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T1', name: '요구사항 분석', start: '2025-01-02', end: '2025-01-31', progress: 100, assignee: '홍길동', level: 2, parentId: 'P1-1', projectName: 'ERP 시스템' },
  { id: 'T2', name: '아키텍처 설계', start: '2025-02-01', end: '2025-02-28', progress: 100, assignee: '김철수', level: 2, parentId: 'P1-1', dependencies: ['T1'], projectName: 'ERP 시스템' },
  { id: 'T3', name: 'DB 설계', start: '2025-02-15', end: '2025-03-31', progress: 100, assignee: '최지영', level: 2, parentId: 'P1-1', dependencies: ['T2'], projectName: 'ERP 시스템' },

  { id: 'P1-2', name: '개발 단계', start: '2025-04-01', end: '2025-12-31', progress: 70, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T4', name: '백엔드 API 개발', start: '2025-04-01', end: '2025-08-31', progress: 90, assignee: '박민수', level: 2, parentId: 'P1-2', dependencies: ['T3'], projectName: 'ERP 시스템' },
  { id: 'T5', name: '프론트엔드 개발', start: '2025-05-01', end: '2025-10-31', progress: 75, assignee: '이영희', level: 2, parentId: 'P1-2', dependencies: ['T2'], projectName: 'ERP 시스템' },
  { id: 'T6', name: '성능 최적화', start: '2025-09-01', end: '2025-12-31', progress: 30, assignee: '홍길동', level: 2, parentId: 'P1-2', dependencies: ['T4', 'T5'], projectName: 'ERP 시스템' },

  { id: 'P1-3', name: '테스트 단계', start: '2026-01-02', end: '2026-04-30', progress: 20, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T7', name: '단위 테스트', start: '2026-01-02', end: '2026-02-28', progress: 50, assignee: '최지영', level: 2, parentId: 'P1-3', dependencies: ['T6'], projectName: 'ERP 시스템' },
  { id: 'T8', name: '통합 테스트', start: '2026-03-01', end: '2026-04-15', progress: 10, assignee: '박민수', level: 2, parentId: 'P1-3', dependencies: ['T7'], projectName: 'ERP 시스템' },
  { id: 'T9', name: '사용자 수용 테스트', start: '2026-03-15', end: '2026-04-30', progress: 0, assignee: '이영희', level: 2, parentId: 'P1-3', dependencies: ['T7'], projectName: 'ERP 시스템' },

  { id: 'P1-4', name: '오픈 준비', start: '2026-05-01', end: '2026-06-30', progress: 0, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T10', name: '데이터 마이그레이션', start: '2026-05-01', end: '2026-05-31', progress: 0, assignee: '홍길동', level: 2, parentId: 'P1-4', dependencies: ['T8'], projectName: 'ERP 시스템' },
  { id: 'T11', name: '운영 이관', start: '2026-06-01', end: '2026-06-20', progress: 0, assignee: '김철수', level: 2, parentId: 'P1-4', dependencies: ['T10'], projectName: 'ERP 시스템' },
  { id: 'T12', name: 'ERP 오픈', start: '2026-06-21', end: '2026-06-30', progress: 0, assignee: '전체', level: 2, parentId: 'P1-4', dependencies: ['T11'], projectName: 'ERP 시스템', milestone: true },

  // ── Project 2: Mobile App ──────────────────────────────────────────────
  { id: 'PRJ2', name: '모바일 앱 개발', start: '2025-07-01', end: '2026-06-30', progress: 35, isGroup: true, level: 0 },

  { id: 'P2-1', name: '기획·설계', start: '2025-07-01', end: '2025-09-30', progress: 100, isGroup: true, level: 1, parentId: 'PRJ2' },
  { id: 'T13', name: 'UX 리서치', start: '2025-07-01', end: '2025-07-31', progress: 100, assignee: '정수연', level: 2, parentId: 'P2-1', projectName: '모바일 앱' },
  { id: 'T14', name: '화면 설계', start: '2025-08-01', end: '2025-09-15', progress: 100, assignee: '정수연', level: 2, parentId: 'P2-1', dependencies: ['T13'], projectName: '모바일 앱' },
  { id: 'T15', name: '디자인 시스템 구성', start: '2025-08-15', end: '2025-09-30', progress: 100, assignee: '오민준', level: 2, parentId: 'P2-1', dependencies: ['T13'], projectName: '모바일 앱' },

  { id: 'P2-2', name: '개발', start: '2025-10-01', end: '2026-03-31', progress: 40, isGroup: true, level: 1, parentId: 'PRJ2' },
  { id: 'T16', name: 'iOS 개발', start: '2025-10-01', end: '2026-02-28', progress: 50, assignee: '이성호', level: 2, parentId: 'P2-2', dependencies: ['T14', 'T15'], projectName: '모바일 앱' },
  { id: 'T17', name: 'Android 개발', start: '2025-10-01', end: '2026-02-28', progress: 45, assignee: '강다은', level: 2, parentId: 'P2-2', dependencies: ['T14', 'T15'], projectName: '모바일 앱' },
  { id: 'T18', name: 'API 연동', start: '2025-11-01', end: '2026-01-31', progress: 60, assignee: '박민수', level: 2, parentId: 'P2-2', dependencies: ['T14'], projectName: '모바일 앱' },
  { id: 'T19', name: '푸시 알림 설정', start: '2026-01-01', end: '2026-02-28', progress: 20, assignee: '이성호', level: 2, parentId: 'P2-2', dependencies: ['T18'], projectName: '모바일 앱' },

  { id: 'P2-3', name: '출시 준비', start: '2026-04-01', end: '2026-06-30', progress: 0, isGroup: true, level: 1, parentId: 'PRJ2' },
  { id: 'T20', name: '베타 테스트', start: '2026-04-01', end: '2026-05-15', progress: 0, assignee: '정수연', level: 2, parentId: 'P2-3', dependencies: ['T16', 'T17'], projectName: '모바일 앱' },
  { id: 'T21', name: '앱스토어 심사', start: '2026-05-16', end: '2026-06-15', progress: 0, assignee: '오민준', level: 2, parentId: 'P2-3', dependencies: ['T20'], projectName: '모바일 앱' },
  { id: 'T22', name: '앱 공식 출시', start: '2026-06-16', end: '2026-06-30', progress: 0, assignee: '전체', level: 2, parentId: 'P2-3', dependencies: ['T21'], projectName: '모바일 앱', milestone: true },
];

const statusColor: Record<number, string> = { 0: 'default', 25: 'blue', 50: 'blue', 75: 'orange', 100: 'green' };
const priorityLabel: Record<string, string> = { low: '낮음', medium: '보통', high: '높음', critical: '긴급' };

export default function GanttChart() {
  const [viewMode, setViewMode] = useState<GanttViewMode>('Week');
  const [tasks, setTasks] = useState<GanttTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const scrollToTodayRef = useRef<(() => void) | null>(null);

  const handleTaskClick = useCallback((task: GanttTask) => {
    setSelectedTask(task);
  }, []);

  const handleDateChange = useCallback((task: GanttTask, start: Date, end: Date) => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, start: fmt(start), end: fmt(end) } : t))
    );
  }, []);

  const handleProgressChange = useCallback((task: GanttTask, progress: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, progress: Math.round(progress) } : t))
    );
  }, []);

  const getProgressColor = (p: number) => {
    if (p === 100) return '#52c41a';
    if (p >= 70) return '#1677ff';
    if (p >= 30) return '#fa8c16';
    return '#ff4d4f';
  };

  return (
    <div className="page-container">
      <GridToolbar
        left="간트 차트"
        actions={
          <Space>
            <Select
              size="small"
              value={viewMode}
              onChange={setViewMode}
              style={{ width: 90 }}
              options={[
                { value: 'Day', label: '일간' },
                { value: 'Week', label: '주간' },
                { value: 'Month', label: '월간' },
              ]}
            />
            <Button size="small" icon={<CalendarOutlined />} onClick={() => scrollToTodayRef.current?.()}>
              오늘
            </Button>
          </Space>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <GanttSheet
          tasks={tasks}
          viewMode={viewMode}
          onTaskClick={handleTaskClick}
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
          scrollToTodayRef={scrollToTodayRef}
          todayButton={false}
        />
      </div>

      <Drawer
        title={selectedTask?.name ?? ''}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        size="default"
      >
        {selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>ID</Text>
              <div><Text code>{selectedTask.id}</Text></div>
            </div>
            {selectedTask.projectName && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>프로젝트</Text>
                <div><Text>{selectedTask.projectName}</Text></div>
              </div>
            )}
            {selectedTask.assignee && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>담당자</Text>
                <div><Text>{selectedTask.assignee}</Text></div>
              </div>
            )}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>기간</Text>
              <div><Text>{selectedTask.start} ~ {selectedTask.end}</Text></div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>진행률</Text>
              <Progress
                percent={selectedTask.progress}
                strokeColor={getProgressColor(selectedTask.progress)}
                size="small"
              />
            </div>
            {selectedTask.priority && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>우선순위</Text>
                <div>
                  <Tag color={selectedTask.priority === 'critical' ? 'red' : selectedTask.priority === 'high' ? 'orange' : 'blue'}>
                    {priorityLabel[selectedTask.priority] ?? selectedTask.priority}
                  </Tag>
                </div>
              </div>
            )}
            {selectedTask.milestone && (
              <div>
                <Tag color="purple">마일스톤</Tag>
              </div>
            )}
            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>선행 작업</Text>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {selectedTask.dependencies.map((d) => (
                    <Tag key={d}>{d}</Tag>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Tag color={statusColor[Math.round(selectedTask.progress / 25) * 25] ?? 'default'}>
                {selectedTask.progress === 100 ? '완료' : selectedTask.progress === 0 ? '대기' : '진행중'}
              </Tag>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
