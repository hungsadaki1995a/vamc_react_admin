import { Typography, Card, Divider, Alert } from 'antd';
import 'frappe-gantt/dist/frappe-gantt.css';

const { Title, Paragraph, Text } = Typography;

export default function GuideFrappeGantt() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Frappe Gantt 가이드</Title>
      <Paragraph>Frappe Gantt는 오픈소스 간트 차트 라이브러리입니다. 이 프로젝트에서는 <Text code>GanttView</Text> 컴포넌트로 래핑하여 사용합니다.</Paragraph>

      <Alert
        type="info"
        title="버전: frappe-gantt 1.2.2"
        description="실제 간트 차트 데모는 '간트 차트' 메뉴에서 확인하세요."
        style={{ marginBottom: 16 }}
      />

      <Divider titlePlacement="left">Task 데이터 구조</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`interface Task {
  id: string;
  name: string;
  start: string;   // 'YYYY-MM-DD'
  end: string;     // 'YYYY-MM-DD'
  progress: number; // 0~100
  dependencies?: string; // 'task1,task2'
  custom_class?: string; // CSS 클래스
}`}</pre>
      </Card>

      <Divider titlePlacement="left">기본 사용법</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import Gantt from 'frappe-gantt';

const tasks = [
  {
    id: 'task1',
    name: '요구사항 분석',
    start: '2024-01-01',
    end: '2024-01-15',
    progress: 100,
  },
  {
    id: 'task2',
    name: '설계',
    start: '2024-01-16',
    end: '2024-01-31',
    progress: 60,
    dependencies: 'task1',
  },
];

const gantt = new Gantt('#gantt-container', tasks, {
  view_mode: 'Week',           // 'Day' | 'Week' | 'Month' | 'Year'
  date_format: 'YYYY-MM-DD',
  on_click: (task) => console.log(task),
  on_date_change: (task, start, end) => { /* 저장 */ },
  on_progress_change: (task, progress) => { /* 저장 */ },
});`}</pre>
      </Card>

      <Divider titlePlacement="left">이 프로젝트의 GanttView 래퍼</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import GanttView from '@/components/gantt/GanttView';

<GanttView
  tasks={tasks}
  viewMode="Week"
  onTaskUpdate={(task) => saveTask(task)}
/>`}</pre>
      </Card>

      <Divider titlePlacement="left">추가 기능 (커스텀 구현)</Divider>
      <ul>
        <li>좌측 그리드 패널 (이름, 담당자, 진행률 컬럼)</li>
        <li>컬럼 드래그 리사이즈</li>
        <li>좌측/간트 영역 스크롤 동기화</li>
        <li>호버 동기화 (양방향)</li>
        <li>오늘 하이라이트 (빨간 선 + 점)</li>
        <li>Today 버튼으로 자동 스크롤</li>
        <li>크리티컬 패스 표시</li>
        <li>다크 모드 지원</li>
      </ul>
    </div>
  );
}
