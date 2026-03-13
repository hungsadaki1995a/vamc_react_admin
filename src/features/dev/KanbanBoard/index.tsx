import { useState } from 'react';
import { Card, Tag, Avatar, Typography, Space, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { mockTasks, taskStatusLabels, taskPriorityColors, taskPriorityLabels } from '@/mock/tasks';
import type { Task, TaskStatus } from '@/mock/tasks';

const { Text } = Typography;

const kanbanColumns: { status: TaskStatus; color: string }[] = [
  { status: 'todo', color: '#d9d9d9' },
  { status: 'in_progress', color: '#1677ff' },
  { status: 'review', color: '#fa8c16' },
  { status: 'done', color: '#52c41a' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks.filter((t) => t.status !== 'hold'));
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDrop = (targetStatus: TaskStatus) => {
    if (!draggedTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask ? { ...t, status: targetStatus } : t))
    );
    setDraggedTask(null);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        {kanbanColumns.map(({ status, color }) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div
              key={status}
              style={{ flex: '1 1 250px', minWidth: 250, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={color} />
                <Text strong>{taskStatusLabels[status]}</Text>
                <Tag>{columnTasks.length}</Tag>
              </div>
              <div style={{
                flex: 1, background: '#fafafa', borderRadius: 8, padding: 8,
                display: 'flex', flexDirection: 'column', gap: 8,
                border: draggedTask ? '2px dashed #d9d9d9' : '2px solid transparent',
                overflowY: 'auto',
              }}>
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    size="small"
                    hoverable
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    style={{ cursor: 'grab' }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      <Tag color={taskPriorityColors[task.priority]} style={{ fontSize: 11 }}>
                        {taskPriorityLabels[task.priority]}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{task.id}</Text>
                    </div>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                      {task.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      {task.projectName}
                    </Text>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space size={4}>
                        <Avatar size={20} icon={<UserOutlined />} />
                        <Text style={{ fontSize: 12 }}>{task.assignee}</Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 11 }}>{task.dueDate}</Text>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
