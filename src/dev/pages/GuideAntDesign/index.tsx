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

// Basic button types
<Space>
  <Button type="primary">Primary</Button>
  <Button>Default</Button>
  <Button type="dashed">Dashed</Button>
  <Button type="text">Text</Button>
  <Button type="link">Link</Button>
  <Button danger>Danger</Button>
</Space>

// Sizes and states
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

// Basic input
<Input placeholder="Basic input" />

// Password
<Password placeholder="Enter a password" />

// Text area
<TextArea rows={4} placeholder="Multi-line input" />

// Search
<Input
  placeholder="Type to search"
  prefix={<SearchOutlined />}
/>`;

const selectCode = `import { Select } from 'antd';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

// Basic select
<Select
  style={{ width: 200 }}
  placeholder="Please select"
  options={options}
/>

// Multiple selection
<Select
  mode="multiple"
  style={{ width: 300 }}
  placeholder="Select several"
  options={options}
/>

// Searchable
<Select
  showSearch
  style={{ width: 200 }}
  placeholder="Search, then select"
  options={options}
  filterOption={(input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
  }
/>`;

const datePickerCode = `import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

// Date picker
<DatePicker placeholder="Select a date" />

// Date range
<RangePicker />`;

const tagBadgeCode = `import { Tag, Badge } from 'antd';

// Tag — colors
<Space>
  <Tag color="blue">Blue</Tag>
  <Tag color="green">Green</Tag>
  <Tag color="orange">Orange</Tag>
  <Tag color="red">Red</Tag>
</Space>

// Tag — closable
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

// Badge — count
<Badge count={5}>
  <Card size="small" style={{ width: 50, height: 50 }} />
</Badge>

// Badge — status dot
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

// 24-column grid system
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

// Responsive
<Row gutter={16}>
  <Col xs={24} sm={12} md={8} lg={6}>
    Responsive column
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    Responsive column
  </Col>
</Row>`;

const spaceFlexCode = `import { Space, Flex, Button } from 'antd';

// Space — automatic gaps
<Space>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
  <Button>Button 3</Button>
</Space>

// Space — direction and size
<Space orientation="vertical" size="large">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Space>

// Flex — flexbox
<Flex gap="middle" justify="space-between" align="center">
  <div>Left</div>
  <div>Center</div>
  <div>Right</div>
</Flex>`;

const descriptionsCode = `import { Descriptions } from 'antd';

<Descriptions title="User information" bordered size="small">
  <Descriptions.Item label="Name">John Doe</Descriptions.Item>
  <Descriptions.Item label="Phone">010-1234-5678</Descriptions.Item>
  <Descriptions.Item label="Email">john@example.com</Descriptions.Item>
  <Descriptions.Item label="Address" span={3}>
    123 Teheran-ro, Gangnam-gu, Seoul
  </Descriptions.Item>
  <Descriptions.Item label="Department">Engineering</Descriptions.Item>
  <Descriptions.Item label="Grade">Senior</Descriptions.Item>
</Descriptions>`;

const statisticProgressCode = `import { Statistic, Progress } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';

// Statistic
<Row gutter={16}>
  <Col span={12}>
    <Statistic title="Active users" value={112893} />
  </Col>
  <Col span={12}>
    <Statistic
      title="Growth rate"
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
      content: 'Project created 2024-01-01',
      icon: <CheckCircleOutlined />,
    },
    {
      color: 'green',
      content: 'Requirements analysis complete 2024-01-15',
      icon: <CheckCircleOutlined />,
    },
    {
      color: 'blue',
      content: 'Development in progress 2024-02-01',
      icon: <SyncOutlined spin />,
    },
    {
      color: 'gray',
      content: 'Testing planned 2024-03-01',
      icon: <ClockCircleOutlined />,
    },
    {
      color: 'gray',
      content: 'Release planned 2024-03-15',
    },
  ]}
/>`;

const typographyCode = `import { Typography } from 'antd';

const { Title, Paragraph, Text, Link } = Typography;

// Title
<Title level={1}>h1. Ant Design</Title>
<Title level={2}>h2. Ant Design</Title>
<Title level={3}>h3. Ant Design</Title>

