import { useState, useCallback, useMemo, useRef } from 'react';
import { Tabs, Card, Select, Switch, InputNumber, Alert, Tag, Button, Statistic, Row, Col } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { GanttSheet } from '@/components/gantt-sheet';
import type { GanttTask, GanttViewMode } from '@/components/gantt-sheet';
import CodeSnippet from '@/components/common/CodeSnippet';
import styles from './index.module.css';

/* ─── Sample data (기본 데모용) ─── */
const sampleTasks: GanttTask[] = [
  { id: 'G1', name: '1단계: 기획/분석', start: '2025-01-02', end: '2025-01-17', progress: 100, isGroup: true },
  { id: 'T1', name: '요구사항 분석', start: '2025-01-02', end: '2025-01-10', progress: 100, assignee: '홍길동', dependencies: [], parentId: 'G1', level: 1 },
  { id: 'T2', name: '시스템 설계', start: '2025-01-13', end: '2025-01-17', progress: 100, assignee: '김철수', dependencies: ['T1'], parentId: 'G1', level: 1 },
  { id: 'G2', name: '2단계: 개발', start: '2025-01-20', end: '2025-03-07', progress: 55, isGroup: true },
  { id: 'T3', name: '프론트엔드 개발', start: '2025-01-20', end: '2025-02-21', progress: 60, assignee: '이영희', dependencies: ['T2'], parentId: 'G2', level: 1 },
  { id: 'T4', name: '백엔드 API 개발', start: '2025-01-20', end: '2025-02-14', progress: 75, assignee: '박민수', dependencies: ['T2'], parentId: 'G2', level: 1 },
  { id: 'T5', name: '통합 테스트', start: '2025-02-24', end: '2025-03-07', progress: 20, assignee: '최지영', dependencies: ['T3', 'T4'], parentId: 'G2', level: 1 },
  { id: 'G3', name: '3단계: 배포', start: '2025-03-10', end: '2025-03-21', progress: 0, isGroup: true },
  { id: 'T6', name: '스테이징 배포', start: '2025-03-10', end: '2025-03-14', progress: 0, assignee: '홍길동', dependencies: ['T5'], parentId: 'G3', level: 1, priority: 'high' },
  { id: 'T7', name: '프로덕션 배포', start: '2025-03-17', end: '2025-03-21', progress: 0, assignee: '홍길동', dependencies: ['T6'], parentId: 'G3', level: 1, priority: 'critical', milestone: false },
];

/* ─── Large task generator (성능 테스트용) ─── */
const ASSIGNEES = ['홍길동', '김철수', '이영희', '박민수', '최지영', '정유진', '강민호', '윤서연'];
const PRIORITIES: GanttTask['priority'][] = ['low', 'normal', 'normal', 'high', 'critical'];
const PHASE_NAMES = ['요구분석', '설계', '개발', '테스트', '배포'];

/** 2-depth: 그룹 → 태스크 */
function generateTasks(count: number): GanttTask[] {
  const tasks: GanttTask[] = [];
  const groupSize = 10;
  const groupCount = Math.ceil(count / groupSize);
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - Math.floor((groupCount * 14) / 4));

  for (let g = 0; g < groupCount; g++) {
    const gId = `G${g}`;
    const gStart = new Date(baseDate);
    gStart.setDate(gStart.getDate() + g * 14);
    const gEnd = new Date(gStart);
    gEnd.setDate(gEnd.getDate() + groupSize * 3);

    tasks.push({
      id: gId,
      name: `프로젝트 ${g + 1}`,
      start: gStart.toISOString().slice(0, 10),
      end: gEnd.toISOString().slice(0, 10),
      progress: Math.floor(Math.random() * 100),
      isGroup: true,
      level: 0,
    });

    for (let t = 0; t < groupSize && tasks.length < count + groupCount; t++) {
      const tId = `T${g}_${t}`;
      const tStart = new Date(gStart);
      tStart.setDate(tStart.getDate() + t * 2);
      const tEnd = new Date(tStart);
      tEnd.setDate(tEnd.getDate() + Math.floor(Math.random() * 5) + 2);

      tasks.push({
        id: tId,
        name: `태스크 ${g + 1}-${t + 1}`,
        start: tStart.toISOString().slice(0, 10),
        end: tEnd.toISOString().slice(0, 10),
        progress: Math.floor(Math.random() * 100),
        assignee: ASSIGNEES[Math.floor(Math.random() * ASSIGNEES.length)],
        dependencies: t > 0 ? [`T${g}_${t - 1}`] : [],
        parentId: gId,
        level: 1,
        priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
      });
    }
  }

  return tasks.slice(0, count + groupCount);
}

