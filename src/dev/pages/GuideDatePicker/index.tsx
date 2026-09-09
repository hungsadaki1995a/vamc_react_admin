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
      <Paragraph>Ant Design의 날짜 관련 컴포넌트입니다. 내부적으로 <Text code>dayjs</Text>를 사용합니다.</Paragraph>

      <Divider titlePlacement="left">DatePicker 기본</Divider>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <DatePicker placeholder="날짜 선택" onChange={setDate} />
          <DatePicker picker="week" placeholder="주 선택" />
          <DatePicker picker="month" placeholder="월 선택" />
          <DatePicker picker="quarter" placeholder="분기 선택" />
          <DatePicker picker="year" placeholder="연도 선택" />
        </Space>
        {date && <Text>선택한 날짜: {date.format('YYYY-MM-DD')}</Text>}
      </Space>

      <Divider titlePlacement="left">RangePicker</Divider>
      <Space orientation="vertical">
        <RangePicker
          placeholder={['시작일', '종료일']}
          onChange={(dates) => setRange(dates as [Dayjs | null, Dayjs | null] | null)}
        />
        <RangePicker picker="month" placeholder={['시작월', '종료월']} />
        {range?.[0] && range?.[1] && (
          <Text>{range[0]!.format('YYYY-MM-DD')} ~ {range[1]!.format('YYYY-MM-DD')}</Text>
        )}
      </Space>

      <Divider titlePlacement="left">DatePicker with 시간</Divider>
      <Space>
        <DatePicker showTime placeholder="날짜 + 시간" format="YYYY-MM-DD HH:mm" />
        <RangePicker showTime format="YYYY-MM-DD HH:mm" placeholder={['시작', '종료']} />
      </Space>

      <Divider titlePlacement="left">비활성화 날짜</Divider>
      <DatePicker
        disabledDate={(current) => current && current.isBefore(new Date(), 'day')}
        placeholder="오늘 이후만 선택 가능"
      />

      <Divider titlePlacement="left">사용법 코드</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';

// 단일 날짜
<DatePicker
  value={value}
  onChange={(date: Dayjs | null) => setValue(date)}
  format="YYYY-MM-DD"
/>

// 범위
<DatePicker.RangePicker
  value={[start, end]}
  onChange={(dates) => {
    setStart(dates?.[0] ?? null);
    setEnd(dates?.[1] ?? null);
  }}
/>`}</pre>
      </Card>

      <Divider titlePlacement="left">Calendar 컴포넌트</Divider>
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 8, maxWidth: 600 }}>
        <Calendar fullscreen={false} />
      </div>
    </div>
  );
}
