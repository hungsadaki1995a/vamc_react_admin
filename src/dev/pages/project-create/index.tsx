import { Form, Input, Select, DatePicker, Space, Card, InputNumber } from 'antd';

const { TextArea } = Input;

export default function ProjectCreate() {
  const [form] = Form.useForm();

  const handleSave = (values: unknown) => {
    console.log('Project created:', values);
  };

  return (
    <>
      <Card style={{ maxWidth: 720 }}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item label="Project name" name="name" rules={[{ required: true, message: 'Enter a project name' }]}>
              <Input placeholder="Enter a project name" maxLength={100} showCount />
            </Form.Item>

            <Form.Item label="Project code" name="code" rules={[{ required: true, message: 'Enter a project code' }]}>
              <Input placeholder="e.g. PMS-2024-001" style={{ maxWidth: 240 }} />
            </Form.Item>

            <Form.Item label="Status" name="status" initialValue="planning">
              <Select style={{ maxWidth: 200 }} options={[
                { value: 'planning', label: 'Planning' },
                { value: 'active', label: 'In progress' },
                { value: 'on-hold', label: 'On hold' },
                { value: 'completed', label: 'Completed' },
              ]} />
            </Form.Item>

            <Form.Item label="PM" name="pmId" rules={[{ required: true, message: 'Select a project manager' }]}>
              <Select
                style={{ maxWidth: 240 }}
                placeholder="Select a PM"
                showSearch
                options={[
                  { value: 'u001', label: 'John Doe' },
                  { value: 'u002', label: 'Michael Chen' },
                  { value: 'u003', label: 'Emily Park' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Period">
              <Space>
                <Form.Item name="startDate" noStyle rules={[{ required: true, message: 'Select a start date' }]}>
                  <DatePicker placeholder="Start date" />
                </Form.Item>
                <span>~</span>
                <Form.Item name="endDate" noStyle rules={[{ required: true, message: 'Select an end date' }]}>
                  <DatePicker placeholder="End date" />
                </Form.Item>
              </Space>
            </Form.Item>

            <Form.Item label="Budget (KRW)" name="budget">
              <InputNumber
                style={{ width: 200 }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v?.replace(/,/g, '') ?? 0) as unknown as 0}
                placeholder="Enter a budget"
                min={0}
              />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <TextArea rows={4} placeholder="Describe the project" maxLength={500} showCount />
            </Form.Item>

            <Form.Item label="Members" name="members">
              <Select
                mode="multiple"
                placeholder="Select members"
                options={[
                  { value: 'u001', label: 'John Doe' },
                  { value: 'u002', label: 'Michael Chen' },
                  { value: 'u003', label: 'Emily Park' },
                  { value: 'u004', label: 'David Kim' },
                  { value: 'u005', label: 'Sarah Lee' },
                ]}
              />
            </Form.Item>
          </Form>
        </Card>
    </>
  );
}
