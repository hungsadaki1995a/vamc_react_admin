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
  { id: '1', type: 'warning', message: 'A milestone on the ERP rollout project is running late.', time: '5 min ago', isRead: false },
  { id: '2', type: 'user', message: 'Chulsoo Kim has been assigned to the "Mobile app development" project.', time: '1 hour ago', isRead: false },
  { id: '3', type: 'success', message: 'A task on the "Website renewal" project has been completed.', time: '2 hours ago', isRead: true },
  { id: '4', type: 'document', message: 'A new document "API design spec v3.0" has been uploaded.', time: '3 hours ago', isRead: false },
  { id: '5', type: 'info', message: 'The weekly progress meeting is scheduled for tomorrow at 2 PM.', time: '5 hours ago', isRead: true },
  { id: '6', type: 'warning', message: 'Issue ISS-001 "Login session expiry error" is still unresolved.', time: '1 day ago', isRead: false },
  { id: '7', type: 'user', message: 'Younghee Lee left a comment: "Review complete."', time: '1 day ago', isRead: true },
  { id: '8', type: 'success', message: 'QA testing finished successfully.', time: '2 days ago', isRead: true },
  { id: '9', type: 'document', message: 'Meeting notes "Project kickoff" have been shared.', time: '2 days ago', isRead: true },
  { id: '10', type: 'info', message: 'Scheduled system maintenance is planned. (2024-02-15 02:00)', time: '3 days ago', isRead: true },
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
            <h2>Notification center</h2>
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </Space>
          <Button
            type="primary"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all read
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