// Paragraph
<Paragraph>
  Ant Design is a design system for enterprise-grade products.
  It ships with a React component library.
</Paragraph>

// Text
<Space orientation="vertical">
  <Text>Regular text</Text>
  <Text type="secondary">Secondary text</Text>
  <Text type="success">Success text</Text>
  <Text type="warning">Warning text</Text>
  <Text type="danger">Danger text</Text>
  <Text strong>Bold</Text>
  <Text italic>Italic</Text>
  <Text underline>Underline</Text>
  <Text delete>Strikethrough</Text>
  <Text code>Code</Text>
</Space>

// Link
<Link href="https://ant.design" target="_blank">
  Ant Design (new window)
</Link>`;

const messageNotificationCode = `import { App, Button } from 'antd';

const { message, notification } = App.useApp();

// Message
<Space>
  <Button onClick={() => message.success('Success message')}>
    Success
  </Button>
  <Button onClick={() => message.error('Error message')}>
    Error
  </Button>
  <Button onClick={() => message.warning('Warning message')}>
    Warning
  </Button>
  <Button onClick={() => message.info('Info message')}>
    Info
  </Button>
</Space>

// Notification
<Button
  onClick={() =>
    notification.success({
      message: 'Notification title',
      description: 'The notification body goes here.',
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
        title: 'Confirm deletion',
        icon: <ExclamationCircleOutlined />,
        content: 'Are you sure you want to delete this?',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          console.log('deletion confirmed');
        },
      });
    }}
  >
    Confirm
  </Button>
  <Button
    onClick={() => {
      modal.info({
        title: 'Notice',
        content: 'This is an informational modal.',
      });
    }}
  >
    Info
  </Button>
  <Button
    onClick={() => {
      modal.warning({
        title: 'Warning',
        content: 'This needs your attention.',
      });
    }}
  >
    Warning
  </Button>
</Space>`;

const popconfirmCode = `import { Popconfirm, Button, message } from 'antd';

<Popconfirm
  title="Confirm deletion"
  description="Are you sure you want to delete this item?"
  onConfirm={() => message.success('Deleted')}
  onCancel={() => message.info('Cancelled')}
  okText="Yes"
  cancelText="No"
>
  <Button danger>Delete</Button>
</Popconfirm>`;

const formCode = `import { Form, Input, Button, Select, DatePicker } from 'antd';

const [form] = Form.useForm();

const onFinish = (values: any) => {
  console.log('Success:', values);
  message.success('Form submitted.');
};

<Form
  form={form}
  layout="vertical"
  onFinish={onFinish}
  initialValues={{ department: '1' }}
