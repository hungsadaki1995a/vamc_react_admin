import { useState } from 'react';
import { Badge, Button, Space, Typography } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Text } = Typography;

type NotificationType = 'info' | 'warning' | 'success' | 'user' | 'document';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  time: string;
  isRead: boolean;
}

const mockData: Notification[] = [
  { id: '1', type: 'warning', message: 'ERP 시스템 구축 프로젝트 마일스톤이 지연되고 있습니다.', time: '5분 전', isRead: false },
  { id: '2', type: 'user', message: '김철수님이 "모바일 앱 개발" 프로젝트에 배정되었습니다.', time: '1시간 전', isRead: false },
  { id: '3', type: 'success', message: '"웹사이트 리뉴얼" 프로젝트의 태스크가 완료되었습니다.', time: '2시간 전', isRead: true },
  { id: '4', type: 'document', message: '새로운 문서 "API 설계서 v3.0"이 업로드되었습니다.', time: '3시간 전', isRead: false },
  { id: '5', type: 'info', message: '내일 오후 2시 주간 진행상황 회의가 예정되어 있습니다.', time: '5시간 전', isRead: true },
  { id: '6', type: 'warning', message: '이슈 ISS-001 "로그인 세션 만료 오류"가 아직 해결되지 않았습니다.', time: '1일 전', isRead: false },
  { id: '7', type: 'user', message: '이영희님이 댓글을 남겼습니다: "검토 완료했습니다."', time: '1일 전', isRead: true },
  { id: '8', type: 'success', message: 'QA 테스트가 성공적으로 완료되었습니다.', time: '2일 전', isRead: true },
  { id: '9', type: 'document', message: '회의록 "프로젝트 킥오프 미팅"이 공유되었습니다.', time: '2일 전', isRead: true },
  { id: '10', type: 'info', message: '시스템 정기 점검이 예정되어 있습니다. (2024-02-15 02:00)', time: '3일 전', isRead: true },
];

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockData);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'warning':
        return <WarningOutlined style={{ fontSize: 20, color: '#faad14' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
      case 'user':
        return <UserAddOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
      case 'document':
        return <FileTextOutlined style={{ fontSize: 20, color: '#722ed1' }} />;
      default:
        return <InfoCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: !n.isRead } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div className="ds-section-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <h2>알림 센터</h2>
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </Space>
          <Button
            type="primary"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            모두 읽음
          </Button>
        </Space>
      </div>
      <div>
        {notifications.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              backgroundColor: item.isRead ? '#fff' : '#f0f5ff',
              padding: '16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f0f0f0'
            }}
            onClick={() => handleToggleRead(item.id)}
          >
            <span style={{ flexShrink: 0, paddingTop: 2 }}>{getIcon(item.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Space>
                <Text strong={!item.isRead}>{item.message}</Text>
                {!item.isRead && <Badge status="processing" />}
              </Space>
              <div style={{ marginTop: 4 }}>
                <Space>
                  <BellOutlined style={{ fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                </Space>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
