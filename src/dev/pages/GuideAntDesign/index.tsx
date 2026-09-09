/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Badge,
  Card,
  Modal,
  Row,
  Col,
  Space,
  Flex,
  Divider,
  Descriptions,
  Statistic,
  Progress,
  Timeline,
  Typography,
  Form,
  Popconfirm,
  Tabs,
  App,
  Alert,
  Spin,
  Tooltip,
  Popover,
  Dropdown,
  AutoComplete,
  InputNumber,
  Checkbox,
  Switch,
  Avatar,
  Empty,
  Table,
  Tree,
  Calendar,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

const { TextArea, Password } = Input;
const { RangePicker } = DatePicker;
const { Title, Paragraph, Text, Link } = Typography;

// Code snippets
const buttonCode = `import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

// 기본 버튼 타입
<Space>
  <Button type="primary">Primary</Button>
  <Button>Default</Button>
  <Button type="dashed">Dashed</Button>
  <Button type="text">Text</Button>
  <Button type="link">Link</Button>
  <Button danger>Danger</Button>
</Space>

// 크기 및 상태
<Space>
  <Button type="primary" size="large">Large</Button>
  <Button type="primary">Default</Button>
  <Button type="primary" size="small">Small</Button>
  <Button type="primary" loading>Loading</Button>
  <Button type="primary" icon={<DownloadOutlined />}>
    Download
  </Button>
</Space>`;

const inputCode = `import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { TextArea, Password } = Input;

// 기본 입력
<Input placeholder="기본 입력" />

// 비밀번호
<Password placeholder="비밀번호 입력" />

// 텍스트 영역
<TextArea rows={4} placeholder="여러 줄 입력" />

// 검색
<Input
  placeholder="검색어 입력"
  prefix={<SearchOutlined />}
/>`;

const selectCode = `import { Select } from 'antd';

const options = [
  { value: '1', label: '옵션 1' },
  { value: '2', label: '옵션 2' },
  { value: '3', label: '옵션 3' },
];

// 기본 선택
<Select
  style={{ width: 200 }}
  placeholder="선택하세요"
  options={options}
/>

// 다중 선택
<Select
  mode="multiple"
  style={{ width: 300 }}
  placeholder="여러 개 선택"
  options={options}
/>

// 검색 가능
<Select
  showSearch
  style={{ width: 200 }}
  placeholder="검색 후 선택"
  options={options}
  filterOption={(input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
  }
/>`;

const datePickerCode = `import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

// 날짜 선택
<DatePicker placeholder="날짜 선택" />

// 기간 선택
<RangePicker />`;

const tagBadgeCode = `import { Tag, Badge } from 'antd';

// Tag - 색상
<Space>
  <Tag color="blue">Blue</Tag>
  <Tag color="green">Green</Tag>
  <Tag color="orange">Orange</Tag>
  <Tag color="red">Red</Tag>
</Space>

// Tag - 닫기 가능
const [tags, setTags] = useState(['Tag 1', 'Tag 2', 'Tag 3']);
{tags.map(tag => (
  <Tag
    key={tag}
    closable
    onClose={() => setTags(tags.filter(t => t !== tag))}
  >
    {tag}
  </Tag>
))}

// Badge - 카운트
<Badge count={5}>
  <Card size="small" style={{ width: 50, height: 50 }} />
</Badge>

// Badge - 상태 점
<Badge status="success" text="Success" />
<Badge status="error" text="Error" />
<Badge status="processing" text="Processing" />`;

const cardModalCode = `import { Card, Modal, Button } from 'antd';

// Card
<Card
  title="Card Title"
  size="small"
  extra={<a href="#">More</a>}
  actions={[
    <Button type="link" key="edit">Edit</Button>,
    <Button type="link" key="delete">Delete</Button>,
  ]}
>
  <p>Card content</p>
  <p>More content</p>
</Card>

// Modal
const [open, setOpen] = useState(false);

<>
  <Button type="primary" onClick={() => setOpen(true)}>
    Open Modal
  </Button>
  <Modal
    title="Modal Title"
    open={open}
    onOk={() => setOpen(false)}
    onCancel={() => setOpen(false)}
  >
    <p>Modal content goes here</p>
  </Modal>
</>`;

const gridCode = `import { Row, Col } from 'antd';

// 24 그리드 시스템
<Row gutter={16}>
  <Col span={12}>
    <div style={{ background: '#0092ff', padding: 16 }}>col-12</div>
  </Col>
  <Col span={12}>
    <div style={{ background: '#00a2ae', padding: 16 }}>col-12</div>
  </Col>
</Row>

<Row gutter={16}>
  <Col span={8}>col-8</Col>
  <Col span={8}>col-8</Col>
  <Col span={8}>col-8</Col>
</Row>

// 반응형
<Row gutter={16}>
  <Col xs={24} sm={12} md={8} lg={6}>
    반응형 컬럼
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    반응형 컬럼
  </Col>
</Row>`;

const spaceFlexCode = `import { Space, Flex, Button } from 'antd';

// Space - 간격 자동 조절
<Space>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
  <Button>Button 3</Button>
</Space>

// Space - 방향 및 크기
<Space orientation="vertical" size="large">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Space>

// Flex - 플렉스박스
<Flex gap="middle" justify="space-between" align="center">
  <div>Left</div>
  <div>Center</div>
  <div>Right</div>
</Flex>`;

const descriptionsCode = `import { Descriptions } from 'antd';

<Descriptions title="사용자 정보" bordered size="small">
  <Descriptions.Item label="이름">홍길동</Descriptions.Item>
  <Descriptions.Item label="전화번호">010-1234-5678</Descriptions.Item>
  <Descriptions.Item label="이메일">hong@example.com</Descriptions.Item>
  <Descriptions.Item label="주소" span={3}>
    서울특별시 강남구 테헤란로 123
  </Descriptions.Item>
  <Descriptions.Item label="부서">개발팀</Descriptions.Item>
  <Descriptions.Item label="직급">선임</Descriptions.Item>
</Descriptions>`;

