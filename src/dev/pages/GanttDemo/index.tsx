import { useState, useCallback } from 'react';
import { Tabs, Card, Select, Switch, InputNumber, Alert, Tag } from 'antd';
import GanttView from '@/components/gantt/GanttView';
import type { GanttTask, GanttViewMode } from '@/components/gantt/ganttTypes';
import CodeSnippet from '@/components/common/CodeSnippet';
import styles from './index.module.css';
import DevPageHeader from '@/dev/DevPageHeader';

/* ─── Sample data ─── */
const sampleTasks: GanttTask[] = [
  { id: 'G1', name: '기획/분석', start: '2025-01-02', end: '2025-01-17', progress: 100, isGroup: true },
  { id: 'T1', name: '요구사항 분석', start: '2025-01-02', end: '2025-01-10', progress: 100, assignee: '홍길동', parentId: 'G1', level: 1 },
  { id: 'T2', name: '시스템 설계', start: '2025-01-13', end: '2025-01-17', progress: 100, assignee: '김철수', dependencies: ['T1'], parentId: 'G1', level: 1 },
  { id: 'G2', name: '개발', start: '2025-01-20', end: '2025-03-07', progress: 55, isGroup: true },
  { id: 'T3', name: '프론트엔드 개발', start: '2025-01-20', end: '2025-02-21', progress: 60, assignee: '이영희', dependencies: ['T2'], parentId: 'G2', level: 1 },
  { id: 'T4', name: '백엔드 API 개발', start: '2025-01-20', end: '2025-02-14', progress: 75, assignee: '박민수', dependencies: ['T2'], parentId: 'G2', level: 1 },
  { id: 'T5', name: '통합 테스트', start: '2025-02-24', end: '2025-03-07', progress: 20, assignee: '최지영', dependencies: ['T3', 'T4'], parentId: 'G2', level: 1 },
  { id: 'T6', name: '배포', start: '2025-03-10', end: '2025-03-14', progress: 0, assignee: '홍길동', dependencies: ['T5'], milestone: false, priority: 'critical' },
];

/* ─── Code snippets ─── */
const basicCode = `import GanttView from '@/components/gantt/GanttView';
import type { GanttTask, GanttViewMode } from '@/components/gantt/ganttTypes';

const tasks: GanttTask[] = [
  {
    id: 'T1', name: '요구사항 분석',
    start: '2025-01-02', end: '2025-01-10',
    progress: 100, assignee: '홍길동',
    dependencies: [],
    priority: 'normal',
  },
];

<GanttView
  tasks={tasks}
  viewMode="Week"           // 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  showCriticalPath={false}  // 크리티컬 패스 표시
  showGrid={true}           // 좌측 그리드 패널
  showProgress={true}       // 진행률 바
  lines="both"              // 'vertical' | 'horizontal' | 'both' | 'none'
  barHeight={28}
  height="100%"
/>`;

const eventCode = `<GanttView
  tasks={tasks}
  onTaskClick={(task) => console.log('click:', task.id)}
  onTaskDoubleClick={(task) => console.log('dblclick:', task.name)}
  onTaskHover={(task) => console.log('hover:', task?.id ?? 'leave')}
  onTaskSelect={(task) => console.log('select:', task?.name ?? 'deselect')}
  onTaskContextMenu={(task, e) => { e.preventDefault(); showMenu(task); }}
  onGanttReady={() => console.log('gantt ready')}
  onDateChange={(task, start, end) => {
    console.log(task.name, start.toISOString(), end.toISOString());
  }}
  onProgressChange={(task, progress) => {
    console.log(task.name, progress + '%');
  }}
/>`;

const taskTypeCode = `interface GanttTask {
  // ── 필수
  id: string;
  name: string;
  start: string;         // 'YYYY-MM-DD'
  end: string;           // 'YYYY-MM-DD'
  progress: number;      // 0~100

  // ── 의존성
  dependencies?: string[];                          // 의존 태스크 ID 목록
  dependencyTypes?: Record<string, DependencyType>; // 'FS'|'SS'|'FF'|'SF'

  // ── 계층/그룹
  parentId?: string;     // WBS 부모 ID
  level?: number;        // 들여쓰기 깊이 (0=루트, 1=자식)
  isGroup?: boolean;     // 그룹 노드 (접기/펼치기 가능)

  // ── 표시 옵션
  milestone?: boolean;
  assignee?: string;
  color?: string;        // 바 색상 override
  description?: string;
  projectName?: string;
  customClass?: string;  // 바에 추가할 CSS 클래스
  locked?: boolean;      // 날짜/진행률 개별 고정
  priority?: 'low' | 'normal' | 'high' | 'critical';
}`;

