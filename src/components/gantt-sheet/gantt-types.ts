/** Dependency type: FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish */
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

/** Task priority */
export type GanttTaskPriority = 'low' | 'normal' | 'high' | 'critical';

/** Gantt task data */
export interface GanttTask {
  id: string;
  name: string;
  start: string;           // YYYY-MM-DD
  end: string;
  progress: number;         // 0~100
  dependencies?: string[];  // List of dependency task IDs
  dependencyTypes?: Record<string, DependencyType>; // depId → type
  milestone?: boolean;
  assignee?: string;
  color?: string;
  description?: string;
  projectName?: string;
  /** WBS hierarchy */
  parentId?: string;         // WBS parent ID
  level?: number;            // Indentation depth (0=group, 1=task)
  isGroup?: boolean;         // Group node (collapsible/expandable)
  /** Additional display options */
  customClass?: string;      // Extra CSS class for the bar
  locked?: boolean;          // true → individually disable date/progress editing (locked even if readOnly=false)
  priority?: GanttTaskPriority; // Priority (applied via bar color/style CSS class)
}

/** Gantt view mode */
export type GanttViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';

/** Dependency link data */
export interface DependencyLine {
  fromId: string;
  toId: string;
  type: DependencyType;
  isCritical: boolean;
}

/** Critical path calculation result */
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