const statisticProgressCode = `import { Statistic, Progress } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';

// Statistic
<Row gutter={16}>
  <Col span={12}>
    <Statistic title="활성 사용자" value={112893} />
  </Col>
  <Col span={12}>
    <Statistic
      title="증가율"
      value={11.28}
      precision={2}
      suffix="%"
      prefix={<ArrowUpOutlined />}
      valueStyle={{ color: '#3f8600' }}
    />
  </Col>
</Row>

// Progress
<Space orientation="vertical" style={{ width: '100%' }}>
  <Progress percent={30} />
  <Progress percent={50} status="active" />
  <Progress percent={70} status="exception" />
  <Progress percent={100} />
  <Progress type="circle" percent={75} />
  <Progress type="dashboard" percent={75} />
</Space>`;

const timelineCode = `import { Timeline } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

<Timeline
  items={[
    {
      color: 'green',
      content: '프로젝트 생성 2024-01-01',
      icon: <CheckCircleOutlined />,
    },
    {
      color: 'green',
      content: '요구사항 분석 완료 2024-01-15',
      icon: <CheckCircleOutlined />,
    },
    {
      color: 'blue',
      content: '개발 진행 중 2024-02-01',
      icon: <SyncOutlined spin />,
    },
    {
      color: 'gray',
      content: '테스트 예정 2024-03-01',
      icon: <ClockCircleOutlined />,
    },
    {
      color: 'gray',
      content: '배포 예정 2024-03-15',
    },
  ]}
/>`;

const typographyCode = `import { Typography } from 'antd';

const { Title, Paragraph, Text, Link } = Typography;

// 제목
<Title level={1}>h1. Ant Design</Title>
<Title level={2}>h2. Ant Design</Title>
<Title level={3}>h3. Ant Design</Title>

// 단락
<Paragraph>
  Ant Design은 엔터프라이즈급 제품을 위한 디자인 시스템입니다.
  React 컴포넌트 라이브러리와 함께 제공됩니다.
</Paragraph>

// 텍스트
<Space orientation="vertical">
  <Text>기본 텍스트</Text>
  <Text type="secondary">보조 텍스트</Text>
  <Text type="success">성공 텍스트</Text>
  <Text type="warning">경고 텍스트</Text>
  <Text type="danger">위험 텍스트</Text>
  <Text strong>굵게</Text>
  <Text italic>기울임</Text>
  <Text underline>밑줄</Text>
  <Text delete>취소선</Text>
  <Text code>코드</Text>
</Space>

// 링크
<Link href="https://ant.design" target="_blank">
  Ant Design (새 창)
</Link>`;

const messageNotificationCode = `import { App, Button } from 'antd';

const { message, notification } = App.useApp();

// Message
<Space>
  <Button onClick={() => message.success('성공 메시지')}>
    Success
  </Button>
  <Button onClick={() => message.error('에러 메시지')}>
    Error
  </Button>
  <Button onClick={() => message.warning('경고 메시지')}>
    Warning
  </Button>
  <Button onClick={() => message.info('정보 메시지')}>
    Info
  </Button>
</Space>

// Notification
<Button
  onClick={() =>
    notification.success({
      message: '알림 제목',
      description: '알림 내용이 여기에 표시됩니다.',
      placement: 'topRight',
    })
  }
>
  Open Notification
</Button>`;

const modalConfirmCode = `import { App, Button, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { modal } = App.useApp();

// Modal.confirm
<Space>
  <Button
    onClick={() => {
      modal.confirm({
        title: '삭제 확인',
        icon: <ExclamationCircleOutlined />,
        content: '정말로 삭제하시겠습니까?',
        okText: '삭제',
        okType: 'danger',
        cancelText: '취소',
        onOk() {
          console.log('삭제 확인');
        },
      });
    }}
  >
    Confirm
  </Button>
  <Button
    onClick={() => {
      modal.info({
        title: '안내',
        content: '이것은 정보 모달입니다.',
      });
    }}
  >
    Info
  </Button>
  <Button
    onClick={() => {
      modal.warning({
        title: '경고',
        content: '주의가 필요합니다.',
      });
    }}
  >
    Warning
  </Button>
</Space>`;

const popconfirmCode = `import { Popconfirm, Button, message } from 'antd';

<Popconfirm
  title="삭제 확인"
  description="정말로 이 항목을 삭제하시겠습니까?"
  onConfirm={() => message.success('삭제되었습니다')}
  onCancel={() => message.info('취소되었습니다')}
  okText="예"
  cancelText="아니오"
>
  <Button danger>삭제</Button>
</Popconfirm>`;

const formCode = `import { Form, Input, Button, Select, DatePicker } from 'antd';

const [form] = Form.useForm();

const onFinish = (values: any) => {
  console.log('Success:', values);
  message.success('폼 제출 성공!');
};

<Form
  form={form}
  layout="vertical"
  onFinish={onFinish}
  initialValues={{ department: '1' }}
>
  <Form.Item
    label="이름"
    name="name"
    rules={[{ required: true, message: '이름을 입력하세요' }]}
  >
    <Input placeholder="이름 입력" />
  </Form.Item>

  <Form.Item
    label="이메일"
    name="email"
    rules={[
      { required: true, message: '이메일을 입력하세요' },
      { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
    ]}
  >
    <Input placeholder="email@example.com" />
  </Form.Item>

  <Form.Item
    label="비밀번호"
    name="password"
    rules={[
      { required: true, message: '비밀번호를 입력하세요' },
      { min: 6, message: '최소 6자 이상 입력하세요' },
    ]}
  >
    <Input.Password />
  </Form.Item>

  <Form.Item
    label="부서"
    name="department"
    rules={[{ required: true, message: '부서를 선택하세요' }]}
  >
    <Select
      options={[
        { value: '1', label: '개발팀' },
        { value: '2', label: '디자인팀' },
        { value: '3', label: '기획팀' },
      ]}
    />
  </Form.Item>

  <Form.Item label="입사일" name="joinDate">
    <DatePicker style={{ width: '100%' }} />
  </Form.Item>

  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        제출
      </Button>
      <Button onClick={() => form.resetFields()}>
        초기화
      </Button>
    </Space>
  </Form.Item>
</Form>`;

