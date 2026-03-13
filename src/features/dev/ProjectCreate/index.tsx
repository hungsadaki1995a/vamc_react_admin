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
            <Form.Item label="프로젝트명" name="name" rules={[{ required: true, message: '프로젝트명을 입력하세요' }]}>
              <Input placeholder="프로젝트명을 입력하세요" maxLength={100} showCount />
            </Form.Item>

            <Form.Item label="프로젝트 코드" name="code" rules={[{ required: true, message: '프로젝트 코드를 입력하세요' }]}>
              <Input placeholder="예: PMS-2024-001" style={{ maxWidth: 240 }} />
            </Form.Item>

            <Form.Item label="상태" name="status" initialValue="planning">
              <Select style={{ maxWidth: 200 }} options={[
                { value: 'planning', label: '계획' },
                { value: 'active', label: '진행중' },
                { value: 'on-hold', label: '보류' },
                { value: 'completed', label: '완료' },
              ]} />
            </Form.Item>

            <Form.Item label="PM" name="pmId" rules={[{ required: true, message: 'PM을 선택하세요' }]}>
              <Select
                style={{ maxWidth: 240 }}
                placeholder="PM 선택"
                showSearch
                options={[
                  { value: 'u001', label: '홍길동' },
                  { value: 'u002', label: '김철수' },
                  { value: 'u003', label: '이영희' },
                ]}
              />
            </Form.Item>

            <Form.Item label="기간">
              <Space>
                <Form.Item name="startDate" noStyle rules={[{ required: true, message: '시작일을 선택하세요' }]}>
                  <DatePicker placeholder="시작일" />
                </Form.Item>
                <span>~</span>
                <Form.Item name="endDate" noStyle rules={[{ required: true, message: '종료일을 선택하세요' }]}>
                  <DatePicker placeholder="종료일" />
                </Form.Item>
              </Space>
            </Form.Item>

            <Form.Item label="예산 (원)" name="budget">
              <InputNumber
                style={{ width: 200 }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v?.replace(/,/g, '') ?? 0) as unknown as 0}
                placeholder="예산 입력"
                min={0}
              />
            </Form.Item>

            <Form.Item label="설명" name="description">
              <TextArea rows={4} placeholder="프로젝트 설명을 입력하세요" maxLength={500} showCount />
            </Form.Item>

            <Form.Item label="참여자" name="members">
              <Select
                mode="multiple"
                placeholder="참여자 선택"
                options={[
                  { value: 'u001', label: '홍길동' },
                  { value: 'u002', label: '김철수' },
                  { value: 'u003', label: '이영희' },
                  { value: 'u004', label: '박민수' },
                  { value: 'u005', label: '최지영' },
                ]}
              />
            </Form.Item>
          </Form>
        </Card>
    </>
  );
}
