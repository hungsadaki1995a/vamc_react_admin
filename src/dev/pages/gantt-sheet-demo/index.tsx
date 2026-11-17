import { useState, useCallback, useMemo, useRef } from 'react';
import { Tabs, Card, Select, Switch, InputNumber, Alert, Tag, Button, Statistic, Row, Col } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { GanttSheet } from '@/components/gantt-sheet';
import type { GanttTask, GanttViewMode } from '@/components/gantt-sheet';
import CodeSnippet from '@/components/common/CodeSnippet';
import styles from './index.module.css';
import DevPageHeader from '@/dev/DevPageHeader';

/* ─── Sample data (for the basic demo) ─── */
const sampleTasks: GanttTask[] = [
  { id: 'G1', name: 'Phase 1: planning & analysis', start: '2025-01-02', end: '2025-01-17', progress: 100, isGroup: true },
  { id: 'T1', name: 'Requirements analysis', start: '2025-01-02', end: '2025-01-10', progress: 100, assignee: 'John Doe', dependencies: [], parentId: 'G1', level: 1 },
  { id: 'T2', name: 'System design', start: '2025-01-13', end: '2025-01-17', progress: 100, assignee: 'Michael Chen', dependencies: ['T1'], parentId: 'G1', level: 1 },
  { id: 'G2', name: 'Phase 2: development', start: '2025-01-20', end: '2025-03-07', progress: 55, isGroup: true },
  { id: 'T3', name: 'Front-end development', start: '2025-01-20', end: '2025-02-21', progress: 60, assignee: 'Emily Park', dependencies: ['T2'], parentId: 'G2', level: 1 },
  { id: 'T4', name: 'Backend API development', start: '2025-01-20', end: '2025-02-14', progress: 75, assignee: 'David Kim', dependencies: ['T2'], parentId: 'G2', level: 1 },
  { id: 'T5', name: 'Integration testing', start: '2025-02-24', end: '2025-03-07', progress: 20, assignee: 'Sarah Lee', dependencies: ['T3', 'T4'], parentId: 'G2', level: 1 },
  { id: 'G3', name: 'Phase 3: deployment', start: '2025-03-10', end: '2025-03-21', progress: 0, isGroup: true },
  { id: 'T6', name: 'Staging deployment', start: '2025-03-10', end: '2025-03-14', progress: 0, assignee: 'John Doe', dependencies: ['T5'], parentId: 'G3', level: 1, priority: 'high' },
  { id: 'T7', name: 'Production deployment', start: '2025-03-17', end: '2025-03-21', progress: 0, assignee: 'John Doe', dependencies: ['T6'], parentId: 'G3', level: 1, priority: 'critical', milestone: false },
];

/* ─── Large task generator (for the performance test) ─── */
const ASSIGNEES = ['John Doe', 'Michael Chen', 'Emily Park', 'David Kim', 'Sarah Lee', 'Eugene Jung', 'Minho Kang', 'Laura Yoon'];
const PRIORITIES: GanttTask['priority'][] = ['low', 'normal', 'normal', 'high', 'critical'];
const PHASE_NAMES = ['Analysis', 'Design', 'Development', 'Testing', 'Deployment'];

/** 2 levels: group -> task */
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
      name: `Project ${g + 1}`,
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
        name: `Task ${g + 1}-${t + 1}`,
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