export default function GuideAntDesign() {
  const { message, notification, modal } = App.useApp();

  // State for interactive demos
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState(['Tag 1', 'Tag 2', 'Tag 3']);
  const [form] = Form.useForm();

  const handleButtonClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleFormFinish = (values: any) => {
    console.log('Form values:', values);
    message.success('폼 제출 성공!');
  };

  const tabItems = [
    {
      key: 'basic',
      label: '기본 컴포넌트',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            가장 자주 사용되는 Ant Design 기본 컴포넌트들입니다. Button, Input, Select,
            DatePicker, Tag, Badge, Card, Modal, InputNumber, Checkbox, Switch,
            AutoComplete, Dropdown 등을 다룹니다.
          </p>

          <div className="demo-section">
            <h3>Button</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Button type="primary">Primary</Button>
                  <Button>Default</Button>
                  <Button type="dashed">Dashed</Button>
                  <Button type="text">Text</Button>
                  <Button type="link">Link</Button>
                  <Button danger>Danger</Button>
                </Space>
                <Space wrap>
                  <Button type="primary" size="large">
                    Large
                  </Button>
                  <Button type="primary">Default</Button>
                  <Button type="primary" size="small">
                    Small
                  </Button>
                  <Button type="primary" loading={loading} onClick={handleButtonClick}>
                    {loading ? 'Loading...' : 'Click Me'}
                  </Button>
                  <Button type="primary" icon={<DownloadOutlined />}>
                    Download
                  </Button>
                </Space>
              </Space>
            </Card>
            <CodeSnippet code={buttonCode} title="Button 예제" />
          </div>

          <div className="demo-section">
            <h3>Input</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Input placeholder="기본 입력" autoComplete="off" />
                <Password placeholder="비밀번호 입력" autoComplete="new-password" />
                <TextArea rows={4} placeholder="여러 줄 입력" />
                <Input placeholder="검색어 입력" prefix={<SearchOutlined />} />
              </Space>
            </Card>
            <CodeSnippet code={inputCode} title="Input 예제" />
          </div>

          <div className="demo-section">
            <h3>Select</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Select
                  style={{ width: 200 }}
                  placeholder="선택하세요"
                  options={[
                    { value: '1', label: '옵션 1' },
                    { value: '2', label: '옵션 2' },
                    { value: '3', label: '옵션 3' },
                  ]}
                />
                <Select
                  mode="multiple"
                  style={{ width: 300 }}
                  placeholder="여러 개 선택"
                  options={[
                    { value: '1', label: '옵션 1' },
                    { value: '2', label: '옵션 2' },
                    { value: '3', label: '옵션 3' },
                  ]}
                />
                <Select
                  showSearch
                  style={{ width: 200 }}
                  placeholder="검색 후 선택"
                  options={[
                    { value: '1', label: '옵션 1' },
                    { value: '2', label: '옵션 2' },
                    { value: '3', label: '옵션 3' },
                  ]}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Space>
            </Card>
            <CodeSnippet code={selectCode} title="Select 예제" />
          </div>

          <div className="demo-section">
            <h3>DatePicker</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <DatePicker placeholder="날짜 선택" />
                <RangePicker />
              </Space>
            </Card>
            <CodeSnippet code={datePickerCode} title="DatePicker 예제" />
          </div>

          <div className="demo-section">
            <h3>Tag & Badge</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Tag 색상
                  </div>
                  <Space wrap>
                    <Tag color="blue">Blue</Tag>
                    <Tag color="green">Green</Tag>
                    <Tag color="orange">Orange</Tag>
                    <Tag color="red">Red</Tag>
                    <Tag color="purple">Purple</Tag>
                    <Tag color="cyan">Cyan</Tag>
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Tag 닫기 가능
                  </div>
                  <Space wrap>
                    {tags.map((tag) => (
                      <Tag
                        key={tag}
                        closable
                        onClose={() => setTags(tags.filter((t) => t !== tag))}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Badge
                  </div>
                  <Space size="large" wrap>
                    <Badge count={5}>
                      <Card size="small" style={{ width: 50, height: 50 }} />
                    </Badge>
                    <Badge count={99}>
                      <Card size="small" style={{ width: 50, height: 50 }} />
                    </Badge>
                    <Badge count={100}>
                      <Card size="small" style={{ width: 50, height: 50 }} />
                    </Badge>
                    <Badge dot>
                      <Card size="small" style={{ width: 50, height: 50 }} />
                    </Badge>
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Badge 상태
                  </div>
                  <Space orientation="vertical">
                    <Badge status="success" text="Success" />
                    <Badge status="error" text="Error" />
                    <Badge status="processing" text="Processing" />
                    <Badge status="warning" text="Warning" />
                    <Badge status="default" text="Default" />
                  </Space>
                </div>
              </Space>
            </Card>
            <CodeSnippet code={tagBadgeCode} title="Tag & Badge 예제" />
          </div>

          <div className="demo-section">
            <h3>Card & Modal</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Card
                  title="Card Title"
                  size="small"
                  extra={<a href="#">More</a>}
                  actions={[
                    <Button type="link" key="edit">
                      Edit
                    </Button>,
                    <Button type="link" key="delete">
                      Delete
                    </Button>,
                  ]}
                  style={{ maxWidth: 400 }}
                >
                  <p>Card content</p>
                  <p>More content</p>
                </Card>

                <div>
                  <Button type="primary" onClick={() => setModalVisible(true)}>
                    Open Modal
                  </Button>
                  <Modal
                    title="Modal Title"
                    open={modalVisible}
                    onOk={() => setModalVisible(false)}
                    onCancel={() => setModalVisible(false)}
                  >
                    <p>Modal content goes here</p>
                    <p>You can put any content inside the modal.</p>
                  </Modal>
                </div>
              </Space>
            </Card>
            <CodeSnippet code={cardModalCode} title="Card & Modal 예제" />
          </div>

          <div className="demo-section">
            <h3>InputNumber</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                숫자 전용 입력 필드. min/max, 포맷터, step 조절을 지원합니다.
              </p>
              <Space wrap>
                <InputNumber placeholder="기본" style={{ width: 120 }} />
                <InputNumber min={0} max={100} defaultValue={50} style={{ width: 120 }} />
                <InputNumber
                  defaultValue={1000}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v?.replace(/,/g, '') as any}
                  style={{ width: 140 }}
                />
                <InputNumber prefix="₩" defaultValue={0} style={{ width: 140 }} />
              </Space>
            </Card>
            <CodeSnippet
              code={`import { InputNumber } from 'antd';

<InputNumber min={0} max={100} defaultValue={50} />

// 천단위 콤마 포맷
<InputNumber
  formatter={(v) => \`\${v}\`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}
  parser={(v) => v?.replace(/,/g, '')}
/>

// 접두사/접미사
<InputNumber prefix="₩" suffix="원" />`}
              title="InputNumber 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Checkbox & Switch</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Checkbox</div>
                  <Space orientation="vertical">
                    <Checkbox>기본 체크박스</Checkbox>
                    <Checkbox defaultChecked>기본 체크됨</Checkbox>
                    <Checkbox disabled>비활성화</Checkbox>
                    <Checkbox.Group
                      options={['항목 A', '항목 B', '항목 C']}
                      defaultValue={['항목 A']}
                    />
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Switch</div>
                  <Space>
                    <Switch defaultChecked />
                    <Switch />
                    <Switch checkedChildren="ON" unCheckedChildren="OFF" defaultChecked />
                    <Switch disabled />
                    <Switch size="small" defaultChecked />
                  </Space>
                </div>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Checkbox, Switch } from 'antd';

// Checkbox
<Checkbox>기본 체크박스</Checkbox>
<Checkbox.Group
  options={['항목 A', '항목 B', '항목 C']}
  value={checked}
  onChange={setChecked}
/>

// Switch
<Switch defaultChecked />
<Switch checkedChildren="ON" unCheckedChildren="OFF" onChange={(v) => console.log(v)} />`}
              title="Checkbox & Switch 예제"
            />
          </div>

          <div className="demo-section">
            <h3>AutoComplete</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                입력값에 따라 자동완성 옵션을 표시합니다.
              </p>
              <AutoComplete
                style={{ width: 300 }}
                options={[
                  { value: '홍길동' },
                  { value: '김철수' },
                  { value: '이영희' },
                ]}
                placeholder="이름 검색"
                filterOption={(input, option) =>
                  (option?.value ?? '').includes(input)
                }
              />
            </Card>
            <CodeSnippet
              code={`import { AutoComplete } from 'antd';

const options = [
  { value: '홍길동' },
  { value: '김철수' },
];

<AutoComplete
  style={{ width: 300 }}
  options={options}
  placeholder="검색어 입력"
  filterOption={(input, option) => (option?.value ?? '').includes(input)}
  onSelect={(value) => console.log('selected:', value)}
/>`}
              title="AutoComplete 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Dropdown</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                클릭 또는 호버 시 메뉴를 표시합니다. 액션 버튼 그룹에 자주 사용됩니다.
              </p>
              <Space>
                <Dropdown
                  menu={{
                    items: [
                      { key: '1', label: '내 정보', icon: <UserOutlined /> },
                      { key: '2', label: '설정', icon: <SettingOutlined /> },
                      { type: 'divider' },
                      { key: '3', label: '로그아웃', icon: <LogoutOutlined />, danger: true },
                    ],
                  }}
                >
                  <Button>메뉴 열기</Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'excel', label: '엑셀 다운로드' },
                      { key: 'csv', label: 'CSV 다운로드' },
                      { key: 'pdf', label: 'PDF 다운로드' },
                    ],
                    onClick: ({ key }) => console.log('clicked:', key),
                  }}
                  trigger={['click']}
                >
                  <Button type="primary">다운로드 ▾</Button>
                </Dropdown>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Dropdown } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';

<Dropdown
  menu={{
    items: [
      { key: '1', label: '내 정보', icon: <UserOutlined /> },
      { type: 'divider' },
      { key: '2', label: '로그아웃', danger: true },
    ],
    onClick: ({ key }) => console.log(key),
  }}
  trigger={['click']}  // 'hover' | 'click'
>
  <Button>메뉴</Button>
</Dropdown>`}
              title="Dropdown 예제"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'layout',
      label: '레이아웃',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            페이지 레이아웃을 구성하는 컴포넌트들입니다. Grid 시스템, Space, Flex,
            Divider를 활용하여 반응형 레이아웃을 구성할 수 있습니다.
          </p>

          <div className="demo-section">
            <h3>Grid System (Row / Col)</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    기본 그리드 (24 컬럼 시스템)
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div
                        style={{
                          background: '#0092ff',
                          padding: 16,
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        col-12
                      </div>
                    </Col>
                    <Col span={12}>
                      <div
                        style={{
                          background: '#00a2ae',
                          padding: 16,
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        col-12
                      </div>
                    </Col>
                  </Row>
                </div>
                <div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div
                        style={{
                          background: '#0092ff',
                          padding: 16,
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        col-8
                      </div>
                    </Col>
                    <Col span={8}>
                      <div
                        style={{
                          background: '#00a2ae',
                          padding: 16,
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        col-8
                      </div>
                    </Col>
                    <Col span={8}>
                      <div
                        style={{
                          background: '#0092ff',
                          padding: 16,
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        col-8
                      </div>
                    </Col>
                  </Row>
                </div>
              </Space>
            </Card>
            <CodeSnippet code={gridCode} title="Grid 예제" />
          </div>

          <div className="demo-section">
            <h3>Space & Flex</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Space - 자동 간격 조절
                  </div>
                  <Space>
                    <Button>Button 1</Button>
                    <Button>Button 2</Button>
                    <Button>Button 3</Button>
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Space - Vertical + Large
                  </div>
                  <Space orientation="vertical" size="large">
                    <div
                      style={{
                        background: 'var(--border-color)',
                        padding: 8,
                        width: 200,
                      }}
                    >
                      Item 1
                    </div>
                    <div
                      style={{
                        background: 'var(--border-color)',
                        padding: 8,
                        width: 200,
                      }}
                    >
                      Item 2
                    </div>
                    <div
                      style={{
                        background: 'var(--border-color)',
                        padding: 8,
                        width: 200,
                      }}
                    >
                      Item 3
                    </div>
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Flex - 플렉스박스
                  </div>
                  <Flex gap="middle" justify="space-between" align="center">
                    <div
                      style={{
                        background: 'var(--border-color)',
                        padding: 8,
                        width: 100,
                      }}
                    >
                      Left
                    </div>
                    <div
                      style={{
                        background: 'var(--border-color)',
                        padding: 8,
                        width: 100,
                      }}
                    >
                      Center
                    </div>
                    <div
                      style={{
                        background: 'var(--border-color)',
                        padding: 8,
                        width: 100,
                      }}
                    >
                      Right
                    </div>
                  </Flex>
                </div>
              </Space>
            </Card>
            <CodeSnippet code={spaceFlexCode} title="Space & Flex 예제" />
          </div>

          <div className="demo-section">
            <h3>Divider</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p>위 내용</p>
              <Divider />
              <p>아래 내용</p>
              <Divider>텍스트 포함</Divider>
              <p>구분선 아래</p>
              <Divider titlePlacement="left">Left Text</Divider>
              <p>왼쪽 정렬 텍스트</p>
              <Divider titlePlacement="right">Right Text</Divider>
              <p>오른쪽 정렬 텍스트</p>
            </Card>
            <CodeSnippet
              code={`import { Divider } from 'antd';

<Divider />
<Divider>텍스트 포함</Divider>
<Divider titlePlacement="left">Left Text</Divider>
<Divider titlePlacement="right">Right Text</Divider>

// Vertical
<Space split={<Divider orientation="vertical" />}>
  <span>Link 1</span>
  <span>Link 2</span>
  <span>Link 3</span>
</Space>`}
              title="Divider 예제"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'data-display',
      label: '데이터 표시',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            데이터를 표시하는 컴포넌트들입니다. Descriptions, Statistic, Progress,
            Timeline, Typography, Avatar, Empty, Table, Tree, Calendar를 활용하여
            정보를 효과적으로 전달할 수 있습니다.
          </p>

          <div className="demo-section">
            <h3>Descriptions</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions title="사용자 정보" bordered size="small">
                <Descriptions.Item label="이름">홍길동</Descriptions.Item>
                <Descriptions.Item label="전화번호">010-1234-5678</Descriptions.Item>
                <Descriptions.Item label="이메일">hong@example.com</Descriptions.Item>
                <Descriptions.Item label="주소" span={3}>
                  서울특별시 강남구 테헤란로 123
                </Descriptions.Item>
                <Descriptions.Item label="부서">개발팀</Descriptions.Item>
                <Descriptions.Item label="직급">선임</Descriptions.Item>
              </Descriptions>
            </Card>
            <CodeSnippet code={descriptionsCode} title="Descriptions 예제" />
          </div>

          <div className="demo-section">
            <h3>Statistic & Progress</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="활성 사용자" value={112893} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="계정 잔액"
                      value={1128.93}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                </Row>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Progress
                  </div>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Progress percent={30} />
                    <Progress percent={50} status="active" />
                    <Progress percent={70} status="exception" />
                    <Progress percent={100} />
                  </Space>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Circle & Dashboard
                  </div>
                  <Space size="large">
                    <Progress type="circle" percent={75} />
                    <Progress type="circle" percent={70} status="exception" />
                    <Progress type="dashboard" percent={75} />
                  </Space>
                </div>
              </Space>
            </Card>
            <CodeSnippet code={statisticProgressCode} title="Statistic & Progress 예제" />
          </div>

          <div className="demo-section">
            <h3>Timeline</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    content: '프로젝트 생성 2024-01-01',
                    icon: <CheckCircleOutlined />,
                  },
                  {
                    color: 'green',
                    content: '요구사항 분석 완료 2024-01-15',
                    icon: <CheckCircleOutlined />,
                  },
                  {
                    color: 'blue',
                    content: '개발 진행 중 2024-02-01',
                    icon: <SyncOutlined spin />,
                  },
                  {
                    color: 'gray',
                    content: '테스트 예정 2024-03-01',
                    icon: <ClockCircleOutlined />,
                  },
                  {
                    color: 'gray',
                    content: '배포 예정 2024-03-15',
                  },
                ]}
              />
            </Card>
            <CodeSnippet code={timelineCode} title="Timeline 예제" />
          </div>

          <div className="demo-section">
            <h3>Typography</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Title level={2}>h2. Ant Design</Title>
                  <Title level={3}>h3. Ant Design</Title>
                  <Title level={4}>h4. Ant Design</Title>
                </div>
                <Paragraph>
                  Ant Design은 엔터프라이즈급 제품을 위한 디자인 시스템입니다. React
                  컴포넌트 라이브러리와 함께 제공되며, 일관된 사용자 경험을 제공합니다.
                </Paragraph>
                <Space orientation="vertical">
                  <Text>기본 텍스트</Text>
                  <Text type="secondary">보조 텍스트</Text>
                  <Text type="success">성공 텍스트</Text>
                  <Text type="warning">경고 텍스트</Text>
                  <Text type="danger">위험 텍스트</Text>
                  <Text strong>굵게</Text>
                  <Text italic>기울임</Text>
                  <Text underline>밑줄</Text>
                  <Text delete>취소선</Text>
                  <Text code>코드</Text>
                </Space>
                <Link href="https://ant.design" target="_blank">
                  Ant Design 공식 사이트 (새 창)
                </Link>
              </Space>
            </Card>
            <CodeSnippet code={typographyCode} title="Typography 예제" />
          </div>

          <div className="demo-section">
            <h3>Avatar</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                사용자/항목의 아이콘 표현. 이미지, 아이콘, 텍스트 형태를 지원합니다.
              </p>
              <Space wrap size="large">
                <Space>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <Avatar icon={<UserOutlined />} />
                  <Avatar size="small" icon={<UserOutlined />} />
                </Space>
                <Space>
                  <Avatar style={{ backgroundColor: '#f56a00' }}>홍</Avatar>
                  <Avatar style={{ backgroundColor: '#7265e6' }}>김</Avatar>
                  <Avatar style={{ backgroundColor: '#00a2ae' }}>이</Avatar>
                </Space>
                <Avatar.Group>
                  <Avatar icon={<UserOutlined />} />
                  <Avatar style={{ backgroundColor: '#f56a00' }}>A</Avatar>
                  <Avatar style={{ backgroundColor: '#87d068' }}>B</Avatar>
                  <Avatar style={{ backgroundColor: '#1677ff' }}>C</Avatar>
                </Avatar.Group>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// 아이콘/텍스트 아바타
<Avatar icon={<UserOutlined />} />
<Avatar style={{ backgroundColor: '#f56a00' }}>홍</Avatar>

// 그룹
<Avatar.Group maxCount={3}>
  <Avatar icon={<UserOutlined />} />
  <Avatar style={{ backgroundColor: '#f56a00' }}>A</Avatar>
</Avatar.Group>`}
              title="Avatar 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Empty</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                데이터가 없을 때 표시합니다.
              </p>
              <Space size="large" wrap>
                <Empty />
                <Empty description="조회된 데이터가 없습니다." />
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="검색 결과 없음" />
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Empty } from 'antd';

<Empty />
<Empty description="조회된 데이터가 없습니다." />
<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="검색 결과 없음" />`}
              title="Empty 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Table</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Ant Design 기본 Table. 단순 표 표현에 사용 (대용량은 AG Grid 권장).
              </p>
              <Table
                size="small"
                dataSource={[
                  { key: '1', name: '홍길동', dept: '개발팀', grade: '선임' },
                  { key: '2', name: '김철수', dept: '기획팀', grade: '책임' },
                  { key: '3', name: '이영희', dept: '디자인팀', grade: '주임' },
                ]}
                columns={[
                  { title: '이름', dataIndex: 'name', key: 'name' },
                  { title: '부서', dataIndex: 'dept', key: 'dept' },
                  {
                    title: '직급',
                    dataIndex: 'grade',
                    key: 'grade',
                    render: (v: string) => <Tag color="blue">{v}</Tag>,
                  },
                ]}
                pagination={false}
              />
            </Card>
            <CodeSnippet
              code={`import { Table, Tag } from 'antd';

const columns = [
  { title: '이름', dataIndex: 'name' },
  { title: '부서', dataIndex: 'dept' },
  {
    title: '직급',
    dataIndex: 'grade',
    render: (v) => <Tag color="blue">{v}</Tag>,
  },
];

<Table
  dataSource={data}
  columns={columns}
  rowKey="id"
  size="small"
  pagination={{ pageSize: 20 }}
/>

// 주의: 대용량 그리드는 AG Grid(GridTable) 컴포넌트 사용 권장`}
              title="Table 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Tree</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                계층형 트리 구조 표시. 체크박스, 선택, 드래그 이동을 지원합니다.
              </p>
              <Tree
                defaultExpandAll
                treeData={[
                  {
                    title: '개발본부', key: '0',
                    children: [
                      { title: '프론트엔드팀', key: '0-0', icon: <FolderOutlined /> },
                      { title: '백엔드팀', key: '0-1', icon: <FolderOutlined /> },
                    ],
                  },
                  {
                    title: '기획본부', key: '1',
                    children: [
                      { title: 'UX팀', key: '1-0', icon: <FolderOutlined /> },
                      { title: '전략팀', key: '1-1', icon: <FolderOutlined /> },
                    ],
                  },
                ]}
                showIcon
              />
            </Card>
            <CodeSnippet
              code={`import { Tree } from 'antd';

const treeData = [
  {
    title: '개발본부',
    key: '0',
    children: [
      { title: '프론트엔드팀', key: '0-0' },
      { title: '백엔드팀', key: '0-1' },
    ],
  },
];

<Tree
  treeData={treeData}
  defaultExpandAll
  checkable          // 체크박스 표시
  onSelect={(keys) => console.log(keys)}
/>`}
              title="Tree 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Calendar</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                날짜 달력 뷰. 월/년 모드 전환, 날짜 셀 커스텀을 지원합니다.
              </p>
              <div style={{ maxWidth: 400 }}>
                <Calendar
                  fullscreen={false}
                  headerRender={({ value, onChange }) => (
                    <div style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
                      <Button size="small" onClick={() => onChange(value.clone().subtract(1, 'month'))}>‹</Button>
                      <span style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
                        {value.format('YYYY년 MM월')}
                      </span>
                      <Button size="small" onClick={() => onChange(value.clone().add(1, 'month'))}>›</Button>
                    </div>
                  )}
                />
              </div>
            </Card>
            <CodeSnippet
              code={`import { Calendar } from 'antd';
import type { Dayjs } from 'dayjs';

// 전체 캘린더
<Calendar
  onSelect={(date) => console.log(date.format('YYYY-MM-DD'))}
/>

// 패널 전용 (카드 내 소형)
<Calendar fullscreen={false} />

// 날짜 셀 커스텀
<Calendar
  dateCellRender={(date) => {
    const events = getEvents(date);
    return events.map(e => <Badge key={e.id} status="success" text={e.title} />);
  }}
/>`}
              title="Calendar 예제"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'feedback',
      label: '피드백',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            사용자에게 피드백을 제공하는 컴포넌트들입니다. Alert, Message, Notification,
            Modal.confirm, Popconfirm, Spin, Tooltip, Popover를 통해 다양한 상황의
            피드백과 보조 정보를 표현할 수 있습니다.
          </p>

          <div className="demo-section">
            <h3>Message</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                화면 상단에 간단한 피드백 메시지를 표시합니다.
              </p>
              <Space wrap>
                <Button onClick={() => message.success('성공 메시지')}>Success</Button>
                <Button onClick={() => message.error('에러 메시지')}>Error</Button>
                <Button onClick={() => message.warning('경고 메시지')}>Warning</Button>
                <Button onClick={() => message.info('정보 메시지')}>Info</Button>
                <Button
                  onClick={() =>
                    message.loading({ content: '로딩 중...', duration: 2 })
                  }
                >
                  Loading
                </Button>
              </Space>
            </Card>
            <CodeSnippet code={messageNotificationCode} title="Message 예제" />
          </div>

          <div className="demo-section">
            <h3>Notification</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                화면 모서리에 알림을 표시합니다. 메시지보다 더 많은 정보를 담을 수
                있습니다.
              </p>
              <Space wrap>
                <Button
                  onClick={() =>
                    notification.success({
                      message: '성공',
                      description: '작업이 성공적으로 완료되었습니다.',
                      placement: 'topRight',
                    })
                  }
                >
                  Success
                </Button>
                <Button
                  onClick={() =>
                    notification.error({
                      message: '에러',
                      description: '작업 중 에러가 발생했습니다.',
                      placement: 'topRight',
                    })
                  }
                >
                  Error
                </Button>
                <Button
                  onClick={() =>
                    notification.warning({
                      message: '경고',
                      description: '주의가 필요한 상황입니다.',
                      placement: 'topRight',
                    })
                  }
                >
                  Warning
                </Button>
                <Button
                  onClick={() =>
                    notification.info({
                      message: '정보',
                      description: '새로운 정보가 있습니다.',
                      placement: 'bottomRight',
                    })
                  }
                >
                  Info (Bottom Right)
                </Button>
              </Space>
            </Card>
            <CodeSnippet
              code={messageNotificationCode}
              title="Notification 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Modal.confirm</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                사용자에게 확인을 요청하는 모달 대화상자입니다.
              </p>
              <Space wrap>
                <Button
                  onClick={() => {
                    modal.confirm({
                      title: '삭제 확인',
                      icon: <ExclamationCircleOutlined />,
                      content: '정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                      okText: '삭제',
                      okType: 'danger',
                      cancelText: '취소',
                      onOk() {
                        message.success('삭제되었습니다');
                      },
                    });
                  }}
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => {
                    modal.info({
                      title: '안내',
                      content: '이것은 정보 모달입니다. 확인 버튼만 표시됩니다.',
                    });
                  }}
                >
                  Info
                </Button>
                <Button
                  onClick={() => {
                    modal.warning({
                      title: '경고',
                      content: '주의가 필요합니다.',
                    });
                  }}
                >
                  Warning
                </Button>
                <Button
                  onClick={() => {
                    modal.error({
                      title: '에러',
                      content: '작업을 완료할 수 없습니다.',
                    });
                  }}
                >
                  Error
                </Button>
              </Space>
            </Card>
            <CodeSnippet code={modalConfirmCode} title="Modal.confirm 예제" />
          </div>

          <div className="demo-section">
            <h3>Popconfirm</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                요소 근처에 표시되는 간단한 확인 팝오버입니다.
              </p>
              <Space>
                <Popconfirm
                  title="삭제 확인"
                  description="정말로 이 항목을 삭제하시겠습니까?"
                  onConfirm={() => message.success('삭제되었습니다')}
                  onCancel={() => message.info('취소되었습니다')}
                  okText="예"
                  cancelText="아니오"
                >
                  <Button danger>삭제</Button>
                </Popconfirm>
                <Popconfirm
                  title="변경사항을 저장하시겠습니까?"
                  onConfirm={() => message.success('저장되었습니다')}
                  okText="저장"
                  cancelText="취소"
                >
                  <Button type="primary">저장</Button>
                </Popconfirm>
              </Space>
            </Card>
            <CodeSnippet code={popconfirmCode} title="Popconfirm 예제" />
          </div>

          <div className="demo-section">
            <h3>Alert</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                인라인 상태/경고 메시지를 표시합니다.
              </p>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Alert title="정보 알림입니다." type="info" showIcon />
                <Alert title="성공적으로 처리되었습니다." type="success" showIcon />
                <Alert title="주의가 필요한 상황입니다." type="warning" showIcon closable />
                <Alert
                  title="에러 발생"
                  description="요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                  type="error"
                  showIcon
                />
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Alert } from 'antd';

<Alert title="정보 알림입니다." type="info" showIcon />
<Alert title="성공적으로 처리되었습니다." type="success" showIcon />
<Alert title="주의가 필요한 상황입니다." type="warning" showIcon closable />
<Alert
  title="에러 발생"
  description="상세 설명 텍스트"
  type="error"
  showIcon
/>`}
              title="Alert 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Spin</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                로딩 상태를 표시합니다. 단독 또는 컨텐츠를 감싸는 방식으로 사용합니다.
              </p>
              <Space size="large" wrap>
                <Spin size="small" />
                <Spin />
                <Spin size="large" />
                <Spin description="불러오는 중...">
                  <div style={{ padding: 32, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }}>
                    콘텐츠 영역
                  </div>
                </Spin>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Spin } from 'antd';

// 단독 스피너
<Spin size="small" />
<Spin />
<Spin size="large" />

// 컨텐츠 감싸기
<Spin description="불러오는 중...">
  <div>콘텐츠 영역</div>
</Spin>

// 조건부 로딩
<Spin spinning={isLoading}>
  <DataTable ... />
</Spin>`}
              title="Spin 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Tooltip</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                호버 시 간단한 설명을 말풍선으로 표시합니다.
              </p>
              <Space wrap>
                <Tooltip title="기본 툴팁">
                  <Button>Hover me</Button>
                </Tooltip>
                <Tooltip title="상단 표시" placement="top">
                  <Button>Top</Button>
                </Tooltip>
                <Tooltip title="좌측 표시" placement="left">
                  <Button>Left</Button>
                </Tooltip>
                <Tooltip title="우측 표시" placement="right">
                  <Button>Right</Button>
                </Tooltip>
                <Tooltip title="아이콘에도 사용 가능">
                  <SettingOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                </Tooltip>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Tooltip } from 'antd';

<Tooltip title="설명 텍스트">
  <Button>Hover me</Button>
</Tooltip>

// placement: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | ...
<Tooltip title="상단 표시" placement="top">
  <span>텍스트</span>
</Tooltip>`}
              title="Tooltip 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Popover</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Tooltip보다 풍부한 내용을 말풍선으로 표시합니다. 제목과 본문을 포함할 수 있습니다.
              </p>
              <Space wrap>
                <Popover
                  title="상세 정보"
                  content={
                    <div style={{ maxWidth: 200 }}>
                      <p style={{ margin: 0 }}>홍길동 / 개발팀</p>
                      <p style={{ margin: '4px 0 0' }}>hong@example.com</p>
                    </div>
                  }
                >
                  <Button>사용자 정보</Button>
                </Popover>
                <Popover
                  title="도움말"
                  content="이 필드에는 숫자만 입력 가능합니다."
                  trigger="click"
                >
                  <Button type="link">클릭으로 열기</Button>
                </Popover>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Popover } from 'antd';

<Popover
  title="제목"
  content={<div>본문 내용</div>}
  trigger="hover"   // 'hover' | 'click' | 'focus'
>
  <Button>Hover me</Button>
</Popover>`}
              title="Popover 예제"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'form',
      label: '폼',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            사용자 입력을 받는 폼 컴포넌트입니다. Form.Item과 validation rules를
            활용하여 강력한 폼 검증 기능을 구현할 수 있습니다.
          </p>

          <div className="demo-section">
            <h3>Form 기본</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormFinish}
                initialValues={{ department: '1' }}
                style={{ maxWidth: 600 }}
              >
                <Form.Item
                  label="이름"
                  name="name"
                  rules={[{ required: true, message: '이름을 입력하세요' }]}
                >
                  <Input placeholder="이름 입력" />
                </Form.Item>

                <Form.Item
                  label="이메일"
                  name="email"
                  rules={[
                    { required: true, message: '이메일을 입력하세요' },
                    { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
                  ]}
                >
                  <Input placeholder="email@example.com" autoComplete="email" />
                </Form.Item>

                <Form.Item
                  label="비밀번호"
                  name="password"
                  rules={[
                    { required: true, message: '비밀번호를 입력하세요' },
                    { min: 6, message: '최소 6자 이상 입력하세요' },
                  ]}
                >
                  <Password autoComplete="current-password" />
                </Form.Item>

                <Form.Item
                  label="부서"
                  name="department"
                  rules={[{ required: true, message: '부서를 선택하세요' }]}
                >
                  <Select
                    options={[
                      { value: '1', label: '개발팀' },
                      { value: '2', label: '디자인팀' },
                      { value: '3', label: '기획팀' },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="입사일" name="joinDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="자기소개" name="bio">
                  <TextArea rows={4} placeholder="간단한 자기소개를 작성하세요" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      제출
                    </Button>
                    <Button onClick={() => form.resetFields()}>초기화</Button>
                    <Button
                      onClick={() =>
                        form.setFieldsValue({
                          name: '홍길동',
                          email: 'hong@example.com',
                          department: '1',
                        })
                      }
                    >
                      샘플 데이터 입력
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
            <CodeSnippet code={formCode} title="Form 예제" />
          </div>

          <div className="demo-section">
            <h3>Form 레이아웃</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Horizontal Layout
                  </div>
                  <Form layout="horizontal" labelCol={{ span: 4 }}>
                    <Form.Item label="이름" name="name1">
                      <Input />
                    </Form.Item>
                    <Form.Item label="이메일" name="email1">
                      <Input />
                    </Form.Item>
                  </Form>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Inline Layout
                  </div>
                  <Form layout="inline">
                    <Form.Item label="이름" name="name2">
                      <Input />
                    </Form.Item>
                    <Form.Item label="이메일" name="email2">
                      <Input />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary">검색</Button>
                    </Form.Item>
                  </Form>
                </div>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Form, Input, Button } from 'antd';

// Horizontal
<Form layout="horizontal" labelCol={{ span: 4 }}>
  <Form.Item label="이름" name="name">
    <Input />
  </Form.Item>
</Form>

// Vertical (default)
<Form layout="vertical">
  <Form.Item label="이름" name="name">
    <Input />
  </Form.Item>
</Form>

// Inline
<Form layout="inline">
  <Form.Item label="이름" name="name">
    <Input />
  </Form.Item>
  <Form.Item>
    <Button type="primary">검색</Button>
  </Form.Item>
</Form>`}
              title="Form 레이아웃 예제"
            />
          </div>

          <div className="demo-section">
            <h3>Validation Rules</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                주요 검증 규칙:
              </div>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
                <li>
                  <code>required: true</code> - 필수 입력
                </li>
                <li>
                  <code>type: 'email'</code> - 이메일 형식
                </li>
                <li>
                  <code>min/max</code> - 최소/최대 길이
                </li>
                <li>
                  <code>pattern</code> - 정규식 패턴
                </li>
                <li>
                  <code>validator</code> - 커스텀 검증 함수
                </li>
              </ul>
            </Card>
            <CodeSnippet
              code={`// 필수 입력
rules={[{ required: true, message: '필수 입력입니다' }]}

// 이메일 형식
rules={[{ type: 'email', message: '올바른 이메일 형식이 아닙니다' }]}

// 최소/최대 길이
rules={[
  { min: 6, message: '최소 6자 이상' },
  { max: 20, message: '최대 20자 이하' }
]}

// 정규식 패턴
rules={[{
  pattern: /^[0-9]+$/,
  message: '숫자만 입력 가능합니다'
}]}

// 커스텀 검증
rules={[{
  validator: (_, value) => {
    if (value && value < 18) {
      return Promise.reject('18세 이상이어야 합니다');
    }
    return Promise.resolve();
  }
}]}`}
              title="Validation Rules 예제"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideAntDesign" />
      <Tabs items={tabItems} />
    </div>
  );
}
