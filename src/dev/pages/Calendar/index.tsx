import { useState } from 'react';
import { Calendar as AntCalendar, Badge, Card, Select, Space, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { mockTasks } from '@/mock/tasks';

const { Text } = Typography;

const events: Record<string, { type: 'success' | 'warning' | 'error'; content: string }[]> = {};
mockTasks.forEach((t) => {
  const key = t.dueDate;
  if (!events[key]) events[key] = [];
  events[key].push({
    type: t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'success',
    content: t.title,
  });
});

export default function Calendar() {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const dateCellRender = (value: Dayjs) => {
    const key = value.format('YYYY-MM-DD');
    const list = events[key];
    if (!list) return null;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {list.slice(0, 2).map((item, i) => (
          <li key={i}><Badge status={item.type} text={<Text style={{ fontSize: 11 }}>{item.content}</Text>} /></li>
        ))}
        {list.length > 2 && <li><Text type="secondary" style={{ fontSize: 11 }}>+{list.length - 2} more</Text></li>}
      </ul>
    );
  };

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <h2>{viewMode === 'month' ? 'Monthly' : 'Yearly'} calendar</h2>
          <Select value={viewMode} onChange={setViewMode} style={{ width: 100 }}
            options={[{ label: 'Month', value: 'month' }, { label: 'Year', value: 'year' }]} />
        </Space>
      </div>
      <Card size="small">
        <AntCalendar mode={viewMode} cellRender={(current, info) => {
          if (info.type === 'date') return dateCellRender(current as Dayjs);
          return null;
        }} />
      </Card>
    </div>
  );
}