>
  <Form.Item
    label="Name"
    name="name"
    rules={[{ required: true, message: 'Enter your name' }]}
  >
    <Input placeholder="Enter your name" />
  </Form.Item>

  <Form.Item
    label="Email"
    name="email"
    rules={[
      { required: true, message: 'Enter your email' },
      { type: 'email', message: 'That is not a valid email address' },
    ]}
  >
    <Input placeholder="email@example.com" />
  </Form.Item>

  <Form.Item
    label="Password"
    name="password"
    rules={[
      { required: true, message: 'Enter a password' },
      { min: 6, message: 'Use at least 6 characters' },
    ]}
  >
    <Input.Password />
  </Form.Item>

  <Form.Item
    label="Department"
    name="department"
    rules={[{ required: true, message: 'Select a department' }]}
  >
    <Select
      options={[
        { value: '1', label: 'Engineering' },
        { value: '2', label: 'Design' },
        { value: '3', label: 'Planning' },
      ]}
    />
  </Form.Item>

  <Form.Item label="Start date" name="joinDate">
    <DatePicker style={{ width: '100%' }} />
  </Form.Item>

  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        Submit
      </Button>
      <Button onClick={() => form.resetFields()}>
        Reset
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
    message.success('Form submitted.');
  };

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic components',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            The Ant Design components you will use most often — Button, Input, Select,
            DatePicker, Tag, Badge, Card, Modal, InputNumber, Checkbox, Switch,
            AutoComplete, Dropdown and friends.
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
            <CodeSnippet code={buttonCode} title="Button examples" />
          </div>

          <div className="demo-section">
            <h3>Input</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Input placeholder="Basic input" autoComplete="off" />
                <Password placeholder="Enter a password" autoComplete="new-password" />
                <TextArea rows={4} placeholder="Multi-line input" />
                <Input placeholder="Type to search" prefix={<SearchOutlined />} />
              </Space>
            </Card>
            <CodeSnippet code={inputCode} title="Input examples" />
          </div>

          <div className="demo-section">
            <h3>Select</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Select
                  style={{ width: 200 }}
                  placeholder="Please select"
                  options={[
                    { value: '1', label: 'Option 1' },
                    { value: '2', label: 'Option 2' },
                    { value: '3', label: 'Option 3' },
                  ]}
                />
                <Select
                  mode="multiple"
                  style={{ width: 300 }}
                  placeholder="Select several"
                  options={[
                    { value: '1', label: 'Option 1' },
                    { value: '2', label: 'Option 2' },
                    { value: '3', label: 'Option 3' },
                  ]}
                />
                <Select
                  showSearch
                  style={{ width: 200 }}
                  placeholder="Search, then select"
                  options={[
                    { value: '1', label: 'Option 1' },
                    { value: '2', label: 'Option 2' },
                    { value: '3', label: 'Option 3' },
                  ]}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Space>
            </Card>
            <CodeSnippet code={selectCode} title="Select examples" />
          </div>

          <div className="demo-section">
            <h3>DatePicker</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <DatePicker placeholder="Select a date" />
                <RangePicker />
              </Space>
            </Card>
            <CodeSnippet code={datePickerCode} title="DatePicker examples" />
          </div>

          <div className="demo-section">
            <h3>Tag & Badge</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Tag colors
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
                    Closable tags
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
                    Badge status
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
            <CodeSnippet code={tagBadgeCode} title="Tag & Badge examples" />
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
            <CodeSnippet code={cardModalCode} title="Card & Modal examples" />
          </div>

          <div className="demo-section">
            <h3>InputNumber</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                A numeric-only input. Supports min/max, formatters and step controls.
              </p>
              <Space wrap>
                <InputNumber placeholder="Basic" style={{ width: 120 }} />
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

// Thousands separators
<InputNumber
  formatter={(v) => \`\${v}\`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}
  parser={(v) => v?.replace(/,/g, '')}
/>

// Prefix and suffix
<InputNumber prefix="₩" suffix="KRW" />`}
              title="InputNumber examples"
            />
          </div>

          <div className="demo-section">
            <h3>Checkbox & Switch</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Checkbox</div>
                  <Space orientation="vertical">
                    <Checkbox>Basic checkbox</Checkbox>
                    <Checkbox defaultChecked>Checked by default</Checkbox>
                    <Checkbox disabled>Disabled</Checkbox>
                    <Checkbox.Group
                      options={['Item A', 'Item B', 'Item C']}
                      defaultValue={['Item A']}
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
<Checkbox>Basic checkbox</Checkbox>
<Checkbox.Group
  options={['Item A', 'Item B', 'Item C']}
  value={checked}
  onChange={setChecked}
/>

// Switch
<Switch defaultChecked />
<Switch checkedChildren="ON" unCheckedChildren="OFF" onChange={(v) => console.log(v)} />`}
              title="Checkbox & Switch examples"
            />
          </div>

          <div className="demo-section">
            <h3>AutoComplete</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows autocomplete options as the user types.
              </p>
              <AutoComplete
                style={{ width: 300 }}
                options={[
                  { value: 'John Doe' },
                  { value: 'Michael Chen' },
                  { value: 'Emily Park' },
                ]}
                placeholder="Search by name"
                filterOption={(input, option) =>
                  (option?.value ?? '').includes(input)
                }
              />
            </Card>
            <CodeSnippet
              code={`import { AutoComplete } from 'antd';

const options = [
  { value: 'John Doe' },
  { value: 'Michael Chen' },
];

<AutoComplete
  style={{ width: 300 }}
  options={options}
  placeholder="Type to search"
  filterOption={(input, option) => (option?.value ?? '').includes(input)}
  onSelect={(value) => console.log('selected:', value)}