/** 3-depth: 프로젝트(0) → 단계(1) → 태스크(2) */
function generateTreeTasks(count: number): GanttTask[] {
  const tasks: GanttTask[] = [];
  const tasksPerPhase = 4;            // 단계당 태스크 수
  const phasesPerProject = 3;         // 프로젝트당 단계 수
  // rows per project = 1(top) + 3(phases) + 12(tasks) = 16
  const rowsPerProject = 1 + phasesPerProject + phasesPerProject * tasksPerPhase;
  const projectCount = Math.ceil(count / rowsPerProject);
  const phaseDays = tasksPerPhase * 3; // 단계 1개 기간(일)

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - Math.floor((projectCount * phaseDays * phasesPerProject) / 4));

  for (let p = 0; p < projectCount; p++) {
    const gId = `PG${p}`;
    const gStart = new Date(baseDate);
    gStart.setDate(gStart.getDate() + p * phaseDays * phasesPerProject);
    const gEnd = new Date(gStart);
    gEnd.setDate(gEnd.getDate() + phaseDays * phasesPerProject + 2);

    tasks.push({
      id: gId,
      name: `프로젝트 ${p + 1}`,
      start: gStart.toISOString().slice(0, 10),
      end: gEnd.toISOString().slice(0, 10),
      progress: Math.floor(Math.random() * 100),
      isGroup: true,
      level: 0,
    });

    for (let s = 0; s < phasesPerProject; s++) {
      const sgId = `PS${p}_${s}`;
      const sgStart = new Date(gStart);
      sgStart.setDate(sgStart.getDate() + s * phaseDays);
      const sgEnd = new Date(sgStart);
      sgEnd.setDate(sgEnd.getDate() + phaseDays);

      tasks.push({
        id: sgId,
        name: PHASE_NAMES[s % PHASE_NAMES.length],
        start: sgStart.toISOString().slice(0, 10),
        end: sgEnd.toISOString().slice(0, 10),
        progress: Math.floor(Math.random() * 100),
        isGroup: true,
        parentId: gId,
        level: 1,
      });

      for (let t = 0; t < tasksPerPhase; t++) {
        const tId = `PT${p}_${s}_${t}`;
        const tStart = new Date(sgStart);
        tStart.setDate(tStart.getDate() + t * 3);
        const tEnd = new Date(tStart);
        tEnd.setDate(tEnd.getDate() + Math.floor(Math.random() * 3) + 2);

        // 첫 태스크: 이전 단계 마지막 태스크에 의존
        const prevDep = t === 0 && s > 0 ? [`PT${p}_${s - 1}_${tasksPerPhase - 1}`] : t > 0 ? [`PT${p}_${s}_${t - 1}`] : [];

        tasks.push({
          id: tId,
          name: `작업 ${p + 1}-${s + 1}-${t + 1}`,
          start: tStart.toISOString().slice(0, 10),
          end: tEnd.toISOString().slice(0, 10),
          progress: Math.floor(Math.random() * 100),
          assignee: ASSIGNEES[Math.floor(Math.random() * ASSIGNEES.length)],
          dependencies: prevDep,
          parentId: sgId,
          level: 2,
          priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
        });
      }
    }
  }

  return tasks;
}

/* ─── Code snippets ─── */
const basicCode = `import { GanttSheet } from '@/components/gantt-sheet';
import type { GanttTask, GanttViewMode } from '@/components/gantt-sheet';

// GanttView와 동일한 Props — drop-in 교체 가능
<GanttSheet
  tasks={tasks}
  viewMode="Week"
  showCriticalPath={false}
  showGrid={true}
  showProgress={true}
  barHeight={28}
  height="100%"
/>`;

const perfCode = `// 5000행 이상도 60fps 스크롤
// @tanstack/react-virtual 기반 — 가시 행만 DOM에 렌더링

<GanttSheet
  tasks={largeTaskList}   // 5000+ GanttTask[]
  viewMode="Month"
  rowBuffer={5}           // 오버스캔 행 수 (기본: 5)
  columnWidth={80}        // 뷰모드별 열 너비 px 오버라이드
  height={600}
/>`;

