import { useState, useEffect } from 'react';
import { Modal, Radio, Input, Select, Space, Typography, Tag, message } from 'antd';
import type { MemberItem, ApprovalStatus } from './member.types';

const { Text } = Typography;
const { TextArea } = Input;

interface ApprovalStatusModalProps {
  visible: boolean;
  member: MemberItem | null;
  onClose: () => void;
  onUpdateStatus: (memberId: string, newStatus: ApprovalStatus, assignee: string, note?: string) => void;
}

const statusOptions: { label: string; value: ApprovalStatus; color: string; desc: string }[] = [
  { label: 'Not Received', value: 'Not Received', color: 'orange', desc: 'Application not yet submitted/received' },
  { label: 'Requested', value: 'Requested', color: 'blue', desc: 'Application requested and awaiting processing' },
  { label: 'In Progress', value: 'In Progress', color: 'green', desc: 'Application is actively under review' },
  { label: 'Approved', value: 'Approved', color: 'cyan', desc: 'Application verified and approved' },
  { label: 'Rejected', value: 'Rejected', color: 'red', desc: 'Application rejected due to missing/invalid info' },
];

const assignees = ['Võ Ngọc Lan', 'Nguyễn Thu Trang', 'Lê Hoàng Nam', 'Phạm Minh Tuấn', 'Đỗ Thanh Tùng'];

export default function ApprovalStatusModal({
  visible,
  member,
  onClose,
  onUpdateStatus,
}: ApprovalStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus>('In Progress');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('Võ Ngọc Lan');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (member) {
      setSelectedStatus(member.approvalStatus);
      setSelectedAssignee(member.assignee !== '-' ? member.assignee : 'Võ Ngọc Lan');
      setNote('');
    }
  }, [member]);

  if (!member) return null;

  const handleConfirm = () => {
    onUpdateStatus(member.id, selectedStatus, selectedAssignee, note);
    message.success(`Status of ${member.memberName} updated to "${selectedStatus}"`);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Update Status"
      title="Change Approval Status"
      width={520}
    >
      <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
        <Space direction="vertical" size={2}>
          <Text>
            Member: <strong>{member.memberName}</strong> ({member.memberCode})
          </Text>
          <Text type="secondary">
            Current Status: <Tag>{member.approvalStatus}</Tag>
          </Text>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Target Approval Status
        </Text>
        <Radio.Group
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" orientation="vertical" style={{ width: '100%' }}>
            {statusOptions.map((opt) => (
              <Radio
                key={opt.value}
                value={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: selectedStatus === opt.value ? '1px solid #1677ff' : '1px solid #e2e8f0',
                  background: selectedStatus === opt.value ? '#f0f7ff' : '#fff',
                  width: '100%',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={opt.color}>{opt.label}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {opt.desc}
                  </Text>
                </div>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          Assignee
        </Text>
        <Select
          style={{ width: '100%' }}
          value={selectedAssignee}
          onChange={setSelectedAssignee}
          options={assignees.map((a) => ({ label: a, value: a }))}
        />
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          Review Note (Optional)
        </Text>
        <TextArea
          rows={3}
          placeholder="Add reason for approval, rejection, or inspection notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}