/>`}
              title="AutoComplete examples"
            />
          </div>

          <div className="demo-section">
            <h3>Dropdown</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows a menu on click or hover. Common in action button groups.
              </p>
              <Space>
                <Dropdown
                  menu={{
                    items: [
                      { key: '1', label: 'My profile', icon: <UserOutlined /> },
                      { key: '2', label: 'Settings', icon: <SettingOutlined /> },
                      { type: 'divider' },
                      { key: '3', label: 'Sign out', icon: <LogoutOutlined />, danger: true },
                    ],
                  }}
                >
                  <Button>Open menu</Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'excel', label: 'Excel download' },
                      { key: 'csv', label: 'CSV download' },
                      { key: 'pdf', label: 'PDF download' },
                    ],
                    onClick: ({ key }) => console.log('clicked:', key),
                  }}
                  trigger={['click']}
                >
                  <Button type="primary">Download ▾</Button>
                </Dropdown>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Dropdown } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';

<Dropdown
  menu={{
    items: [
      { key: '1', label: 'My profile', icon: <UserOutlined /> },
      { type: 'divider' },
      { key: '2', label: 'Sign out', danger: true },
    ],
    onClick: ({ key }) => console.log(key),
  }}
  trigger={['click']}  // 'hover' | 'click'
>
  <Button>Menu</Button>
</Dropdown>`}
              title="Dropdown examples"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'layout',
      label: 'Layout',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            The components that build a page layout. Grid, Space, Flex and Divider
            together cover responsive layouts.
          </p>

          <div className="demo-section">
            <h3>Grid System (Row / Col)</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Basic grid (24-column system)
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
            <CodeSnippet code={gridCode} title="Grid examples" />
          </div>

          <div className="demo-section">
            <h3>Space & Flex</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Space — automatic gaps
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
                    Flex — flexbox
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
            <CodeSnippet code={spaceFlexCode} title="Space & Flex examples" />
          </div>

          <div className="demo-section">
            <h3>Divider</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p>Content above</p>
              <Divider />
              <p>Content below</p>
              <Divider>With text</Divider>
              <p>Below the divider</p>
              <Divider titlePlacement="left">Left Text</Divider>
              <p>Left-aligned text</p>
              <Divider titlePlacement="right">Right Text</Divider>
              <p>Right-aligned text</p>
            </Card>
            <CodeSnippet
              code={`import { Divider } from 'antd';

<Divider />
<Divider>With text</Divider>
<Divider titlePlacement="left">Left Text</Divider>
<Divider titlePlacement="right">Right Text</Divider>

// Vertical
<Space split={<Divider orientation="vertical" />}>
  <span>Link 1</span>
  <span>Link 2</span>
  <span>Link 3</span>
</Space>`}
              title="Divider examples"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'data-display',
      label: 'Data display',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            The components that present data — Descriptions, Statistic, Progress,
            Timeline, Typography, Avatar, Empty, Table, Tree and Calendar.
          </p>

          <div className="demo-section">
            <h3>Descriptions</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions title="User information" bordered size="small">
                <Descriptions.Item label="Name">John Doe</Descriptions.Item>
                <Descriptions.Item label="Phone">010-1234-5678</Descriptions.Item>
                <Descriptions.Item label="Email">john@example.com</Descriptions.Item>
                <Descriptions.Item label="Address" span={3}>
                  123 Teheran-ro, Gangnam-gu, Seoul
                </Descriptions.Item>
                <Descriptions.Item label="Department">Engineering</Descriptions.Item>
                <Descriptions.Item label="Grade">Senior</Descriptions.Item>
              </Descriptions>
            </Card>
            <CodeSnippet code={descriptionsCode} title="Descriptions examples" />
          </div>

          <div className="demo-section">
            <h3>Statistic & Progress</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Active users" value={112893} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Account balance"
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
            <CodeSnippet code={statisticProgressCode} title="Statistic & Progress examples" />
          </div>

          <div className="demo-section">
            <h3>Timeline</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    content: 'Project created 2024-01-01',
                    icon: <CheckCircleOutlined />,
                  },
                  {
                    color: 'green',
                    content: 'Requirements analysis complete 2024-01-15',
                    icon: <CheckCircleOutlined />,
                  },
                  {
                    color: 'blue',
                    content: 'Development in progress 2024-02-01',
                    icon: <SyncOutlined spin />,
                  },
                  {
                    color: 'gray',
                    content: 'Testing planned 2024-03-01',
                    icon: <ClockCircleOutlined />,
                  },
                  {
                    color: 'gray',
                    content: 'Release planned 2024-03-15',
                  },
                ]}
              />
            </Card>
            <CodeSnippet code={timelineCode} title="Timeline examples" />
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
                  Ant Design is a design system for enterprise-grade products. It ships with a React
                  component library and keeps the user experience consistent.
                </Paragraph>
                <Space orientation="vertical">
                  <Text>Regular text</Text>
                  <Text type="secondary">Secondary text</Text>
                  <Text type="success">Success text</Text>
                  <Text type="warning">Warning text</Text>
                  <Text type="danger">Danger text</Text>
                  <Text strong>Bold</Text>
                  <Text italic>Italic</Text>
                  <Text underline>Underline</Text>
                  <Text delete>Strikethrough</Text>
                  <Text code>Code</Text>
                </Space>
                <Link href="https://ant.design" target="_blank">
                  Ant Design official site (new window)
                </Link>
              </Space>
            </Card>
            <CodeSnippet code={typographyCode} title="Typography examples" />
          </div>

          <div className="demo-section">
            <h3>Avatar</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                An icon standing in for a user or item. Images, icons and text are all supported.
              </p>
              <Space wrap size="large">
                <Space>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <Avatar icon={<UserOutlined />} />
                  <Avatar size="small" icon={<UserOutlined />} />
                </Space>
                <Space>
                  <Avatar style={{ backgroundColor: '#f56a00' }}>J</Avatar>
                  <Avatar style={{ backgroundColor: '#7265e6' }}>M</Avatar>
                  <Avatar style={{ backgroundColor: '#00a2ae' }}>E</Avatar>
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

