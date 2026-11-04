import { useState, useEffect } from 'react';
import { Modal, Descriptions, Tag, Input, Button, message, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { InquiryItem } from './inquiry.types';
import { useAuthStore } from '@/stores/authStore';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface InquiryDetailModalProps {
  visible: boolean;
  inquiry: InquiryItem | null;
  onClose: () => void;
  onResponseSubmit: (inquiryId: string, responseText: string, responderName: string) => void;
}

export default function InquiryDetailModal({
  visible,
  inquiry,
  onClose,
  onResponseSubmit,
}: InquiryDetailModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [responseText, setResponseText] = useState('');
  const [responderName, setResponderName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (inquiry) {
      setResponseText(inquiry.responseContent || '');
      setResponderName(inquiry.responder || inquiry.ansEmpNm || currentUser?.usrNm || 'Hong Gil Dong');
      setIsEditing(!inquiry.responseContent && (inquiry.answerStatus !== 'ANSWERED' && inquiry.status !== 'Completed'));
    }
  }, [inquiry, currentUser]);

  if (!inquiry) return null;

  const isCompleted = inquiry.answerStatus === 'ANSWERED' || inquiry.status === 'Completed';
  const displayStatus = inquiry.answerStatus || inquiry.status || (isCompleted ? 'ANSWERED' : 'UNANSWERED');

  const handleSubmit = () => {
    if (!responseText.trim()) {
      message.warning('Please enter a response message.');
      return;
    }
    const finalResponder = responderName.trim() || currentUser?.usrNm || 'Hong Gil Dong';
    onResponseSubmit(inquiry.id, responseText.trim(), finalResponder);
    message.success('Response submitted successfully.');
    setIsEditing(false);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>1:1 Inquiry Details</span>
          <Tag color={isCompleted ? 'blue' : 'error'} style={{ fontSize: 12, padding: '2px 8px' }}>
            {isCompleted ? <CheckCircleOutlined /> : <ClockCircleOutlined />} {displayStatus}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        (isEditing || !isCompleted) && (
          <Button
            key="submit"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            style={{ backgroundColor: '#111827', borderColor: '#111827' }}
          >
            {isCompleted ? 'Update Response' : 'Submit Response'}
          </Button>
        ),
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {/* Meta Info */}
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 4 }}>
          <Descriptions.Item label="Inquiry No.">
            <Text strong>{inquiry.no}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Inquiry Type">
            <Tag color={inquiry.category === 'CST' || inquiry.categoryNm === 'Consulting' || inquiry.inquiryType === 'Consulting' ? 'purple' : 'default'}>
              {inquiry.categoryNm || inquiry.inquiryType || inquiry.category || 'General'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Registered Customer">
            {inquiry.registeredCustomer || inquiry.inquirerNm || inquiry.mbrNo || 'Member ID'}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Date">
            {inquiry.crtDt || inquiry.registrationDate || '-'}
          </Descriptions.Item>
        </Descriptions>

        {/* Inquiry Title & Content */}
        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
            INQUIRY TITLE
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
            {inquiry.title}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
            CONTENT
          </div>
          <Paragraph style={{ margin: 0, color: '#344155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {inquiry.content || inquiry.title}
          </Paragraph>
        </div>

        {/* Response Section */}
        <div
          style={{
            background: isCompleted && !isEditing ? '#f0fdf4' : '#fafafa',
            padding: 16,
            borderRadius: 6,
            border: isCompleted && !isEditing ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
              Official Response
            </span>
            {isCompleted && !isEditing && (
              <Button type="link" size="small" onClick={() => setIsEditing(true)}>
                Edit Response
              </Button>
            )}
          </div>

          {isCompleted && !isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#6b7280' }}>
                <span>
                  <strong>Responder:</strong> {inquiry.ansEmpNm || inquiry.responder || 'Hong Gil Dong'}
                </span>
                <span>
                  <strong>Response Date:</strong> {inquiry.answeredAt || inquiry.responseDate || dayjs().format('DD/MM/YYYY HH:mm:ss')}
                </span>
              </div>
              <Paragraph style={{ margin: '8px 0 0', color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {inquiry.responseContent || 'The inquiry has been processed and answered by administrator.'}
              </Paragraph>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#4b5563', marginBottom: 4 }}>
                  Responder Name:
                </label>
                <Input
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  placeholder="Enter responder name"
                  style={{ maxWidth: 300 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#4b5563', marginBottom: 4 }}>
                  Response Content:
                </label>
                <TextArea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type official response to customer..."
                />
              </div>
              {isCompleted && isEditing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button size="small" onClick={() => setIsEditing(false)}>
                    Cancel Editing
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