/* ─── Props table data ─── */
const viewProps = [
  { name: 'tasks', type: 'GanttTask[]', required: true, default: '—', desc: '태스크 목록' },
  { name: 'viewMode', type: "'Quarter Day'|'Half Day'|'Day'|'Week'|'Month'", required: false, default: "'Week'", desc: '타임라인 표시 단위' },
  { name: 'readOnly', type: 'boolean', required: false, default: 'false', desc: '날짜/진행률 드래그 편집 비활성화' },
  { name: 'showCriticalPath', type: 'boolean', required: false, default: 'false', desc: '크리티컬 패스 강조 표시' },
  { name: 'showGrid', type: 'boolean', required: false, default: 'true', desc: '좌측 태스크 그리드 패널 표시' },
  { name: 'gridWidth', type: 'number', required: false, default: '400', desc: '좌측 그리드 초기 너비(px)' },
  { name: 'gridMinWidth', type: 'number', required: false, default: '200', desc: '그리드 최소 너비(px)' },
  { name: 'gridMaxWidth', type: 'number', required: false, default: '600', desc: '그리드 최대 너비(px)' },
  { name: 'collapsedGroups', type: 'Set<string>', required: false, default: 'new Set()', desc: '접힌 그룹 ID 세트 (controlled)' },
  { name: 'onToggleGroup', type: '(groupId: string) => void', required: false, default: '—', desc: '그룹 접기/펼치기 콜백' },
  { name: 'height', type: 'string | number', required: false, default: "'100%'", desc: '컴포넌트 높이' },
  { name: 'className', type: 'string', required: false, default: '—', desc: '추가 CSS 클래스' },
  { name: 'loading', type: 'boolean', required: false, default: 'false', desc: '로딩 오버레이 표시' },
  { name: 'showProgress', type: 'boolean', required: false, default: 'true', desc: '진행률 바 표시' },
  { name: 'todayButton', type: 'boolean', required: false, default: 'true', desc: 'Today 이동 버튼 표시' },
  { name: 'lines', type: "'vertical'|'horizontal'|'both'|'none'", required: false, default: "'both'", desc: '타임라인 격자선 종류' },
  { name: 'barHeight', type: 'number', required: false, default: '28', desc: '간트 바 높이(px)' },
  { name: 'barCornerRadius', type: 'number', required: false, default: '4', desc: '간트 바 모서리 반경' },
  { name: 'rowPadding', type: 'number', required: false, default: '16', desc: '행 위아래 패딩(px). rowHeight = barHeight + rowPadding' },
  { name: 'language', type: 'string', required: false, default: "'ko'", desc: '날짜 표시 언어 (ko/en 등)' },
];

const viewEvents = [
  { name: 'onTaskClick', type: '(task: GanttTask) => void', desc: '태스크 바 클릭' },
  { name: 'onTaskDoubleClick', type: '(task: GanttTask) => void', desc: '태스크 바 더블클릭' },
  { name: 'onTaskContextMenu', type: '(task: GanttTask, e: MouseEvent) => void', desc: '태스크 바 우클릭 (기본 컨텍스트 메뉴 자동 억제)' },
  { name: 'onTaskHover', type: '(task: GanttTask | null) => void', desc: '태스크 호버 진입(task) / 이탈(null)' },
  { name: 'onTaskSelect', type: '(task: GanttTask | null) => void', desc: '태스크 선택 변경. 선택 해제 시 null 전달' },
  { name: 'onGanttReady', type: '() => void', desc: '간트 차트 초기 렌더링 완료 시점' },
  { name: 'onDateChange', type: '(task: GanttTask, start: Date, end: Date) => void', desc: '바 드래그로 날짜 변경 (readOnly=false일 때)' },
  { name: 'onProgressChange', type: '(task: GanttTask, progress: number) => void', desc: '진행률 바 드래그로 변경 (readOnly=false일 때)' },
];