// Icon and text avatars
<Avatar icon={<UserOutlined />} />
<Avatar style={{ backgroundColor: '#f56a00' }}>J</Avatar>

// Group
<Avatar.Group maxCount={3}>
  <Avatar icon={<UserOutlined />} />
  <Avatar style={{ backgroundColor: '#f56a00' }}>A</Avatar>
</Avatar.Group>`}
              title="Avatar examples"
            />
          </div>

          <div className="demo-section">
            <h3>Empty</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shown when there is no data.
              </p>
              <Space size="large" wrap>
                <Empty />
                <Empty description="No data found." />
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No search results" />
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Empty } from 'antd';

<Empty />
<Empty description="No data found." />
<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No search results" />`}
              title="Empty examples"
            />
          </div>

          <div className="demo-section">
            <h3>Table</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                The stock Ant Design table, for simple tabular data. For large data sets, prefer AG Grid.
              </p>
              <Table
                size="small"
                dataSource={[
                  { key: '1', name: 'John Doe', dept: 'Engineering', grade: 'Senior' },
                  { key: '2', name: 'Michael Chen', dept: 'Planning', grade: 'Principal' },
                  { key: '3', name: 'Emily Park', dept: 'Design', grade: 'Associate' },
                ]}
                columns={[
                  { title: 'Name', dataIndex: 'name', key: 'name' },
                  { title: 'Department', dataIndex: 'dept', key: 'dept' },
                  {
                    title: 'Grade',
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
  { title: 'Name', dataIndex: 'name' },
  { title: 'Department', dataIndex: 'dept' },
  {
    title: 'Grade',
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

// Note: for large grids, prefer the AG Grid (GridTable) component`}
              title="Table examples"
            />
          </div>

          <div className="demo-section">
            <h3>Tree</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Displays a hierarchical tree. Checkboxes, selection and drag-to-move are supported.
              </p>
              <Tree
                defaultExpandAll
                treeData={[
                  {
                    title: 'Engineering division', key: '0',
                    children: [
                      { title: 'Front-end team', key: '0-0', icon: <FolderOutlined /> },
                      { title: 'Backend team', key: '0-1', icon: <FolderOutlined /> },
                    ],
                  },
                  {
                    title: 'Planning division', key: '1',
                    children: [
                      { title: 'UX team', key: '1-0', icon: <FolderOutlined /> },
                      { title: 'Strategy team', key: '1-1', icon: <FolderOutlined /> },
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
    title: 'Engineering division',
    key: '0',
    children: [
      { title: 'Front-end team', key: '0-0' },
      { title: 'Backend team', key: '0-1' },
    ],
  },
];

<Tree
  treeData={treeData}
  defaultExpandAll
  checkable          // show checkboxes
  onSelect={(keys) => console.log(keys)}
/>`}
              title="Tree examples"
            />
          </div>

          <div className="demo-section">
            <h3>Calendar</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                A calendar view. Supports month/year modes and custom date cells.
              </p>
              <div style={{ maxWidth: 400 }}>
                <Calendar
                  fullscreen={false}
                  headerRender={({ value, onChange }) => (
                    <div style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
                      <Button size="small" onClick={() => onChange(value.clone().subtract(1, 'month'))}>‹</Button>
                      <span style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
                        {value.format('MMMM YYYY')}
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

// Full calendar
<Calendar
  onSelect={(date) => console.log(date.format('YYYY-MM-DD'))}
/>

// Panel mode (compact, inside a card)
<Calendar fullscreen={false} />

// Custom date cells
<Calendar
  dateCellRender={(date) => {
    const events = getEvents(date);
    return events.map(e => <Badge key={e.id} status="success" text={e.title} />);
  }}
/>`}
              title="Calendar examples"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'feedback',
      label: 'Feedback',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            The components that give the user feedback — Alert, Message, Notification,
            Modal.confirm, Popconfirm, Spin, Tooltip and Popover cover most situations.
          </p>

          <div className="demo-section">
            <h3>Message</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows a brief feedback message at the top of the screen.
              </p>
              <Space wrap>
                <Button onClick={() => message.success('Success message')}>Success</Button>
                <Button onClick={() => message.error('Error message')}>Error</Button>
                <Button onClick={() => message.warning('Warning message')}>Warning</Button>
                <Button onClick={() => message.info('Info message')}>Info</Button>
                <Button
                  onClick={() =>
                    message.loading({ content: 'Loading...', duration: 2 })
                  }
                >
                  Loading
                </Button>
              </Space>
            </Card>
            <CodeSnippet code={messageNotificationCode} title="Message examples" />
          </div>

          <div className="demo-section">
            <h3>Notification</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows a notification in a corner of the screen. It holds more information than a message.
              </p>
              <Space wrap>
                <Button
                  onClick={() =>
                    notification.success({
                      message: 'Success',
                      description: 'The operation completed successfully.',
                      placement: 'topRight',
                    })
                  }
                >
                  Success
                </Button>
                <Button
                  onClick={() =>
                    notification.error({
                      message: 'Error',
                      description: 'An error occurred during the operation.',
                      placement: 'topRight',
                    })
                  }
                >
                  Error
                </Button>
                <Button
                  onClick={() =>
                    notification.warning({
                      message: 'Warning',
                      description: 'This situation needs your attention.',
                      placement: 'topRight',
                    })
                  }
                >
                  Warning
                </Button>
                <Button
                  onClick={() =>
                    notification.info({
                      message: 'Information',
                      description: 'There is something new.',
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
              title="Notification examples"
            />
          </div>

          <div className="demo-section">
            <h3>Modal.confirm</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                A modal dialog asking the user to confirm.
              </p>
              <Space wrap>
                <Button
                  onClick={() => {
                    modal.confirm({
                      title: 'Confirm deletion',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Are you sure you want to delete this? It cannot be undone.',
                      okText: 'Delete',
                      okType: 'danger',
                      cancelText: 'Cancel',
                      onOk() {
                        message.success('Deleted');
                      },
                    });
                  }}
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => {
                    modal.info({
                      title: 'Notice',
                      content: 'This is an informational modal. Only the OK button is shown.',
                    });
                  }}
                >
                  Info
                </Button>
                <Button
                  onClick={() => {
                    modal.warning({
                      title: 'Warning',
                      content: 'This needs your attention.',
                    });
                  }}
                >
                  Warning
                </Button>
                <Button
                  onClick={() => {
                    modal.error({
                      title: 'Error',
                      content: 'The operation could not be completed.',
                    });
                  }}
                >
                  Error
                </Button>
              </Space>
            </Card>
            <CodeSnippet code={modalConfirmCode} title="Modal.confirm examples" />
          </div>

          <div className="demo-section">
            <h3>Popconfirm</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                A small confirmation popover anchored to an element.
              </p>
              <Space>
                <Popconfirm
                  title="Confirm deletion"
                  description="Are you sure you want to delete this item?"
                  onConfirm={() => message.success('Deleted')}
                  onCancel={() => message.info('Cancelled')}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger>Delete</Button>
                </Popconfirm>
                <Popconfirm
                  title="Save your changes?"
                  onConfirm={() => message.success('Saved')}
                  okText="Save"
                  cancelText="Cancel"
                >
                  <Button type="primary">Save</Button>
                </Popconfirm>
              </Space>
            </Card>
            <CodeSnippet code={popconfirmCode} title="Popconfirm examples" />
          </div>

          <div className="demo-section">
            <h3>Alert</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows an inline status or warning message.
              </p>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Alert title="This is an informational alert." type="info" showIcon />
                <Alert title="Processed successfully." type="success" showIcon />
                <Alert title="This situation needs your attention." type="warning" showIcon closable />
                <Alert
                  title="An error occurred"
                  description="Something went wrong while processing the request. Please try again shortly."
                  type="error"
                  showIcon
                />
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Alert } from 'antd';

<Alert title="This is an informational alert." type="info" showIcon />
<Alert title="Processed successfully." type="success" showIcon />
<Alert title="This situation needs your attention." type="warning" showIcon closable />
<Alert
  title="An error occurred"
  description="Detailed description text"
  type="error"
  showIcon
/>`}
              title="Alert examples"
            />
          </div>

          <div className="demo-section">
            <h3>Spin</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows a loading state, either on its own or wrapping content.
              </p>
              <Space size="large" wrap>
                <Spin size="small" />
                <Spin />
                <Spin size="large" />
                <Spin description="Loading...">
                  <div style={{ padding: 32, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }}>
                    Content area
                  </div>
                </Spin>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Spin } from 'antd';

// Standalone spinner
<Spin size="small" />
<Spin />
<Spin size="large" />

// Wrapping content
<Spin description="Loading...">
  <div>Content area</div>
</Spin>

// Conditional loading
<Spin spinning={isLoading}>
  <DataTable ... />
</Spin>`}
              title="Spin examples"
            />
          </div>

          <div className="demo-section">
            <h3>Tooltip</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Shows a short description in a bubble on hover.
              </p>
              <Space wrap>
                <Tooltip title="Basic tooltip">
                  <Button>Hover me</Button>
                </Tooltip>
                <Tooltip title="Shown above" placement="top">
                  <Button>Top</Button>
                </Tooltip>
                <Tooltip title="Shown to the left" placement="left">
                  <Button>Left</Button>
                </Tooltip>
                <Tooltip title="Shown to the right" placement="right">
                  <Button>Right</Button>
                </Tooltip>
                <Tooltip title="Works on icons too">
                  <SettingOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                </Tooltip>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Tooltip } from 'antd';

<Tooltip title="Description text">
  <Button>Hover me</Button>
</Tooltip>

// placement: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | ...
<Tooltip title="Shown above" placement="top">
  <span>Text</span>
</Tooltip>`}
              title="Tooltip examples"
            />
          </div>

          <div className="demo-section">
            <h3>Popover</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                A richer bubble than a tooltip. It can carry a title and a body.
              </p>
              <Space wrap>
                <Popover
                  title="Details"
                  content={
                    <div style={{ maxWidth: 200 }}>
                      <p style={{ margin: 0 }}>John Doe / Engineering</p>
                      <p style={{ margin: '4px 0 0' }}>hong@example.com</p>
                    </div>
                  }
                >
                  <Button>User info</Button>
                </Popover>
                <Popover
                  title="Help"
                  content="This field accepts numbers only."
                  trigger="click"
                >
                  <Button type="link">Open on click</Button>
                </Popover>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Popover } from 'antd';

<Popover
  title="Title"
  content={<div>Body content</div>}
  trigger="hover"   // 'hover' | 'click' | 'focus'
>
  <Button>Hover me</Button>
</Popover>`}
              title="Popover examples"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'form',
      label: 'Forms',
      children: (
        <div>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            The form components that collect user input. Form.Item plus validation rules
            cover everything from simple fields to complex validation.
          </p>

          <div className="demo-section">
            <h3>Form basics</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormFinish}
                initialValues={{ department: '1' }}
                style={{ maxWidth: 600 }}
              >
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Enter your name' }]}
                >
                  <Input placeholder="Enter your name" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Enter your email' },
                    { type: 'email', message: 'That is not a valid email address' },
                  ]}
                >
                  <Input placeholder="email@example.com" autoComplete="email" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: 'Enter a password' },
                    { min: 6, message: 'Use at least 6 characters' },
                  ]}
                >
                  <Password autoComplete="current-password" />
                </Form.Item>

                <Form.Item
                  label="Department"
                  name="department"
                  rules={[{ required: true, message: 'Select a department' }]}
                >
                  <Select
                    options={[
                      { value: '1', label: 'Engineering' },
                      { value: '2', label: 'Design' },
                      { value: '3', label: 'Planning' },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Start date" name="joinDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="About you" name="bio">
                  <TextArea rows={4} placeholder="Tell us a little about yourself" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Submit
                    </Button>
                    <Button onClick={() => form.resetFields()}>Reset</Button>
                    <Button
                      onClick={() =>
                        form.setFieldsValue({
                          name: 'John Doe',
                          email: 'hong@example.com',
                          department: '1',
                        })
                      }
                    >
                      Fill with sample data
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
            <CodeSnippet code={formCode} title="Form examples" />
          </div>

          <div className="demo-section">
            <h3>Form layouts</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Horizontal Layout
                  </div>
                  <Form layout="horizontal" labelCol={{ span: 4 }}>
                    <Form.Item label="Name" name="name1">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email1">
                      <Input />
                    </Form.Item>
                  </Form>
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                    Inline Layout
                  </div>
                  <Form layout="inline">
                    <Form.Item label="Name" name="name2">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email2">
                      <Input />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary">Search</Button>
                    </Form.Item>
                  </Form>
                </div>
              </Space>
            </Card>
            <CodeSnippet
              code={`import { Form, Input, Button } from 'antd';

// Horizontal
<Form layout="horizontal" labelCol={{ span: 4 }}>
  <Form.Item label="Name" name="name">
    <Input />
  </Form.Item>
</Form>

// Vertical (default)
<Form layout="vertical">
  <Form.Item label="Name" name="name">
    <Input />
  </Form.Item>
</Form>

// Inline
<Form layout="inline">
  <Form.Item label="Name" name="name">
    <Input />
  </Form.Item>
  <Form.Item>
    <Button type="primary">Search</Button>
  </Form.Item>
</Form>`}
              title="Form layout examples"
            />
          </div>

          <div className="demo-section">
            <h3>Validation Rules</h3>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                The main validation rules:
              </div>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
                <li>
                  <code>required: true</code> — required field
                </li>
                <li>
                  <code>type: 'email'</code> — email format
                </li>
                <li>
                  <code>min/max</code> — minimum / maximum length
                </li>
                <li>
                  <code>pattern</code> — regular expression
                </li>
                <li>
                  <code>validator</code> — custom validation function
                </li>
              </ul>
            </Card>
            <CodeSnippet
              code={`// Required
rules={[{ required: true, message: 'This field is required' }]}

// Email format
rules={[{ type: 'email', message: 'That is not a valid email address' }]}

// Minimum and maximum length
rules={[
  { min: 6, message: 'At least 6 characters' },
  { max: 20, message: 'At most 20 characters' }
]}

// Regular expression
rules={[{
  pattern: /^[0-9]+$/,
  message: 'Numbers only'
}]}

// Custom validation
rules={[{
  validator: (_, value) => {
    if (value && value < 18) {
      return Promise.reject('You must be at least 18');
    }
    return Promise.resolve();
  }
}]}`}
              title="Validation rule examples"
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