/** 3 levels: project (0) -> phase (1) -> task (2) */
function generateTreeTasks(count: number): GanttTask[] {
  const tasks: GanttTask[] = [];
  const tasksPerPhase = 4;            // tasks per phase
  const phasesPerProject = 3;         // phases per project
  // rows per project = 1(top) + 3(phases) + 12(tasks) = 16
  const rowsPerProject = 1 + phasesPerProject + phasesPerProject * tasksPerPhase;
  const projectCount = Math.ceil(count / rowsPerProject);
  const phaseDays = tasksPerPhase * 3; // length of one phase in days

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
      name: `Project ${p + 1}`,
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

        // First task: depends on the last task of the previous phase
        const prevDep = t === 0 && s > 0 ? [`PT${p}_${s - 1}_${tasksPerPhase - 1}`] : t > 0 ? [`PT${p}_${s}_${t - 1}`] : [];

        tasks.push({
          id: tId,
          name: `Task ${p + 1}-${s + 1}-${t + 1}`,
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

<GanttSheet
  tasks={tasks}
  viewMode="Week"
  showCriticalPath={false}
  showGrid={true}
  showProgress={true}
  barHeight={28}
  height="100%"
/>`;

const perfCode = `// 60fps scrolling even past 5,000 rows
// Built on @tanstack/react-virtual — only visible rows exist in the DOM

<GanttSheet
  tasks={largeTaskList}   // 5000+ GanttTask[]
  viewMode="Month"
  rowBuffer={5}           // overscan rows (default: 5)
  columnWidth={80}        // override the per-view-mode column width in px
  height={600}
/>`;

const dragCode = `// Drag-to-edit bars — built on pointer capture
// Enabled when readOnly=false (the default)

<GanttSheet
  tasks={tasks}
  onDateChange={(task, start, end) => {
    // Callback fired with the new dates once the drag ends
    updateTask(task.id, { start, end });
  }}
  onProgressChange={(task, progress) => {
    updateTask(task.id, { progress });
  }}
/>

// Lock an individual task against editing
const tasks = [
  { ...task, locked: true },  // only this task cannot be dragged
];`;

/* ─── Props table ─── */
const sheetProps = [
  { name: 'tasks', type: 'GanttTask[]', required: true, default: '—', desc: 'The task list (virtualized past 5,000 rows)' },
  { name: 'viewMode', type: "'Quarter Day'|'Half Day'|'Day'|'Week'|'Month'", required: false, default: "'Week'", desc: 'Timeline unit' },
  { name: 'readOnly', type: 'boolean', required: false, default: 'false', desc: 'Disables drag editing' },
  { name: 'showCriticalPath', type: 'boolean', required: false, default: 'false', desc: 'Highlights the critical path' },
  { name: 'showGrid', type: 'boolean', required: false, default: 'true', desc: 'Grid panel on the left' },
  { name: 'gridWidth', type: 'number', required: false, default: '400', desc: 'Initial grid width in px' },
  { name: 'collapsedGroups', type: 'Set<string>', required: false, default: 'undefined', desc: 'IDs of collapsed groups (controlled). If omitted, state is managed internally' },
  { name: 'onToggleGroup', type: '(groupId: string) => void', required: false, default: '—', desc: 'Group collapse / expand callback' },
  { name: 'height', type: 'string | number', required: false, default: "'100%'", desc: 'Component height' },
  { name: 'loading', type: 'boolean', required: false, default: 'false', desc: 'Loading overlay' },
  { name: 'showProgress', type: 'boolean', required: false, default: 'true', desc: 'Shows the progress bar' },
  { name: 'todayButton', type: 'boolean', required: false, default: 'true', desc: 'Jump-to-today button' },
  { name: 'barHeight', type: 'number', required: false, default: '28', desc: 'Bar height in px' },
  { name: 'barCornerRadius', type: 'number', required: false, default: '4', desc: 'Bar corner radius' },
  { name: 'rowPadding', type: 'number', required: false, default: '16', desc: 'Row padding. rowHeight = barHeight + rowPadding' },
  { name: 'rowBuffer', type: 'number', required: false, default: '5', desc: 'Virtualization overscan rows (GanttSheet only)' },
  { name: 'columnWidth', type: 'number', required: false, default: 'per view mode', desc: 'Overrides the column width in px (GanttSheet only)' },
  { name: 'scrollToTodayRef', type: 'MutableRefObject<(() => void) | null>', required: false, default: '—', desc: 'Exposes the scroll-to-today function to the caller' },
];

const sheetEvents = [
  { name: 'onTaskClick', type: '(task: GanttTask) => void', desc: 'Task bar clicked' },
  { name: 'onTaskDoubleClick', type: '(task: GanttTask) => void', desc: 'Task bar double-clicked' },
  { name: 'onTaskContextMenu', type: '(task: GanttTask, e: MouseEvent) => void', desc: 'Task bar right-clicked' },
  { name: 'onTaskHover', type: '(task: GanttTask | null) => void', desc: 'Hover enter (task) / leave (null)' },
  { name: 'onTaskSelect', type: '(task: GanttTask | null) => void', desc: 'Selection changed' },
  { name: 'onGanttReady', type: '() => void', desc: 'Initial render finished' },
  { name: 'onDateChange', type: '(task: GanttTask, start: Date, end: Date) => void', desc: 'Dates changed by dragging a bar (readOnly=false)' },
  { name: 'onProgressChange', type: '(task: GanttTask, progress: number) => void', desc: 'Progress changed by dragging (readOnly=false)' },
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
      <DevPageHeader page="GanttSheetDemo" />

      <Tabs
        defaultActiveKey="demo"
        items={[
          /* ── Live demo ── */
          {
            key: 'demo',
            label: 'Live demo',
            children: (
              <Card size="small">
                <div className={styles.controlBar}>
                  <div className={styles.controlItem}>
                    <span>View mode</span>
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
                    <span>Critical path</span>
                    <Switch size="small" checked={showCriticalPath} onChange={setShowCriticalPath} />
                  </div>
                  <div className={styles.controlItem}>
                    <span>Left grid</span>
                    <Switch size="small" checked={showGrid} onChange={setShowGrid} />
                  </div>
                  <div className={styles.controlItem}>
                    <span>Progress bar</span>
                    <Switch size="small" checked={showProgress} onChange={setShowProgress} />
                  </div>
                  <div className={styles.controlItem}>
                    <span>Bar height</span>
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

          /* ── Performance test ── */
          {
            key: 'perf',
            label: (
              <span>
                <ThunderboltOutlined /> Performance test
              </span>
            ),
            children: (
              <Card size="small">
                <Alert
                  type="info"
                  showIcon
                  title="Virtualized with @tanstack/react-virtual — no matter the row count, only about 30 rows exist in the DOM."
                  style={{ marginBottom: 16 }}
                />
                <div className={styles.controlBar} style={{ marginBottom: 16 }}>
                  <div className={styles.controlItem}>
                    <span>Rows</span>
                    <Select
                      value={rowCount}
                      onChange={setRowCount}
                      style={{ width: 120 }}
                      options={[
                        { label: '500 rows', value: 500 },
                        { label: '1,000 rows', value: 1000 },
                        { label: '2,000 rows', value: 2000 },
                        { label: '5,000 rows', value: 5000 },
                      ]}
                    />
                  </div>
                  <div className={styles.controlItem}>
                    <span>Tree structure</span>
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
                      {treeMode ? 'project → phase → task (3 levels)' : 'group → task (2 levels)'} · ~30 rows in the DOM
                    </span>
                  </div>
                  <Button
                    size="small"
                    onClick={() => scrollToTodayRef.current?.()}
                  >
                    Jump to today
                  </Button>
                </div>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Total tasks"
                        value={perfTasks.length}
                        suffix="rows"
                        styles={{ content: { color: '#1677ff' } }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="DOM nodes (rows)"
                        value="~30"
                        suffix=""
                        styles={{ content: { color: '#52c41a' } }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Memory saved"
                        value={Math.round((1 - 30 / perfTasks.length) * 100)}
                        suffix="%"
                        styles={{ content: { color: '#fa8c16' } }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Scroll target"
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

          /* ── Drag editing ── */
          {
            key: 'drag',
            label: 'Drag editing',
            children: (
              <Card size="small">
                <Alert
                  type="info"
                  showIcon
                  title="Drag a bar to move it, use the side handles to change dates, and the progress handle to change progress. Every change is written to the log below."
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
                    onTaskSelect={(t) => addLog(`select: ${t ? `"${t.name}"` : '(cleared)'}`)}
                    onTaskContextMenu={(t) => addLog(`contextMenu: "${t.name}"`)}
                    onToggleGroup={(gId) => {
                      const g = dragTasks.find((t) => t.id === gId);
                      addLog(`toggleGroup: "${g?.name ?? gId}"`);
                    }}
                    onDateChange={handleDragDateChange}
                    onProgressChange={handleDragProgressChange}
                  />
                </div>
                <Card size="small" title="Event log" style={{ marginTop: 8 }}>
                  <div className={styles.eventLog}>
                    {eventLog.length === 0 ? (
                      <span className={styles.eventLogEmpty}>Try dragging a bar</span>
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
                      <strong>This is the only Gantt component in the project.</strong> No external library is used.
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
                        <th>Type</th>
                        <th style={{ width: 120 }}>Default</th>
                        <th>Description</th>
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
                        <th style={{ width: 200 }}>Event</th>
                        <th>Signature</th>
                        <th>Description</th>
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

                {/* Why it is built in-house */}
                <div className={styles.propsSection}>
                  <h3>Why no external library</h3>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    title={
                      <span>
                        On 2026-09-11 the <code>frappe-gantt</code> wrapper (<code>GanttView</code>) was removed and
                        everything consolidated into this component. The Gantt has <strong>zero</strong> external dependencies —
                        read the table below before adding a new Gantt library.
                      </span>
                    }
                  />
                  <table className={styles.propsTable}>
                    <thead>
                      <tr>
                        <th>Aspect</th>
                        <th>GanttSheet</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Rendering</td>
                        <td>react-virtual + DOM bars (visible rows only)</td>
                      </tr>
                      <tr>
                        <td>Recommended row count</td>
                        <td><Tag color="green">5,000+ rows</Tag></td>
                      </tr>
                      <tr>
                        <td>Drag-to-edit bars</td>
                        <td><Tag color="green">Supported (pointer capture)</Tag></td>
                      </tr>
                      <tr>
                        <td>Dependency arrows</td>
                        <td><Tag color="blue">Only the visible range is rendered (a performance optimization)</Tag></td>
                      </tr>
                      <tr>
                        <td>Critical path</td>
                        <td><Tag color="green">Supported</Tag> — implemented in-house in <code>criticalPath.ts</code></td>
                      </tr>
                      <tr>
                        <td>Date header</td>
                        <td>Built in-house (Month / Week / Day / Half Day / Quarter Day)</td>
                      </tr>
                      <tr>
                        <td>Dark mode</td>
                        <td><Tag color="green">Supported</Tag></td>
                      </tr>
                      <tr>
                        <td>External dependencies</td>
                        <td><Tag color="green">None</Tag> — only <code>@tanstack/react-virtual</code></td>
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
