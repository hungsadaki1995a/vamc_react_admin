export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'hold';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  reporter: string;
  startDate: string;
  dueDate: string;
  tags: string[];
}

export const mockTasks: Task[] = [
  { id: 'T001', title: 'DB 스키마 설계', description: 'ERP 핵심 테이블 설계', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'done', priority: 'high', assignee: '이미영', reporter: '김영수', startDate: '2025-01-20', dueDate: '2025-02-15', tags: ['DB', '설계'] },
  { id: 'T002', title: 'API 서버 개발', description: 'REST API 엔드포인트 개발', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'in_progress', priority: 'high', assignee: '송태현', reporter: '김영수', startDate: '2025-02-16', dueDate: '2025-04-30', tags: ['API', '백엔드'] },
  { id: 'T003', title: '프론트엔드 UI 개발', description: '관리자 화면 UI 구현', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'in_progress', priority: 'medium', assignee: '최수진', reporter: '김영수', startDate: '2025-03-01', dueDate: '2025-06-30', tags: ['프론트엔드', 'UI'] },
  { id: 'T004', title: 'UI/UX 디자인', description: '앱 디자인 시안 작성', projectId: 'P002', projectName: '모바일 앱 리뉴얼', status: 'review', priority: 'high', assignee: '한지은', reporter: '박정호', startDate: '2025-03-05', dueDate: '2025-04-15', tags: ['디자인', 'UX'] },
  { id: 'T005', title: '네이티브 모듈 개발', description: 'React Native 커스텀 모듈', projectId: 'P002', projectName: '모바일 앱 리뉴얼', status: 'todo', priority: 'medium', assignee: '임재혁', reporter: '박정호', startDate: '2025-04-16', dueDate: '2025-06-30', tags: ['모바일', 'RN'] },
  { id: 'T006', title: 'NLP 모델 선정', description: '챗봇용 자연어처리 모델 비교분석', projectId: 'P003', projectName: 'AI 챗봇 도입', status: 'in_progress', priority: 'high', assignee: '이미영', reporter: '정민우', startDate: '2025-04-05', dueDate: '2025-05-15', tags: ['AI', 'NLP'] },
  { id: 'T007', title: '학습 데이터 수집', description: '고객 문의 데이터 정제 및 라벨링', projectId: 'P003', projectName: 'AI 챗봇 도입', status: 'todo', priority: 'medium', assignee: '오하늘', reporter: '정민우', startDate: '2025-05-01', dueDate: '2025-06-30', tags: ['데이터', 'AI'] },
  { id: 'T008', title: 'ETL 파이프라인 구축', description: '데이터 수집/변환/적재 자동화', projectId: 'P004', projectName: '데이터 분석 플랫폼', status: 'review', priority: 'high', assignee: '송태현', reporter: '김영수', startDate: '2025-02-01', dueDate: '2025-04-30', tags: ['데이터', 'ETL'] },
  { id: 'T009', title: '대시보드 개발', description: '분석 결과 시각화 대시보드', projectId: 'P004', projectName: '데이터 분석 플랫폼', status: 'in_progress', priority: 'medium', assignee: '김영수', reporter: '김영수', startDate: '2025-04-01', dueDate: '2025-06-15', tags: ['시각화', '프론트엔드'] },
  { id: 'T010', title: '보안 취약점 점검', description: '전체 시스템 보안 취약점 스캔', projectId: 'P005', projectName: '보안 강화 프로젝트', status: 'hold', priority: 'high', assignee: '윤서연', reporter: '윤서연', startDate: '2025-05-15', dueDate: '2025-06-30', tags: ['보안', '점검'] },
  { id: 'T011', title: 'AWS 환경 구성', description: 'VPC, EC2, RDS 등 인프라 셋업', projectId: 'P008', projectName: '클라우드 마이그레이션', status: 'done', priority: 'high', assignee: '임재혁', reporter: '임재혁', startDate: '2025-02-05', dueDate: '2025-03-31', tags: ['클라우드', 'AWS'] },
  { id: 'T012', title: '데이터 마이그레이션', description: '기존 DB를 클라우드 DB로 이관', projectId: 'P008', projectName: '클라우드 마이그레이션', status: 'in_progress', priority: 'high', assignee: '송태현', reporter: '임재혁', startDate: '2025-04-01', dueDate: '2025-07-31', tags: ['데이터', '마이그레이션'] },
  { id: 'T013', title: '통합 테스트', description: 'ERP 전체 모듈 통합 테스트', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'todo', priority: 'high', assignee: '윤서연', reporter: '김영수', startDate: '2025-07-01', dueDate: '2025-09-30', tags: ['QA', '테스트'] },
  { id: 'T014', title: '사용자 매뉴얼 작성', description: 'ERP 시스템 사용자 가이드', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'in_progress', priority: 'low', assignee: '오하늘', reporter: '김영수', startDate: '2025-09-01', dueDate: '2026-03-31', tags: ['문서', '매뉴얼'] },
  { id: 'T015', title: '성능 최적화', description: '모바일 앱 로딩 속도 개선', projectId: 'P002', projectName: '모바일 앱 리뉴얼', status: 'todo', priority: 'medium', assignee: '박정호', reporter: '박정호', startDate: '2025-07-01', dueDate: '2025-08-31', tags: ['성능', '최적화'] },
  { id: 'T016', title: '코드 리뷰 프로세스 수립', description: 'PR 리뷰 가이드라인 및 자동화 도구 설정', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'done', priority: 'low', assignee: '이미영', reporter: '이미영', startDate: '2025-01-10', dueDate: '2025-01-25', tags: ['프로세스', '개발환경'] },
  { id: 'T017', title: '앱 푸시 알림 연동', description: 'FCM 기반 푸시 알림 구현', projectId: 'P002', projectName: '모바일 앱 리뉴얼', status: 'review', priority: 'medium', assignee: '임재혁', reporter: '박정호', startDate: '2025-05-01', dueDate: '2025-06-15', tags: ['모바일', '알림'] },
  { id: 'T018', title: '챗봇 API 연동', description: '외부 챗봇 플랫폼 API 연결', projectId: 'P003', projectName: 'AI 챗봇 도입', status: 'todo', priority: 'high', assignee: '정민우', reporter: '정민우', startDate: '2025-06-01', dueDate: '2025-08-31', tags: ['API', 'AI'] },
  { id: 'T019', title: '실시간 모니터링 구축', description: 'Grafana + Prometheus 모니터링 환경', projectId: 'P008', projectName: '클라우드 마이그레이션', status: 'in_progress', priority: 'medium', assignee: '임재혁', reporter: '임재혁', startDate: '2025-06-01', dueDate: '2025-07-31', tags: ['모니터링', '인프라'] },
  { id: 'T020', title: '접근제어 정책 수립', description: 'IAM 정책 및 보안 그룹 설정', projectId: 'P005', projectName: '보안 강화 프로젝트', status: 'hold', priority: 'high', assignee: '윤서연', reporter: '윤서연', startDate: '2025-05-20', dueDate: '2025-07-31', tags: ['보안', 'IAM'] },
  { id: 'T021', title: 'CI/CD 파이프라인 구성', description: 'GitHub Actions 기반 배포 자동화', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'done', priority: 'high', assignee: '송태현', reporter: '이미영', startDate: '2025-01-05', dueDate: '2025-02-10', tags: ['DevOps', '자동화'] },
  { id: 'T022', title: '다국어(i18n) 적용', description: '한국어/영어 다국어 지원 구현', projectId: 'P002', projectName: '모바일 앱 리뉴얼', status: 'in_progress', priority: 'low', assignee: '최수진', reporter: '박정호', startDate: '2025-06-01', dueDate: '2025-07-31', tags: ['i18n', '프론트엔드'] },
  { id: 'T023', title: '챗봇 UI 개발', description: '채팅 인터페이스 컴포넌트 구현', projectId: 'P003', projectName: 'AI 챗봇 도입', status: 'todo', priority: 'medium', assignee: '한지은', reporter: '정민우', startDate: '2025-07-01', dueDate: '2025-09-30', tags: ['UI', 'AI'] },
  { id: 'T024', title: '분석 리포트 자동화', description: '월간 데이터 분석 리포트 자동 생성', projectId: 'P004', projectName: '데이터 분석 플랫폼', status: 'todo', priority: 'low', assignee: '오하늘', reporter: '김영수', startDate: '2025-07-01', dueDate: '2025-09-30', tags: ['자동화', '리포트'] },
  { id: 'T025', title: '네트워크 구성도 작성', description: 'AWS 아키텍처 다이어그램 문서화', projectId: 'P008', projectName: '클라우드 마이그레이션', status: 'done', priority: 'low', assignee: '임재혁', reporter: '임재혁', startDate: '2025-03-01', dueDate: '2025-03-15', tags: ['문서', '인프라'] },
  { id: 'T026', title: '접근성(a11y) 개선', description: 'WCAG 2.1 기준 접근성 개선', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'todo', priority: 'low', assignee: '최수진', reporter: '이미영', startDate: '2025-10-01', dueDate: '2025-11-30', tags: ['접근성', 'UI'] },
  { id: 'T027', title: '부하 테스트', description: 'JMeter 기반 API 부하 테스트', projectId: 'P001', projectName: '차세대 ERP 시스템', status: 'todo', priority: 'medium', assignee: '윤서연', reporter: '김영수', startDate: '2025-10-01', dueDate: '2025-10-31', tags: ['QA', '성능'] },
  { id: 'T028', title: '앱스토어 배포 준비', description: 'iOS/Android 마켓 등록 및 심사 준비', projectId: 'P002', projectName: '모바일 앱 리뉴얼', status: 'todo', priority: 'high', assignee: '박정호', reporter: '박정호', startDate: '2025-08-01', dueDate: '2025-09-15', tags: ['배포', '모바일'] },
  { id: 'T029', title: '운영 이관 계획 수립', description: '개발→운영 전환 체크리스트 작성', projectId: 'P004', projectName: '데이터 분석 플랫폼', status: 'review', priority: 'medium', assignee: '김영수', reporter: '김영수', startDate: '2025-06-10', dueDate: '2025-06-20', tags: ['운영', '계획'] },
  { id: 'T030', title: 'SSO 연동', description: '사내 SSO 시스템과 연동', projectId: 'P005', projectName: '보안 강화 프로젝트', status: 'hold', priority: 'high', assignee: '윤서연', reporter: '윤서연', startDate: '2025-06-01', dueDate: '2025-10-31', tags: ['보안', 'SSO'] },
];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: '할일',
  in_progress: '진행중',
  review: '검토',
  done: '완료',
  hold: '보류',
};

export const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
  hold: 'error',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const taskPriorityColors: Record<TaskPriority, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};
