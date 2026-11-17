import { useState } from 'react';
import { Typography, Card, Divider, Space } from 'antd';
import { DatePicker, Calendar } from 'antd';
import type { Dayjs } from 'dayjs';
import DevPageHeader from '@/dev/DevPageHeader';

const { Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

export default function GuideDatePicker() {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  return (
    <div style={{ padding: 24 }}>
      <DevPageHeader page="GuideDatePicker" />
      <Paragraph>Ant Design's date components. Internally they use <Text code>dayjs</Text>.</Paragraph>

      <Divider titlePlacement="left">DatePicker basics</Divider>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <DatePicker placeholder="Select a date" onChange={setDate} />
          <DatePicker picker="week" placeholder="Select a week" />
          <DatePicker picker="month" placeholder="Select a month" />
          <DatePicker picker="quarter" placeholder="Select a quarter" />
          <DatePicker picker="year" placeholder="Select a year" />
        </Space>
        {date && <Text>Selected date: {date.format('YYYY-MM-DD')}</Text>}
      </Space>

      <Divider titlePlacement="left">RangePicker</Divider>
      <Space orientation="vertical">
        <RangePicker
          placeholder={['Start date', 'End date']}
          onChange={(dates) => setRange(dates as [Dayjs | null, Dayjs | null] | null)}
        />
        <RangePicker picker="month" placeholder={['Start month', 'End month']} />
        {range?.[0] && range?.[1] && (
          <Text>{range[0]!.format('YYYY-MM-DD')} ~ {range[1]!.format('YYYY-MM-DD')}</Text>
        )}
      </Space>

      <Divider titlePlacement="left">DatePicker with time</Divider>
      <Space>
        <DatePicker showTime placeholder="Date + time" format="YYYY-MM-DD HH:mm" />
        <RangePicker showTime format="YYYY-MM-DD HH:mm" placeholder={['Start', 'End']} />
      </Space>

      <Divider titlePlacement="left">Disabled dates</Divider>
      <DatePicker
        disabledDate={(current) => current && current.isBefore(new Date(), 'day')}
        placeholder="Only today and later can be picked"
      />

      <Divider titlePlacement="left">Usage code</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';

// Single date
<DatePicker
  value={value}
  onChange={(date: Dayjs | null) => setValue(date)}
  format="YYYY-MM-DD"
/>

// Range
<DatePicker.RangePicker
  value={[start, end]}
  onChange={(dates) => {
    setStart(dates?.[0] ?? null);
    setEnd(dates?.[1] ?? null);
  }}
/>`}</pre>
      </Card>

      <Divider titlePlacement="left">Calendar component</Divider>
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 8, maxWidth: 600 }}>
        <Calendar fullscreen={false} />
      </div>
    </div>
  );
}
