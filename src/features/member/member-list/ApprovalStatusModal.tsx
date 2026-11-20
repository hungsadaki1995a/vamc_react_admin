import { useState } from 'react';
import { Modal, Radio, Input, Select, Space, Typography, Tag } from 'antd';
import { useNotify } from '@/hooks/use-notify';
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
  const { toast } = useNotify();
  const [draft, setDraft] = useState<{
    memberId?: string;
    status: ApprovalStatus;
    assignee: string;
    note: string;
  }>({ status: 'In Progress', assignee: 'Võ Ngọc Lan', note: '' });

  if (!member) return null;

  const isSameMember = draft.memberId === member.id;
  const selectedStatus = isSameMember ? draft.status : member.approvalStatus;
  const selectedAssignee = isSameMember
    ? draft.assignee
    : (member.assignee !== '-' ? member.assignee : 'Võ Ngọc Lan');
  const note = isSameMember ? draft.note : '';

  const setSelectedStatus = (status: ApprovalStatus) =>
    setDraft({ memberId: member.id, status, assignee: selectedAssignee, note });
  const setSelectedAssignee = (assignee: string) =>
    setDraft({ memberId: member.id, status: selectedStatus, assignee, note });
  const setNote = (nextNote: string) =>
    setDraft({ memberId: member.id, status: selectedStatus, assignee: selectedAssignee, note: nextNote });

  const handleConfirm = () => {
    onUpdateStatus(member.id, selectedStatus, selectedAssignee, note);
    toast.success(`Status of ${member.memberName} updated to "${selectedStatus}"`);
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
      <div className="mb-4 px-4 py-3 bg-[#f8fafc] rounded-lg">
        <Space direction="vertical" size={2}>
          <Text>
            Member: <strong>{member.memberName}</strong> ({member.memberCode})
          </Text>
          <Text type="secondary">
            Current Status: <Tag>{member.approvalStatus}</Tag>
          </Text>
        </Space>
      </div>

      <div className="mb-4">
        <Text strong className="block mb-2!">
          Target Approval Status
        </Text>
        <Radio.Group
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" orientation="vertical" className="w-full">
            {statusOptions.map((opt) => (
              <Radio
                key={opt.value}
                value={opt.value}
                className={`flex items-center px-3 py-2 rounded-[6px] border w-full ${
                  selectedStatus === opt.value
                    ? 'border-[#1677ff] bg-[#f0f7ff]'
                    : 'border-[#e2e8f0] bg-white'
                }`}
              >
                <div className="inline-flex items-center gap-2">
                  <Tag color={opt.color}>{opt.label}</Tag>
                  <Text type="secondary" className="text-[12px]!">
                    {opt.desc}
                  </Text>
                </div>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      <div className="mb-4">
        <Text strong className="block mb-1.5!">
          Assignee
        </Text>
        <Select
          className="w-full"
          value={selectedAssignee}
          onChange={setSelectedAssignee}
          options={assignees.map((a) => ({ label: a, value: a }))}
        />
      </div>

      <div>
        <Text strong className="block mb-1.5!">
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

