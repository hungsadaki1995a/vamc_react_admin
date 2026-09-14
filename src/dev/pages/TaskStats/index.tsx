import { Row, Col, Card, Statistic, Progress, Tag, Typography } from 'antd';
import { mockTasks, taskStatusLabels, taskStatusColors, taskPriorityLabels, taskPriorityColors } from '@/mock/tasks';
import type { TaskStatus, TaskPriority } from '@/mock/tasks';

const { Text } = Typography;

const statusCounts = (Object.keys(taskStatusLabels) as TaskStatus[]).map((s) => ({
  status: s, count: mockTasks.filter((t) => t.status === s).length,
}));

const priorityCounts = (Object.keys(taskPriorityLabels) as TaskPriority[]).map((p) => ({
  priority: p, count: mockTasks.filter((t) => t.priority === p).length,
}));

const projectCounts = [...new Set(mockTasks.map((t) => t.projectName))].map((name) => ({
  name, count: mockTasks.filter((t) => t.projectName === name).length,
})).sort((a, b) => b.count - a.count);

export default function TaskStats() {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Tasks by status" size="small">
            {statusCounts.map(({ status, count }) => (
              <div key={status} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tag color={taskStatusColors[status]}>{taskStatusLabels[status]}</Tag>
                  <Text strong>{count}</Text>
                </div>
                <Progress percent={Math.round((count / mockTasks.length) * 100)} size="small" showInfo={false} />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Tasks by priority" size="small">
            {priorityCounts.map(({ priority, count }) => (
              <div key={priority} style={{ marginBottom: 16, textAlign: 'center' }}>
                <Statistic
                  title={<Tag color={taskPriorityColors[priority]}>{taskPriorityLabels[priority]}</Tag>}
                  value={count}
                  suffix="tasks"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Tasks by project" size="small">
            {projectCounts.map(({ name, count }) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text ellipsis style={{ maxWidth: 180 }}>{name}</Text>
                <Tag color="blue">{count}</Tag>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </>
  );
}
