import { Typography, Card, Divider, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import DevPageHeader from '@/dev/DevPageHeader';

const { Paragraph, Text } = Typography;

const now = dayjs();

const examples = [
  { method: "dayjs()", result: now.format() },
  { method: "dayjs().format('YYYY-MM-DD')", result: now.format('YYYY-MM-DD') },
  { method: "dayjs().format('MMMM D, YYYY')", result: now.format('MMMM D, YYYY') },
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
  { title: 'Code', dataIndex: 'method', key: 'method', render: (v) => <Text code>{v}</Text> },
  { title: 'Result', dataIndex: 'result', key: 'result' },
];

export default function GuideDayjs() {
  return (
    <div style={{ padding: 24 }}>
      <DevPageHeader page="GuideDayjs" />
      <Paragraph>dayjs is a lightweight date library. It offers a Moment.js-compatible API in under 2 KB.</Paragraph>

      <Divider titlePlacement="left">Live examples (based on the current time)</Divider>
      <Table
        dataSource={examples.map((e, i) => ({ ...e, key: i }))}
        columns={columns}
        size="small"
        pagination={false}
      />

      <Divider titlePlacement="left">Parsing dates</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import dayjs from 'dayjs';

dayjs()                          // current time
dayjs('2024-01-15')             // parse a string
dayjs('2024-01-15 09:30:00')    // date + time
dayjs(1705276800000)            // timestamp (ms)
dayjs(new Date())               // Date object`}</pre>
      </Card>

      <Divider titlePlacement="left">Using plugins</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale('ko');

dayjs().fromNow()               // 'a few seconds ago', '3 days ago'
dayjs().isBetween(start, end)   // is it inside the range`}</pre>
      </Card>
    </div>
  );
}
