/** 의존성 타입: FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish */
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

/** 태스크 우선순위 */
export type GanttTaskPriority = 'low' | 'normal' | 'high' | 'critical';

/** 간트 작업 데이터 */
export interface GanttTask {
  id: string;
  name: string;
  start: string;           // YYYY-MM-DD
  end: string;
  progress: number;         // 0~100
  dependencies?: string[];  // 의존 작업 ID 목록
  dependencyTypes?: Record<string, DependencyType>; // depId → type
  milestone?: boolean;
  assignee?: string;
  color?: string;
  description?: string;
  projectName?: string;
  /** WBS 계층 */
  parentId?: string;         // WBS 부모 ID
  level?: number;            // 들여쓰기 깊이 (0=그룹, 1=태스크)
  isGroup?: boolean;         // 그룹 노드 (접기/펼치기 가능)
  /** 추가 표시 옵션 */
  customClass?: string;      // 바(bar)에 추가할 CSS 클래스
  locked?: boolean;          // true → 날짜/진행률 편집 개별 불가 (readOnly=false여도 고정)
  priority?: GanttTaskPriority; // 우선순위 (바 색상/스타일 CSS 클래스로 적용)
}

/** 간트 뷰 모드 */
export type GanttViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';

/** 의존성 연결선 데이터 */
export interface DependencyLine {
  fromId: string;
  toId: string;
  type: DependencyType;
  isCritical: boolean;
}

/** 크리티컬 패스 계산 결과 */
export interface CriticalPathResult {
  criticalTaskIds: Set<string>;
  criticalLines: DependencyLine[];
  taskSchedule: Map<string, {
    ES: number;  // Early Start
    EF: number;  // Early Finish
    LS: number;  // Late Start
    LF: number;  // Late Finish
    totalFloat: number;
  }>;
}
