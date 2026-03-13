import type { GanttTask, DependencyType, CriticalPathResult, DependencyLine } from './ganttTypes';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * CPM (Critical Path Method) 구현
 *
 * 1. Forward Pass: ES, EF 계산 (가장 이른 시작/종료)
 * 2. Backward Pass: LS, LF 계산 (가장 늦은 시작/종료)
 * 3. Float = LS - ES (여유 시간)
 * 4. Float === 0 → 크리티컬 패스
 */
export function calculateCriticalPath(tasks: GanttTask[]): CriticalPathResult {
  if (tasks.length === 0) {
    return { criticalTaskIds: new Set(), criticalLines: [], taskSchedule: new Map() };
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const duration = new Map<string, number>();
  const schedule = new Map<string, { ES: number; EF: number; LS: number; LF: number; totalFloat: number }>();

  // 작업 기간 (일수) 계산
  for (const task of tasks) {
    const start = new Date(task.start).getTime();
    const end = new Date(task.end).getTime();
    const days = Math.max(1, Math.ceil((end - start) / MS_PER_DAY));
    duration.set(task.id, days);
    schedule.set(task.id, { ES: 0, EF: 0, LS: 0, LF: 0, totalFloat: 0 });
  }

  // 위상 정렬
  const sorted = topologicalSort(tasks);

  // Pre-build successors map to avoid O(n²) lookup in Backward Pass
  const successorsMap = new Map<string, GanttTask[]>();
  for (const task of tasks) {
    if (!task.dependencies) continue;
    for (const depId of task.dependencies) {
      if (!successorsMap.has(depId)) successorsMap.set(depId, []);
      successorsMap.get(depId)!.push(task);
    }
  }

  // Forward Pass
  for (const taskId of sorted) {
    const task = taskMap.get(taskId)!;
    const sched = schedule.get(taskId)!;
    const dur = duration.get(taskId)!;

    let es = 0;
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const depSched = schedule.get(depId);
        if (depSched) {
          const depType = task.dependencyTypes?.[depId] ?? 'FS';
          const depDur = duration.get(depId) ?? 0;
          es = Math.max(es, getConstraint(depSched, depDur, depType));
        }
      }
    }
    sched.ES = es;
    sched.EF = es + dur;
  }

  // 프로젝트 종료일
  let projectEnd = 0;
  for (const [, sched] of schedule) {
    projectEnd = Math.max(projectEnd, sched.EF);
  }

  // Backward Pass
  for (const taskId of [...sorted].reverse()) {
    const sched = schedule.get(taskId)!;
    const dur = duration.get(taskId)!;

    const successors = successorsMap.get(taskId) ?? [];
    if (successors.length === 0) {
      sched.LF = projectEnd;
    } else {
      sched.LF = Infinity;
      for (const succ of successors) {
        const succSched = schedule.get(succ.id);
        if (succSched) {
          sched.LF = Math.min(sched.LF, succSched.LS);
        }
      }
    }
    sched.LS = sched.LF - dur;
    sched.totalFloat = sched.LS - sched.ES;
  }

  // 크리티컬 패스 추출 (float ≈ 0)
  const criticalTaskIds = new Set<string>();
  for (const [taskId, sched] of schedule) {
    if (Math.abs(sched.totalFloat) < 0.001) {
      criticalTaskIds.add(taskId);
    }
  }

  // 의존성 연결선
  const criticalLines: DependencyLine[] = [];
  for (const task of tasks) {
    if (!task.dependencies) continue;
    for (const depId of task.dependencies) {
      if (!taskMap.has(depId)) continue;
      criticalLines.push({
        fromId: depId,
        toId: task.id,
        type: task.dependencyTypes?.[depId] ?? 'FS',
        isCritical: criticalTaskIds.has(depId) && criticalTaskIds.has(task.id),
      });
    }
  }

  return { criticalTaskIds, criticalLines, taskSchedule: schedule };
}

/** Kahn's algorithm for topological sort */
function topologicalSort(tasks: GanttTask[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjacency.set(task.id, []);
  }

  for (const task of tasks) {
    if (!task.dependencies) continue;
    for (const depId of task.dependencies) {
      if (adjacency.has(depId)) {
        adjacency.get(depId)!.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // If not all tasks are in sorted (cycle detected), append remaining
  if (sorted.length < tasks.length) {
    for (const task of tasks) {
      if (!sorted.includes(task.id)) sorted.push(task.id);
    }
  }

  return sorted;
}

/** FS/SS/FF/SF 의존성에 따른 제약 시점 계산 */
function getConstraint(
  depSched: { ES: number; EF: number },
  depDur: number,
  type: DependencyType,
): number {
  switch (type) {
    case 'FS': return depSched.EF;          // 선행 완료 후 시작
    case 'SS': return depSched.ES;          // 선행 시작과 동시 시작
    case 'FF': return depSched.EF - depDur; // 선행 완료와 동시 완료
    case 'SF': return depSched.ES - depDur; // 선행 시작과 동시 완료
    default: return depSched.EF;
  }
}

