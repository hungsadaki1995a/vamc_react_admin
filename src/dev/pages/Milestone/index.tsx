import { Timeline, Card, Tag, Typography, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

const milestones = [
  { date: '2025-01-31', title: 'ERP database design complete', project: 'Next-gen ERP system', status: 'done' },
  { date: '2025-02-28', title: 'Website revamp complete', project: 'Website revamp', status: 'done' },
  { date: '2025-03-31', title: 'AWS infrastructure ready', project: 'Cloud migration', status: 'done' },
  { date: '2025-04-15', title: 'App design mockups approved', project: 'Mobile app renewal', status: 'review' },
  { date: '2025-04-30', title: 'ERP API development complete', project: 'Next-gen ERP system', status: 'in_progress' },
  { date: '2025-05-15', title: 'NLP model selected', project: 'AI chatbot rollout', status: 'in_progress' },
  { date: '2025-06-30', title: 'Analytics platform launch', project: 'Analytics platform', status: 'upcoming' },
  { date: '2025-09-30', title: 'ERP integration testing complete', project: 'Next-gen ERP system', status: 'upcoming' },
  { date: '2025-12-31', title: 'ERP system go-live', project: 'Next-gen ERP system', status: 'upcoming' },
];

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  review: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />,
  in_progress: <ClockCircleOutlined style={{ color: '#1677ff' }} />,
  upcoming: <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
};

const statusColor: Record<string, string> = {
  done: 'green', review: 'orange', in_progress: 'blue', upcoming: 'gray',
};

export default function MilestonePage() {
  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="Milestone" />
      <Card size="small">
        <Timeline
          items={milestones.map((m) => ({
            icon: statusIcon[m.status],
            content: (
              <Space orientation="vertical" size={2}>
                <Space>
                  <Text strong>{m.title}</Text>
                  <Tag color={statusColor[m.status]}>{m.status === 'done' ? 'Done' : m.status === 'review' ? 'In review' : m.status === 'in_progress' ? 'In progress' : 'Upcoming'}</Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>{m.project} · {m.date}</Text>
              </Space>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
