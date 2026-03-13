import { useState } from 'react';
import { Card, Input, Select, DatePicker, Space, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState<string>();

  return (
    <div className="page-container">
      <div className="ds-section-header">
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
        {description && (
          <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
        )}
      </div>
      <Card title="상태 보존 테스트" size="small">
        <Space orientation="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              텍스트 입력 (탭 전환 후 복귀 시 유지 확인):
            </Text>
            <Input
              placeholder="입력값을 입력하세요..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              셀렉트 (탭 전환 후 복귀 시 유지 확인):
            </Text>
            <Select
              placeholder="옵션을 선택하세요"
              value={selectValue}
              onChange={setSelectValue}
              style={{ width: 200 }}
              options={[
                { label: '옵션 A', value: 'a' },
                { label: '옵션 B', value: 'b' },
                { label: '옵션 C', value: 'c' },
              ]}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              날짜 선택:
            </Text>
            <DatePicker />
          </div>
          <div>
            <Tag color="blue">{title}</Tag>
            <Tag color="green">상태 보존 활성</Tag>
          </div>
        </Space>
      </Card>
    </div>
  );
}