const taskProps = [
  { name: 'id', type: 'string', required: true, desc: '고유 식별자' },
  { name: 'name', type: 'string', required: true, desc: '태스크 이름' },
  { name: 'start', type: 'string', required: true, desc: "시작일 'YYYY-MM-DD'" },
  { name: 'end', type: 'string', required: true, desc: "종료일 'YYYY-MM-DD'" },
  { name: 'progress', type: 'number', required: true, desc: '진행률 0~100' },
  { name: 'dependencies', type: 'string[]', required: false, desc: '의존 태스크 ID 목록 (화살표 연결선)' },
  { name: 'dependencyTypes', type: "Record<string, 'FS'|'SS'|'FF'|'SF'>", required: false, desc: '의존 관계 타입 (기본: FS)' },
  { name: 'parentId', type: 'string', required: false, desc: 'WBS 부모 태스크 ID' },
  { name: 'level', type: 'number', required: false, desc: '들여쓰기 깊이 (0=루트, 1=자식)' },
  { name: 'isGroup', type: 'boolean', required: false, desc: '그룹 노드 여부 (접기/펼치기 가능)' },
  { name: 'milestone', type: 'boolean', required: false, desc: '마일스톤 마커로 표시' },
  { name: 'assignee', type: 'string', required: false, desc: '담당자 (툴팁에 표시)' },
  { name: 'color', type: 'string', required: false, desc: '바 색상 override (hex/rgb)' },
  { name: 'description', type: 'string', required: false, desc: '설명 (툴팁에 표시)' },
  { name: 'projectName', type: 'string', required: false, desc: '프로젝트명' },
  { name: 'customClass', type: 'string', required: false, desc: '바에 추가할 CSS 클래스' },
  { name: 'locked', type: 'boolean', required: false, desc: 'readOnly=false여도 이 태스크는 편집 불가' },
  { name: 'priority', type: "'low'|'normal'|'high'|'critical'", required: false, desc: '우선순위 (바 스타일 클래스로 적용)' },
];