const dragCode = `// 바 드래그 편집 — pointer capture 기반
// readOnly=false (기본) 시 활성화

<GanttSheet
  tasks={tasks}
  onDateChange={(task, start, end) => {
    // 드래그 완료 후 날짜 변경 콜백
    updateTask(task.id, { start, end });
  }}
  onProgressChange={(task, progress) => {
    updateTask(task.id, { progress });
  }}
/>

// 개별 태스크 편집 잠금
const tasks = [
  { ...task, locked: true },  // 이 태스크만 드래그 불가
];`;

/* ─── Props table ─── */
const sheetProps = [
  { name: 'tasks', type: 'GanttTask[]', required: true, default: '—', desc: '태스크 목록 (5000+행 가상화 처리)' },
  { name: 'viewMode', type: "'Quarter Day'|'Half Day'|'Day'|'Week'|'Month'", required: false, default: "'Week'", desc: '타임라인 단위' },
  { name: 'readOnly', type: 'boolean', required: false, default: 'false', desc: '드래그 편집 비활성화' },
  { name: 'showCriticalPath', type: 'boolean', required: false, default: 'false', desc: '크리티컬 패스 강조' },
  { name: 'showGrid', type: 'boolean', required: false, default: 'true', desc: '좌측 그리드 패널' },
  { name: 'gridWidth', type: 'number', required: false, default: '400', desc: '그리드 초기 너비(px)' },
  { name: 'collapsedGroups', type: 'Set<string>', required: false, default: 'undefined', desc: '접힌 그룹 ID (controlled). 미전달 시 내부 상태 관리' },
  { name: 'onToggleGroup', type: '(groupId: string) => void', required: false, default: '—', desc: '그룹 접기/펼치기 콜백' },
  { name: 'height', type: 'string | number', required: false, default: "'100%'", desc: '컴포넌트 높이' },
  { name: 'loading', type: 'boolean', required: false, default: 'false', desc: '로딩 오버레이' },
  { name: 'showProgress', type: 'boolean', required: false, default: 'true', desc: '진행률 바 표시' },
  { name: 'todayButton', type: 'boolean', required: false, default: 'true', desc: '오늘 날짜 이동 버튼' },
  { name: 'barHeight', type: 'number', required: false, default: '28', desc: '바 높이(px)' },
  { name: 'barCornerRadius', type: 'number', required: false, default: '4', desc: '바 모서리 반경' },
  { name: 'rowPadding', type: 'number', required: false, default: '16', desc: '행 패딩. rowHeight = barHeight + rowPadding' },
  { name: 'rowBuffer', type: 'number', required: false, default: '5', desc: '가상화 오버스캔 행 수 (GanttSheet 전용)' },
  { name: 'columnWidth', type: 'number', required: false, default: '뷰모드 기본값', desc: '열 너비 px 오버라이드 (GanttSheet 전용)' },
  { name: 'scrollToTodayRef', type: 'MutableRefObject<(() => void) | null>', required: false, default: '—', desc: '오늘 날짜 스크롤 함수 외부 노출' },
];

const sheetEvents = [
  { name: 'onTaskClick', type: '(task: GanttTask) => void', desc: '태스크 바 클릭' },
  { name: 'onTaskDoubleClick', type: '(task: GanttTask) => void', desc: '태스크 바 더블클릭' },
  { name: 'onTaskContextMenu', type: '(task: GanttTask, e: MouseEvent) => void', desc: '태스크 바 우클릭' },
  { name: 'onTaskHover', type: '(task: GanttTask | null) => void', desc: '호버 진입(task) / 이탈(null)' },
  { name: 'onTaskSelect', type: '(task: GanttTask | null) => void', desc: '선택 변경' },
  { name: 'onGanttReady', type: '() => void', desc: '초기 렌더링 완료' },
  { name: 'onDateChange', type: '(task: GanttTask, start: Date, end: Date) => void', desc: '바 드래그 날짜 변경 (readOnly=false)' },
  { name: 'onProgressChange', type: '(task: GanttTask, progress: number) => void', desc: '진행률 드래그 변경 (readOnly=false)' },
];

