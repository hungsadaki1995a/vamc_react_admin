import { Timeline, Card, Tag, Typography, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const milestones = [
  { date: '2025-01-31', title: 'ERP DB 설계 완료', project: '차세대 ERP 시스템', status: 'done' },
  { date: '2025-02-28', title: '홈페이지 개편 완료', project: '홈페이지 개편', status: 'done' },
  { date: '2025-03-31', title: 'AWS 인프라 구성 완료', project: '클라우드 마이그레이션', status: 'done' },
  { date: '2025-04-15', title: '앱 디자인 시안 확정', project: '모바일 앱 리뉴얼', status: 'review' },
  { date: '2025-04-30', title: 'ERP API 개발 완료', project: '차세대 ERP 시스템', status: 'in_progress' },
  { date: '2025-05-15', title: 'NLP 모델 선정 완료', project: 'AI 챗봇 도입', status: 'in_progress' },
  { date: '2025-06-30', title: '데이터 분석 플랫폼 오픈', project: '데이터 분석 플랫폼', status: 'upcoming' },
  { date: '2025-09-30', title: 'ERP 통합 테스트 완료', project: '차세대 ERP 시스템', status: 'upcoming' },
  { date: '2025-12-31', title: 'ERP 시스템 오픈', project: '차세대 ERP 시스템', status: 'upcoming' },
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
      <div className="ds-section-header"><h2>마일스톤</h2></div>
      <Card size="small">
        <Timeline
          items={milestones.map((m) => ({
            icon: statusIcon[m.status],
            content: (
              <Space orientation="vertical" size={2}>
                <Space>
                  <Text strong>{m.title}</Text>
                  <Tag color={statusColor[m.status]}>{m.status === 'done' ? '완료' : m.status === 'review' ? '검토중' : m.status === 'in_progress' ? '진행중' : '예정'}</Tag>
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