export default function GanttDemo() {
  const [viewMode, setViewMode] = useState<GanttViewMode>('Week');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [lines, setLines] = useState<'vertical' | 'horizontal' | 'both' | 'none'>('both');
  const [barHeight, setBarHeight] = useState(28);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setEventLog((prev) => [`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`, ...prev].slice(0, 15));
  }, []);

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GanttDemo" />

      <Tabs
        defaultActiveKey="demo"
        items={[
          /* ── 라이브 데모 ── */
          {
            key: 'demo',
            label: '라이브 데모',
            children: (
              <Card size="small">
                <div className={styles.controlBar}>
                  <div className={styles.controlItem}>
                    <span>뷰 모드</span>
                    <Select
                      value={viewMode}
                      onChange={setViewMode}
                      style={{ width: 130 }}
                      options={[
                        { label: 'Quarter Day', value: 'Quarter Day' },
                        { label: 'Half Day', value: 'Half Day' },
                        { label: 'Day', value: 'Day' },
                        { label: 'Week', value: 'Week' },
                        { label: 'Month', value: 'Month' },
                      ]}
                    />
                  </div>
                  <div className={styles.controlItem}>
                    <span>크리티컬 패스</span>
                    <Switch size="small" checked={showCriticalPath} onChange={setShowCriticalPath} />
                  </div>
                  <div className={styles.controlItem}>
                    <span>좌측 그리드</span>
                    <Switch size="small" checked={showGrid} onChange={setShowGrid} />
                  </div>
                  <div className={styles.controlItem}>
                    <span>진행률 바</span>
                    <Switch size="small" checked={showProgress} onChange={setShowProgress} />
                  </div>
                  <div className={styles.controlItem}>
                    <span>격자선</span>
                    <Select
                      value={lines}
                      onChange={setLines}
                      style={{ width: 110 }}
                      options={[
                        { label: 'both', value: 'both' },
                        { label: 'vertical', value: 'vertical' },
                        { label: 'horizontal', value: 'horizontal' },
                        { label: 'none', value: 'none' },
                      ]}
                    />
                  </div>
                  <div className={styles.controlItem}>
                    <span>바 높이</span>
                    <InputNumber
                      value={barHeight}
                      onChange={(v) => setBarHeight(v ?? 28)}
                      min={16}
                      max={48}
                      style={{ width: 65 }}
                    />
                  </div>
                </div>
                <div style={{ height: 480 }}>
                  <GanttView
                    tasks={sampleTasks}
                    viewMode={viewMode}
                    showCriticalPath={showCriticalPath}
                    showGrid={showGrid}
                    showProgress={showProgress}
                    lines={lines}
                    barHeight={barHeight}
                  />
                </div>
                <CodeSnippet code={basicCode} />
              </Card>
            ),
          },

          /* ── 이벤트 ── */
          {
            key: 'events',
            label: '이벤트',
            children: (
              <Card size="small">
                <Alert
                  type="info"
                  showIcon
                  title="태스크를 클릭/더블클릭/호버해보세요. 아래 로그에 이벤트가 기록됩니다."
                  style={{ marginBottom: 12 }}
                />
                <div style={{ height: 380 }}>
                  <GanttView
                    tasks={sampleTasks}
                    viewMode="Week"
                    onTaskClick={(t) => addLog(`click: ${t.id} "${t.name}"`)}
                    onTaskDoubleClick={(t) => addLog(`dblclick: ${t.id} "${t.name}"`)}
                    onTaskHover={(t) => t && addLog(`hover: ${t.id}`)}
                    onTaskSelect={(t) => addLog(`select: ${t ? `"${t.name}"` : '(해제)'}`)}
                    onGanttReady={() => addLog('ganttReady: 초기화 완료')}
                    onDateChange={(t, s, e) =>
                      addLog(`dateChange: "${t.name}" ${s.toLocaleDateString('ko-KR')} ~ ${e.toLocaleDateString('ko-KR')}`)
                    }
                    onProgressChange={(t, p) => addLog(`progressChange: "${t.name}" → ${p}%`)}
                  />
                </div>
                <Card size="small" title="이벤트 로그" style={{ marginTop: 8 }}>
                  <div className={styles.eventLog}>
                    {eventLog.length === 0 ? (
                      <span className={styles.eventLogEmpty}>이벤트 없음</span>
                    ) : (
                      eventLog.map((log, i) => (
                        <div key={i} className={styles.eventLogItem}>{log}</div>
                      ))
                    )}
                  </div>
                </Card>
                <CodeSnippet code={eventCode} />
              </Card>
            ),
          },

          /* ── Props & Events ── */
          {
            key: 'props',
            label: 'Props & Events',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* GanttView Props */}
                <div className={styles.propsSection}>
                  <h3>GanttView Props</h3>
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: 180 }}>Prop</th>
                        <th>타입</th>
                        <th style={{ width: 110 }}>기본값</th>
                        <th>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewProps.map((p) => (
                        <tr key={p.name}>
                          <td>
                            <code>{p.name}</code>
                            {p.required && <span className={styles.required}>*</span>}
                          </td>
                          <td><code>{p.type}</code></td>
                          <td><span className={styles.defaultVal}>{p.default}</span></td>
                          <td>{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* GanttView Events */}
                <div className={styles.propsSection}>
                  <h3>GanttView Events</h3>
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: 200 }}>이벤트</th>
                        <th>시그니처</th>
                        <th>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEvents.map((e) => (
                        <tr key={e.name}>
                          <td><code>{e.name}</code></td>
                          <td><code>{e.type}</code></td>
                          <td>{e.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* GanttTask type */}
                <div className={styles.propsSection}>
                  <h3>GanttTask 타입</h3>
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: 160 }}>필드</th>
                        <th>타입</th>
                        <th style={{ width: 70 }}>필수</th>
                        <th>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskProps.map((p) => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td><code>{p.type}</code></td>
                          <td style={{ textAlign: 'center' }}>
                            {p.required
                              ? <Tag color="red" style={{ fontSize: 11 }}>필수</Tag>
                              : <span className={styles.defaultVal}>선택</span>
                            }
                          </td>
                          <td>{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <CodeSnippet code={taskTypeCode} />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
