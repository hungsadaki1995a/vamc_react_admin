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
  { id: 'PRJ1', name: 'Next-gen ERP system', start: '2025-01-02', end: '2026-06-30', progress: 45, isGroup: true, level: 0 },

  { id: 'P1-1', name: 'Planning phase', start: '2025-01-02', end: '2025-03-31', progress: 100, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T1', name: 'Requirements analysis', start: '2025-01-02', end: '2025-01-31', progress: 100, assignee: 'John Doe', level: 2, parentId: 'P1-1', projectName: 'ERP system' },
  { id: 'T2', name: 'Architecture design', start: '2025-02-01', end: '2025-02-28', progress: 100, assignee: 'Michael Chen', level: 2, parentId: 'P1-1', dependencies: ['T1'], projectName: 'ERP system' },
  { id: 'T3', name: 'Database design', start: '2025-02-15', end: '2025-03-31', progress: 100, assignee: 'Sarah Lee', level: 2, parentId: 'P1-1', dependencies: ['T2'], projectName: 'ERP system' },

  { id: 'P1-2', name: 'Development phase', start: '2025-04-01', end: '2025-12-31', progress: 70, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T4', name: 'Backend API development', start: '2025-04-01', end: '2025-08-31', progress: 90, assignee: 'David Kim', level: 2, parentId: 'P1-2', dependencies: ['T3'], projectName: 'ERP system' },
  { id: 'T5', name: 'Front-end development', start: '2025-05-01', end: '2025-10-31', progress: 75, assignee: 'Emily Park', level: 2, parentId: 'P1-2', dependencies: ['T2'], projectName: 'ERP system' },
  { id: 'T6', name: 'Performance tuning', start: '2025-09-01', end: '2025-12-31', progress: 30, assignee: 'John Doe', level: 2, parentId: 'P1-2', dependencies: ['T4', 'T5'], projectName: 'ERP system' },

  { id: 'P1-3', name: 'Testing phase', start: '2026-01-02', end: '2026-04-30', progress: 20, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T7', name: 'Unit testing', start: '2026-01-02', end: '2026-02-28', progress: 50, assignee: 'Sarah Lee', level: 2, parentId: 'P1-3', dependencies: ['T6'], projectName: 'ERP system' },
  { id: 'T8', name: 'Integration testing', start: '2026-03-01', end: '2026-04-15', progress: 10, assignee: 'David Kim', level: 2, parentId: 'P1-3', dependencies: ['T7'], projectName: 'ERP system' },
  { id: 'T9', name: 'User acceptance testing', start: '2026-03-15', end: '2026-04-30', progress: 0, assignee: 'Emily Park', level: 2, parentId: 'P1-3', dependencies: ['T7'], projectName: 'ERP system' },

  { id: 'P1-4', name: 'Launch preparation', start: '2026-05-01', end: '2026-06-30', progress: 0, isGroup: true, level: 1, parentId: 'PRJ1' },
  { id: 'T10', name: 'Data migration', start: '2026-05-01', end: '2026-05-31', progress: 0, assignee: 'John Doe', level: 2, parentId: 'P1-4', dependencies: ['T8'], projectName: 'ERP system' },
  { id: 'T11', name: 'Handover to operations', start: '2026-06-01', end: '2026-06-20', progress: 0, assignee: 'Michael Chen', level: 2, parentId: 'P1-4', dependencies: ['T10'], projectName: 'ERP system' },
  { id: 'T12', name: 'ERP go-live', start: '2026-06-21', end: '2026-06-30', progress: 0, assignee: 'Everyone', level: 2, parentId: 'P1-4', dependencies: ['T11'], projectName: 'ERP system', milestone: true },

  // ── Project 2: Mobile App ──────────────────────────────────────────────
  { id: 'PRJ2', name: 'Mobile app development', start: '2025-07-01', end: '2026-06-30', progress: 35, isGroup: true, level: 0 },

  { id: 'P2-1', name: 'Planning and design', start: '2025-07-01', end: '2025-09-30', progress: 100, isGroup: true, level: 1, parentId: 'PRJ2' },
  { id: 'T13', name: 'UX research', start: '2025-07-01', end: '2025-07-31', progress: 100, assignee: 'Sophia Jung', level: 2, parentId: 'P2-1', projectName: 'Mobile app' },
  { id: 'T14', name: 'Screen design', start: '2025-08-01', end: '2025-09-15', progress: 100, assignee: 'Sophia Jung', level: 2, parentId: 'P2-1', dependencies: ['T13'], projectName: 'Mobile app' },
  { id: 'T15', name: 'Design system setup', start: '2025-08-15', end: '2025-09-30', progress: 100, assignee: 'Nathan Oh', level: 2, parentId: 'P2-1', dependencies: ['T13'], projectName: 'Mobile app' },

  { id: 'P2-2', name: 'Development', start: '2025-10-01', end: '2026-03-31', progress: 40, isGroup: true, level: 1, parentId: 'PRJ2' },
  { id: 'T16', name: 'iOS development', start: '2025-10-01', end: '2026-02-28', progress: 50, assignee: 'Leo Lee', level: 2, parentId: 'P2-2', dependencies: ['T14', 'T15'], projectName: 'Mobile app' },
  { id: 'T17', name: 'Android development', start: '2025-10-01', end: '2026-02-28', progress: 45, assignee: 'Diana Kang', level: 2, parentId: 'P2-2', dependencies: ['T14', 'T15'], projectName: 'Mobile app' },
  { id: 'T18', name: 'API integration', start: '2025-11-01', end: '2026-01-31', progress: 60, assignee: 'David Kim', level: 2, parentId: 'P2-2', dependencies: ['T14'], projectName: 'Mobile app' },
  { id: 'T19', name: 'Push notification setup', start: '2026-01-01', end: '2026-02-28', progress: 20, assignee: 'Leo Lee', level: 2, parentId: 'P2-2', dependencies: ['T18'], projectName: 'Mobile app' },

  { id: 'P2-3', name: 'Release preparation', start: '2026-04-01', end: '2026-06-30', progress: 0, isGroup: true, level: 1, parentId: 'PRJ2' },
  { id: 'T20', name: 'Beta testing', start: '2026-04-01', end: '2026-05-15', progress: 0, assignee: 'Sophia Jung', level: 2, parentId: 'P2-3', dependencies: ['T16', 'T17'], projectName: 'Mobile app' },
  { id: 'T21', name: 'App store review', start: '2026-05-16', end: '2026-06-15', progress: 0, assignee: 'Nathan Oh', level: 2, parentId: 'P2-3', dependencies: ['T20'], projectName: 'Mobile app' },
  { id: 'T22', name: 'Public app launch', start: '2026-06-16', end: '2026-06-30', progress: 0, assignee: 'Everyone', level: 2, parentId: 'P2-3', dependencies: ['T21'], projectName: 'Mobile app', milestone: true },
];

const statusColor: Record<number, string> = { 0: 'default', 25: 'blue', 50: 'blue', 75: 'orange', 100: 'green' };
const priorityLabel: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

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
        left="Gantt chart"
        actions={
          <Space>
            <Select
              size="small"
              value={viewMode}
              onChange={setViewMode}
              style={{ width: 90 }}
              options={[
                { value: 'Day', label: 'Day' },
                { value: 'Week', label: 'Week' },
                { value: 'Month', label: 'Month' },
              ]}
            />
            <Button size="small" icon={<CalendarOutlined />} onClick={() => scrollToTodayRef.current?.()}>
              Today
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
                <Text type="secondary" style={{ fontSize: 12 }}>Project</Text>
                <div><Text>{selectedTask.projectName}</Text></div>
              </div>
            )}
            {selectedTask.assignee && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Assignee</Text>
                <div><Text>{selectedTask.assignee}</Text></div>
              </div>
            )}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Period</Text>
              <div><Text>{selectedTask.start} ~ {selectedTask.end}</Text></div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Progress</Text>
              <Progress
                percent={selectedTask.progress}
                strokeColor={getProgressColor(selectedTask.progress)}
                size="small"
              />
            </div>
            {selectedTask.priority && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Priority</Text>
                <div>
                  <Tag color={selectedTask.priority === 'critical' ? 'red' : selectedTask.priority === 'high' ? 'orange' : 'blue'}>
                    {priorityLabel[selectedTask.priority] ?? selectedTask.priority}
                  </Tag>
                </div>
              </div>
            )}
            {selectedTask.milestone && (
              <div>
                <Tag color="purple">Milestone</Tag>
              </div>
            )}
            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Predecessors</Text>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {selectedTask.dependencies.map((d) => (
                    <Tag key={d}>{d}</Tag>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Tag color={statusColor[Math.round(selectedTask.progress / 25) * 25] ?? 'default'}>
                {selectedTask.progress === 100 ? 'Done' : selectedTask.progress === 0 ? 'Not started' : 'In progress'}
              </Tag>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
