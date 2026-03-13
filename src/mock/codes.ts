export interface CodeItem {
  id: string;
  groupCode: string;
  groupName: string;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export const mockCodes: CodeItem[] = [
  { id: 'C001', groupCode: 'PROJECT_STATUS', groupName: '프로젝트 상태', code: 'ACTIVE', name: '진행중', description: '현재 진행 중인 프로젝트', sortOrder: 1, active: true },
  { id: 'C002', groupCode: 'PROJECT_STATUS', groupName: '프로젝트 상태', code: 'COMPLETED', name: '완료', description: '완료된 프로젝트', sortOrder: 2, active: true },
  { id: 'C003', groupCode: 'PROJECT_STATUS', groupName: '프로젝트 상태', code: 'HOLD', name: '보류', description: '보류 중인 프로젝트', sortOrder: 3, active: true },
  { id: 'C004', groupCode: 'TASK_STATUS', groupName: '업무 상태', code: 'TODO', name: '할일', description: '시작 전 업무', sortOrder: 1, active: true },
  { id: 'C005', groupCode: 'TASK_STATUS', groupName: '업무 상태', code: 'IN_PROGRESS', name: '진행중', description: '진행 중인 업무', sortOrder: 2, active: true },
  { id: 'C006', groupCode: 'TASK_STATUS', groupName: '업무 상태', code: 'REVIEW', name: '검토', description: '검토 대기 업무', sortOrder: 3, active: true },
  { id: 'C007', groupCode: 'TASK_STATUS', groupName: '업무 상태', code: 'DONE', name: '완료', description: '완료된 업무', sortOrder: 4, active: true },
  { id: 'C008', groupCode: 'PRIORITY', groupName: '우선순위', code: 'HIGH', name: '높음', description: '긴급 우선순위', sortOrder: 1, active: true },
  { id: 'C009', groupCode: 'PRIORITY', groupName: '우선순위', code: 'MEDIUM', name: '보통', description: '일반 우선순위', sortOrder: 2, active: true },
  { id: 'C010', groupCode: 'PRIORITY', groupName: '우선순위', code: 'LOW', name: '낮음', description: '낮은 우선순위', sortOrder: 3, active: true },
  { id: 'C011', groupCode: 'DEPARTMENT', groupName: '부서', code: 'DEV1', name: '개발1팀', description: '', sortOrder: 1, active: true },
  { id: 'C012', groupCode: 'DEPARTMENT', groupName: '부서', code: 'DEV2', name: '개발2팀', description: '', sortOrder: 2, active: true },
  { id: 'C013', groupCode: 'DEPARTMENT', groupName: '부서', code: 'PLAN', name: '기획팀', description: '', sortOrder: 3, active: true },
  { id: 'C014', groupCode: 'DEPARTMENT', groupName: '부서', code: 'DESIGN', name: '디자인팀', description: '', sortOrder: 4, active: true },
  { id: 'C015', groupCode: 'DEPARTMENT', groupName: '부서', code: 'QA', name: 'QA팀', description: '', sortOrder: 5, active: true },
];
