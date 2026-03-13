import { Typography, Card, Divider, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

const now = dayjs();

const examples = [
  { method: "dayjs()", result: now.format() },
  { method: "dayjs().format('YYYY-MM-DD')", result: now.format('YYYY-MM-DD') },
  { method: "dayjs().format('YYYY년 MM월 DD일')", result: now.format('YYYY년 MM월 DD일') },
  { method: "dayjs().format('HH:mm:ss')", result: now.format('HH:mm:ss') },
  { method: "dayjs().add(7, 'day').format('YYYY-MM-DD')", result: now.add(7, 'day').format('YYYY-MM-DD') },
  { method: "dayjs().subtract(1, 'month').format('YYYY-MM-DD')", result: now.subtract(1, 'month').format('YYYY-MM-DD') },
  { method: "dayjs().startOf('month').format('YYYY-MM-DD')", result: now.startOf('month').format('YYYY-MM-DD') },
  { method: "dayjs().endOf('month').format('YYYY-MM-DD')", result: now.endOf('month').format('YYYY-MM-DD') },
  { method: "dayjs().diff(dayjs('2024-01-01'), 'day')", result: String(now.diff(dayjs('2024-01-01'), 'day')) },
  { method: "dayjs('2024-12-31').isValid()", result: String(dayjs('2024-12-31').isValid()) },
  { method: "dayjs().isBefore(dayjs('2099-01-01'))", result: String(now.isBefore(dayjs('2099-01-01'))) },
  { method: "dayjs().unix()", result: String(now.unix()) },
];

const columns: TableColumnsType<(typeof examples)[0]> = [
  { title: '코드', dataIndex: 'method', key: 'method', render: (v) => <Text code>{v}</Text> },
  { title: '결과', dataIndex: 'result', key: 'result' },
];

export default function GuideDayjs() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>dayjs 가이드</Title>
      <Paragraph>dayjs는 경량 날짜 라이브러리입니다. Moment.js와 호환되는 API를 가지며 2KB 미만입니다.</Paragraph>

      <Divider titlePlacement="left">실시간 예제 (현재 시각 기준)</Divider>
      <Table
        dataSource={examples.map((e, i) => ({ ...e, key: i }))}
        columns={columns}
        size="small"
        pagination={false}
      />

      <Divider titlePlacement="left">날짜 파싱</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import dayjs from 'dayjs';

dayjs()                          // 현재 시각
dayjs('2024-01-15')             // 문자열 파싱
dayjs('2024-01-15 09:30:00')    // 날짜+시간
dayjs(1705276800000)            // 타임스탬프(ms)
dayjs(new Date())               // Date 객체`}</pre>
      </Card>

      <Divider titlePlacement="left">플러그인 사용</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale('ko');

dayjs().fromNow()               // '방금 전', '3일 전'
dayjs().isBetween(start, end)   // 범위 내 여부`}</pre>
      </Card>
    </div>
  );
}
