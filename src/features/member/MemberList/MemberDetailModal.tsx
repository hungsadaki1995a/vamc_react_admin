import { useState } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Tabs,
  Timeline,
  Space,
  Switch,
  Typography,
  Card,
  message,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { MemberItem } from './member.types';

const { Text, Title } = Typography;

interface MemberDetailModalProps {
  visible: boolean;
  member: MemberItem | null;
  onClose: () => void;
  onStatusChange?: (memberId: string, newAccountStatus: MemberItem['accountStatus']) => void;
  onApprovalChange?: (memberId: string, newApprovalStatus: MemberItem['approvalStatus']) => void;
}

export default function MemberDetailModal({
  visible,
  member,
  onClose,
  onStatusChange,
  onApprovalChange,
}: MemberDetailModalProps) {
  const [activeTab, setActiveTab] = useState('info');

  if (!member) return null;

  const isLocked = member.accountStatus === 'Locked';

  const handleToggleAccountStatus = (checked: boolean) => {
    const newStatus: MemberItem['accountStatus'] = checked ? 'Active' : 'Locked';
    onStatusChange?.(member.id, newStatus);
    message.success(`Account status updated to ${newStatus}`);
  };

  const handleQuickApprove = () => {
    onApprovalChange?.(member.id, 'Approved');
    message.success(`Member ${member.memberName} has been Approved`);
    onClose();
  };

  const handleQuickReject = () => {
    onApprovalChange?.(member.id, 'Rejected');
    message.warning(`Member ${member.memberName} has been Rejected`);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={760}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#e6f4ff',
              color: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <UserOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4} style={{ margin: 0 }}>
                {member.memberName}
              </Title>
              <Tag color="blue">{member.memberType}</Tag>
              <Tag
                color={
                  member.memberClassification === 'Verified'
                    ? 'default'
                    : member.memberClassification === 'Rejected'
                    ? 'error'
                    : 'warning'
                }
                style={{
                  borderRadius: 12,
                  fontWeight: 500,
                  background:
                    member.memberClassification === 'Verified' ? '#334155' : undefined,
                  color: member.memberClassification === 'Verified' ? '#fff' : undefined,
                }}
              >
                {member.memberClassification}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Member Code: <span style={{ fontWeight: 600, color: '#1677ff' }}>{member.memberCode}</span>
            </Text>
          </div>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleQuickReject}
          disabled={member.approvalStatus === 'Rejected'}
        >
          Reject
        </Button>,
        <Button
          key="approve"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleQuickApprove}
          disabled={member.approvalStatus === 'Approved'}
        >
          Approve Application
        </Button>,
      ]}
    >
      {/* Account Status Switch Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: 'var(--content-bg, #f8fafc)',
          borderRadius: 8,
          marginBottom: 16,
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        <Space>
          <SafetyCertificateOutlined style={{ fontSize: 16, color: isLocked ? '#ff4d4f' : '#52c41a' }} />
          <span>Account Active Status:</span>
          <span style={{ fontWeight: 600, color: isLocked ? '#ff4d4f' : '#52c41a' }}>
            {member.accountStatus}
          </span>
        </Space>
        <Space>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {isLocked ? 'Account is currently locked' : 'Account is active'}
          </span>
          <Switch
            checked={!isLocked}
            onChange={handleToggleAccountStatus}
            checkedChildren="Active"
            unCheckedChildren="Locked"
          />
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'info',
            label: (
              <span>
                <FileTextOutlined /> Member Information
              </span>
            ),
            children: (
              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, sm: 2, md: 2 }}
                labelStyle={{ width: 140, fontWeight: 500 }}
              >
                <Descriptions.Item label="Member Code">
                  <Text copyable style={{ fontWeight: 600, color: '#1677ff' }}>
                    {member.memberCode}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Application ID">
                  <Text copyable>{member.applicationId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Member Type">{member.memberType}</Descriptions.Item>
                <Descriptions.Item label="Classification">
                  <Tag>{member.memberClassification}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Member Name">{member.memberName}</Descriptions.Item>
                <Descriptions.Item label="Company Name">
                  {member.companyName !== '-' ? member.companyName : <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Phone Number">{member.phone}</Descriptions.Item>
                <Descriptions.Item label="Email Address">{member.email}</Descriptions.Item>
                <Descriptions.Item label="Assignee">
                  {member.assignee !== '-' ? member.assignee : <Text type="secondary">Unassigned</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Approval Status">
                  <Tag
                    color={
                      member.approvalStatus === 'Approved'
                        ? 'green'
                        : member.approvalStatus === 'Rejected'
                        ? 'red'
                        : member.approvalStatus === 'In Progress'
                        ? 'processing'
                        : 'orange'
                    }
                  >
                    {member.approvalStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Application Date">{member.applicationDate}</Descriptions.Item>
                <Descriptions.Item label="Received Date">{member.receivedDate}</Descriptions.Item>
                <Descriptions.Item label="Approval Date">{member.approvalDate}</Descriptions.Item>
                <Descriptions.Item label="Attachments Count">{member.attachments} file(s)</Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'docs',
            label: (
              <span>
                <PaperClipOutlined /> Attachments ({member.attachments})
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: member.attachments }).map((_, i) => (
                  <Card
                    key={i}
                    size="small"
                    style={{ borderRadius: 6, border: '1px solid #e2e8f0' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <PaperClipOutlined style={{ color: '#1677ff' }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {i === 0
                              ? 'National_ID_Card_Front_Back.pdf'
                              : i === 1
                              ? 'Business_Registration_Certificate.pdf'
                              : i === 2
                              ? 'Tax_Code_Verification.pdf'
                              : `Supporting_Document_${i + 1}.pdf`}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {((i + 1) * 1.2).toFixed(1)} MB • Uploaded {member.receivedDate}
                          </Text>
                        </div>
                      </Space>
                      <Button size="small" type="link">
                        Download
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> Audit History
              </span>
            ),
            children: (
              <Timeline
                style={{ marginTop: 12 }}
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <strong>Application Received</strong> - {member.receivedDate} 09:30
                        <div style={{ color: '#64748b', fontSize: 12 }}>
                          Submitted via VAMC NPL Portal by user
                        </div>
                      </div>
                    ),
                  },
                  {
                    color: member.assignee !== '-' ? 'blue' : 'gray',
                    children: (
                      <div>
                        <strong>Assigned to Officer</strong> - {member.receivedDate} 10:15
                        <div style={{ color: '#64748b', fontSize: 12 }}>
                          Assigned to: {member.assignee !== '-' ? member.assignee : 'Pending distribution'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    color:
                      member.approvalStatus === 'Approved'
                        ? 'green'
                        : member.approvalStatus === 'Rejected'
                        ? 'red'
                        : 'orange',
                    children: (
                      <div>
                        <strong>Current Status: {member.approvalStatus}</strong> - {member.approvalDate} 15:45
                        <div style={{ color: '#64748b', fontSize: 12 }}>
                          Updated by {member.assignee !== '-' ? member.assignee : 'System Administrator'}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
}
