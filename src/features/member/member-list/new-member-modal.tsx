import { useState } from 'react';
import { Modal, Form, Input, Select, Radio, Upload, Button, Row, Col, message } from 'antd';
import { UploadOutlined, UserAddOutlined } from '@ant-design/icons';
import type { MemberItem, MemberClassification, MemberType } from './member.types';

interface NewMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMember: (newMember: Omit<MemberItem, 'id' | 'no'>) => void;
}

export default function NewMemberModal({ visible, onClose, onAddMember }: NewMemberModalProps) {
  const [form] = Form.useForm();
  const [memberType, setMemberType] = useState<MemberType>('General');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(
        today.getMonth() + 1
      ).padStart(2, '0')}/${today.getFullYear()}`;

      const generatedCode = `M178869${Math.floor(100000 + Math.random() * 900000)}`;

      onAddMember({
        memberClassification: values.memberClassification as MemberClassification,
        memberCode: generatedCode,
        applicationId:
          values.memberType === 'Organization'
            ? `${values.email.split('@')[0]}@org.com`
            : `${values.phone.replace(/[^0-9]/g, '').slice(0, 9)}...`,
        memberType: values.memberType as MemberType,
        memberName: values.memberName,
        approvalStatus: 'Requested',
        assignee: values.assignee || 'Võ Ngọc Lan',
        applicationDate: formattedDate,
        receivedDate: formattedDate,
        attachments: values.attachments?.fileList?.length || 1,
        companyName: values.companyName || '-',
        approvalDate: formattedDate,
        phone: values.phone,
        email: values.email,
        accountStatus: 'Active',
      });

      message.success(`Member ${values.memberName} successfully registered!`);
      form.resetFields();
      onClose();
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Create Member"
      width={680}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserAddOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          <span>Register New Member</span>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          memberType: 'General',
          memberClassification: 'Pending (Approval)',
          assignee: 'Võ Ngọc Lan',
        }}
        onValuesChange={(changed) => {
          if (changed.memberType) {
            setMemberType(changed.memberType);
          }
        }}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="memberType"
              label="Member Type"
              rules={[{ required: true, message: 'Please select member type' }]}
            >
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="General">General</Radio.Button>
                <Radio.Button value="Foreigner">Foreigner</Radio.Button>
                <Radio.Button value="Organization">Organization</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="memberClassification"
              label="Classification"
              rules={[{ required: true, message: 'Please select classification' }]}
            >
              <Select
                options={[
                  { label: 'Pending (Approval)', value: 'Pending (Approval)' },
                  { label: 'Pending (Payment)', value: 'Pending (Payment)' },
                  { label: 'Verified', value: 'Verified' },
                  { label: 'Rejected', value: 'Rejected' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="memberName"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter member name' }]}
            >
              <Input placeholder="e.g. Nguyễn Văn An" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="companyName"
              label="Company Name"
              rules={[{ required: memberType === 'Organization', message: 'Please enter company name' }]}
            >
              <Input placeholder={memberType === 'Organization' ? 'e.g. MB Bank Investment' : 'Optional'} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="e.g. user@vamc.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="e.g. 840311234567" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assignee" label="Assignee">
              <Select
                options={[
                  { label: 'Võ Ngọc Lan', value: 'Võ Ngọc Lan' },
                  { label: 'Nguyễn Thu Trang', value: 'Nguyễn Thu Trang' },
                  { label: 'Lê Hoàng Nam', value: 'Lê Hoàng Nam' },
                  { label: 'Phạm Minh Tuấn', value: 'Phạm Minh Tuấn' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="attachments" label="Attachments (ID / Registration)">
              <Upload maxCount={5} beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Select Document Files</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