/* ─── Component ─── */
export default function GanttSheetDemo() {
  const [viewMode, setViewMode] = useState<GanttViewMode>('Week');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [barHeight, setBarHeight] = useState(28);
  const [eventLog, setEventLog] = useState<string[]>([]);
  // Drag editing tab — mutable copy of sampleTasks
  const [dragTasks, setDragTasks] = useState<GanttTask[]>(sampleTasks);

  // Performance test
  const [rowCount, setRowCount] = useState(500);
  const [treeMode, setTreeMode] = useState(false);
  const perfTasks = useMemo(
    () => treeMode ? generateTreeTasks(rowCount) : generateTasks(rowCount),
    [rowCount, treeMode],
  );
  const scrollToTodayRef = useRef<(() => void) | null>(null);

  const addLog = useCallback((msg: string) => {
    setEventLog((prev) => [`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`, ...prev].slice(0, 15));
  }, []);

  const handleDragDateChange = useCallback((task: GanttTask, start: Date, end: Date) => {
    setDragTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
          : t,
      ),
    );
    addLog(`dateChange: "${task.name}" → ${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`);
  }, [addLog]);

  const handleDragProgressChange = useCallback((task: GanttTask, progress: number) => {
    setDragTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, progress } : t)),
    );
    addLog(`progressChange: "${task.name}" → ${progress}%`);
  }, [addLog]);

  const handlePerfReady = useCallback(() => {}, []);

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>간트 시트 (GanttSheet)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          Virtual Scroll 기반 대용량 간트 컴포넌트 — 5,000행+ 60fps 스크롤. GanttView와 동일한 Props.
        </p>
      </div>

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
                    <span>바 높이</span>
                    <InputNumber
                      value={barHeight}
                      onChange={(v) => setBarHeight(v ?? 28)}
                      min={16} max={48} style={{ width: 65 }}
                    />
                  </div>
                </div>
                <div style={{ height: 460 }}>
                  <GanttSheet
                    tasks={sampleTasks}
                    viewMode={viewMode}
                    showCriticalPath={showCriticalPath}
                    showGrid={showGrid}
                    showProgress={showProgress}
                    barHeight={barHeight}
                  />
                </div>
                <CodeSnippet code={basicCode} />
              </Card>
            ),
          },

          /* ── 성능 테스트 ── */
          {
            key: 'perf',
            label: (
              <span>
                <ThunderboltOutlined /> 성능 테스트
              </span>
            ),
            children: (
              <Card size="small">
                <Alert
                  type="info"
                  showIcon
                  title="@tanstack/react-virtual 기반 가상화 — 행 수에 관계없이 DOM에는 ~30행만 존재합니다."
                  style={{ marginBottom: 16 }}
                />
                <div className={styles.controlBar} style={{ marginBottom: 16 }}>
                  <div className={styles.controlItem}>
                    <span>행 수</span>
                    <Select
                      value={rowCount}
                      onChange={setRowCount}
                      style={{ width: 120 }}
                      options={[
                        { label: '500행', value: 500 },
                        { label: '1,000행', value: 1000 },
                        { label: '2,000행', value: 2000 },
                        { label: '5,000행', value: 5000 },
                      ]}
                    />
                  </div>
                  <div className={styles.controlItem}>
                    <span>트리 구조</span>
                    <Switch
                      size="small"
                      checked={treeMode}
                      onChange={setTreeMode}
                      checkedChildren="3-depth"
                      unCheckedChildren="2-depth"
                    />
                  </div>
                  <div className={styles.controlItem}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {treeMode ? '프로젝트→단계→작업 (3depth)' : '그룹→태스크 (2depth)'} · DOM ~30행
                    </span>
                  </div>
                  <Button
                    size="small"
                    onClick={() => scrollToTodayRef.current?.()}
                  >
                    오늘로 이동
                  </Button>
                </div>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="총 태스크"
                        value={perfTasks.length}
                        suffix="행"
                        styles={{ content: { color: '#1677ff' } }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="DOM 노드 (행)"
                        value="~30"
                        suffix="개"
                        styles={{ content: { color: '#52c41a' } }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="메모리 절약"
                        value={Math.round((1 - 30 / perfTasks.length) * 100)}
                        suffix="%"
                        styles={{ content: { color: '#fa8c16' } }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="스크롤 목표"
                        value="60"
                        suffix="fps"
                        styles={{ content: { color: '#722ed1' } }}
                      />
                    </Card>
                  </Col>
                </Row>

                <div style={{ height: 520 }}>
                  <GanttSheet
                    tasks={perfTasks}
                    viewMode="Month"
                    showGrid={true}
                    showProgress={false}
                    barHeight={24}
                    rowPadding={8}
                    scrollToTodayRef={scrollToTodayRef}
                    onGanttReady={handlePerfReady}
                  />
                </div>
                <CodeSnippet code={perfCode} />
              </Card>
            ),
          },

          /* ── 드래그 편집 ── */
          {
            key: 'drag',
            label: '드래그 편집',
            children: (
              <Card size="small">
                <Alert
                  type="info"
                  showIcon
                  title="바를 드래그하여 이동, 좌우 핸들로 날짜 조절, 진행률 핸들로 진행률 변경. 아래 로그에 변경사항이 기록됩니다."
                  style={{ marginBottom: 12 }}
                />
                <div style={{ height: 360 }}>
                  <GanttSheet
                    tasks={dragTasks}
                    viewMode="Week"
                    showCriticalPath
                    onTaskClick={(t) => addLog(`click: "${t.name}"`)}
                    onTaskDoubleClick={(t) => addLog(`dblClick: "${t.name}"`)}
                    onTaskHover={(t) => t && addLog(`hover: "${t.name}"`)}
                    onTaskSelect={(t) => addLog(`select: ${t ? `"${t.name}"` : '(해제)'}`)}
                    onTaskContextMenu={(t) => addLog(`contextMenu: "${t.name}"`)}
                    onToggleGroup={(gId) => {
                      const g = dragTasks.find((t) => t.id === gId);
                      addLog(`toggleGroup: "${g?.name ?? gId}"`);
                    }}
                    onDateChange={handleDragDateChange}
                    onProgressChange={handleDragProgressChange}
                  />
                </div>
                <Card size="small" title="이벤트 로그" style={{ marginTop: 8 }}>
                  <div className={styles.eventLog}>
                    {eventLog.length === 0 ? (
                      <span className={styles.eventLogEmpty}>바를 드래그해보세요</span>
                    ) : (
                      eventLog.map((log, i) => (
                        <div key={i} className={styles.eventLogItem}>{log}</div>
                      ))
                    )}
                  </div>
                </Card>
                <CodeSnippet code={dragCode} />
              </Card>
            ),
          },

          /* ── Props & Events ── */
          {
            key: 'props',
            label: 'Props & Events',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Alert
                  type="success"
                  showIcon
                  title={
                    <span>
                      <strong>GanttView와 완전 호환</strong> — Props 인터페이스가 동일하여 drop-in 교체 가능합니다.
                      <code style={{ marginLeft: 8, background: 'rgba(82,196,26,0.1)', padding: '1px 6px', borderRadius: 3 }}>
                        import {'{ GanttSheet }'} from '@/components/gantt-sheet'
                      </code>
                    </span>
                  }
                />

                {/* Props */}
                <div className={styles.propsSection}>
                  <h3>GanttSheet Props</h3>
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: 180 }}>Prop</th>
                        <th>타입</th>
                        <th style={{ width: 120 }}>기본값</th>
                        <th>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetProps.map((p) => (
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

                {/* Events */}
                <div className={styles.propsSection}>
                  <h3>GanttSheet Events</h3>
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: 200 }}>이벤트</th>
                        <th>시그니처</th>
                        <th>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetEvents.map((e) => (
                        <tr key={e.name}>
                          <td><code>{e.name}</code></td>
                          <td><code>{e.type}</code></td>
                          <td>{e.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* GanttView vs GanttSheet 비교 */}
                <div className={styles.propsSection}>
                  <h3>GanttView vs GanttSheet 비교</h3>
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th>항목</th>
                        <th>GanttView</th>
                        <th>GanttSheet</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>렌더링 방식</td>
                        <td>frappe-gantt SVG 전체 렌더</td>
                        <td>react-virtual + DOM 바 (가시 행만)</td>
                      </tr>
                      <tr>
                        <td>권장 행 수</td>
                        <td><Tag color="orange">~200행</Tag></td>
                        <td><Tag color="green">5,000행+</Tag></td>
                      </tr>
                      <tr>
                        <td>Props 호환</td>
                        <td colSpan={2} style={{ textAlign: 'center' }}>
                          <Tag color="blue">동일 인터페이스 — drop-in 교체 가능</Tag>
                        </td>
                      </tr>
                      <tr>
                        <td>바 드래그 편집</td>
                        <td><Tag color="green">지원</Tag></td>
                        <td><Tag color="green">지원 (pointer capture 방식)</Tag></td>
                      </tr>
                      <tr>
                        <td>의존성 화살표</td>
                        <td><Tag color="green">전체</Tag></td>
                        <td><Tag color="blue">가시 범위만 렌더 (성능 최적화)</Tag></td>
                      </tr>
                      <tr>
                        <td>날짜 헤더</td>
                        <td>frappe-gantt 내장</td>
                        <td>자체 구현 (Month/Week/Day/Half Day/Quarter Day)</td>
                      </tr>
                      <tr>
                        <td>다크모드</td>
                        <td><Tag color="green">지원</Tag></td>
                        <td><Tag color="green">지원</Tag></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
