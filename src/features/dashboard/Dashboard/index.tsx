import { Row, Col, Card, Statistic, Progress, Timeline, Tag, Typography, Avatar } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { mockProjects } from '@/mock/projects';
import { mockTasks, taskStatusColors, taskStatusLabels } from '@/mock/tasks';
import type { TaskStatus } from '@/mock/tasks';

const { Text } = Typography;

const activeProjects = mockProjects.filter((p) => p.status === 'active');
const completedProjects = mockProjects.filter((p) => p.status === 'completed');
const myTasks = mockTasks.filter((t) => t.assignee === '김영수');
const inProgressTasks = mockTasks.filter((t) => t.status === 'in_progress');

const recentActivities = [
  { time: '10분 전', content: '김영수님이 "API 서버 개발" 업무에 댓글을 남겼습니다.', color: 'blue' as const },
  { time: '30분 전', content: '이미영님이 "DB 스키마 설계" 업무를 완료했습니다.', color: 'green' as const },
  { time: '1시간 전', content: '한지은님이 "UI/UX 디자인" 업무를 검토 요청했습니다.', color: 'orange' as const },
  { time: '2시간 전', content: '송태현님이 "ETL 파이프라인 구축" 업무를 검토 요청했습니다.', color: 'orange' as const },
  { time: '3시간 전', content: '박정호님이 "모바일 앱 리뉴얼" 프로젝트 진행률을 40%로 업데이트했습니다.', color: 'blue' as const },
  { time: '어제', content: '임재혁님이 "AWS 환경 구성" 업무를 완료했습니다.', color: 'green' as const },
];

export default function Dashboard() {
  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="진행중 프로젝트"
              value={activeProjects.length}
              prefix={<ProjectOutlined />}
              styles={{ content: { color: '#1677ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="완료 프로젝트"
              value={completedProjects.length}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="진행중 업무"
              value={inProgressTasks.length}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#fa8c16' } }}
              suffix={<span style={{ fontSize: 14 }}>건</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="전체 인원"
              value={10}
              prefix={<TeamOutlined />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  <ArrowUpOutlined /> 2
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="프로젝트 진행 현황" size="small">
            {activeProjects.map((p) => (
              <div key={p.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>{p.name}</Text>
                  <Text type="secondary">{p.progress}%</Text>
                </div>
                <Progress
                  percent={p.progress}
                  showInfo={false}
                  strokeColor={p.progress >= 80 ? '#52c41a' : p.progress >= 50 ? '#1677ff' : '#fa8c16'}
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="최근 활동" size="small" style={{ maxHeight: 380, overflowY: 'auto' }}>
            <Timeline
              items={recentActivities.map((a) => ({
                color: a.color,
                content: (
                  <>
                    <Text type="secondary" style={{ fontSize: 12 }}>{a.time}</Text>
                    <br />
                    <Text style={{ fontSize: 13 }}>{a.content}</Text>
                  </>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="나의 업무" size="small">
            {myTasks.map((task) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Avatar style={{ backgroundColor: '#1677ff', flexShrink: 0 }}>{task.title[0]}</Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>{task.title}</div>
                  <div style={{ marginTop: 4 }}>
                    <Tag>{task.projectName}</Tag>
                    <Tag color={taskStatusColors[task.status as TaskStatus]}>
                      {taskStatusLabels[task.status as TaskStatus]}
                    </Tag>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>{task.dueDate}</Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="업무 상태 분포" size="small">
            {(['todo', 'in_progress', 'review', 'done', 'hold'] as TaskStatus[]).map((status) => {
              const count = mockTasks.filter((t) => t.status === status).length;
              const pct = Math.round((count / mockTasks.length) * 100);
              return (
                <div key={status} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Tag color={taskStatusColors[status]}>{taskStatusLabels[status]}</Tag>
                    <Text>{count}건 ({pct}%)</Text>
                  </div>
                  <Progress percent={pct} showInfo={false} size="small" />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
