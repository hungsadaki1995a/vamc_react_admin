export type ProjectStatus = 'active' | 'completed' | 'hold';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  manager: string;
  members: string[];
  budget: number;
  category: string;
}

export const mockProjects: Project[] = [
  {
    id: 'P001', name: '차세대 ERP 시스템', description: '전사 ERP 시스템 고도화 프로젝트',
    status: 'active', progress: 65, startDate: '2025-01-15', endDate: '2025-12-31',
    manager: '김영수', members: ['김영수', '이미영', '송태현', '최수진'], budget: 500000000, category: '시스템개발',
  },
  {
    id: 'P002', name: '모바일 앱 리뉴얼', description: '고객용 모바일 앱 UI/UX 개선',
    status: 'active', progress: 40, startDate: '2025-03-01', endDate: '2025-09-30',
    manager: '박정호', members: ['박정호', '한지은', '임재혁'], budget: 200000000, category: 'APP개발',
  },
  {
    id: 'P003', name: 'AI 챗봇 도입', description: '고객 서비스 AI 챗봇 구축',
    status: 'active', progress: 25, startDate: '2025-04-01', endDate: '2025-11-30',
    manager: '정민우', members: ['정민우', '이미영', '오하늘'], budget: 150000000, category: 'AI/ML',
  },
  {
    id: 'P004', name: '데이터 분석 플랫폼', description: '사내 데이터 분석 환경 구축',
    status: 'active', progress: 80, startDate: '2025-01-01', endDate: '2025-06-30',
    manager: '김영수', members: ['김영수', '송태현'], budget: 300000000, category: '인프라',
  },
  {
    id: 'P005', name: '보안 강화 프로젝트', description: '정보보안 체계 고도화',
    status: 'hold', progress: 15, startDate: '2025-05-01', endDate: '2025-12-31',
    manager: '윤서연', members: ['윤서연', '임재혁'], budget: 100000000, category: '보안',
  },
  {
    id: 'P006', name: '홈페이지 개편', description: '회사 홈페이지 전면 개편',
    status: 'completed', progress: 100, startDate: '2024-09-01', endDate: '2025-02-28',
    manager: '한지은', members: ['한지은', '최수진', '오하늘'], budget: 80000000, category: '웹개발',
  },
  {
    id: 'P007', name: 'CRM 시스템 구축', description: '고객관계관리 시스템 구축',
    status: 'completed', progress: 100, startDate: '2024-06-01', endDate: '2025-01-31',
    manager: '박정호', members: ['박정호', '최수진'], budget: 250000000, category: '시스템개발',
  },
  {
    id: 'P008', name: '클라우드 마이그레이션', description: '온프레미스에서 클라우드로 전환',
    status: 'active', progress: 55, startDate: '2025-02-01', endDate: '2025-10-31',
    manager: '임재혁', members: ['임재혁', '송태현', '김영수'], budget: 400000000, category: '인프라',
  },
  {
    id: 'P009', name: 'HR 셀프서비스 포털', description: '임직원 HR 업무 셀프서비스 웹 포털 구축',
    status: 'active', progress: 30, startDate: '2025-04-15', endDate: '2025-11-30',
    manager: '오하늘', members: ['오하늘', '최수진', '한지은'], budget: 120000000, category: '시스템개발',
  },
  {
    id: 'P010', name: '전자결재 시스템 고도화', description: '기존 전자결재 시스템 기능 개선 및 모바일 지원',
    status: 'active', progress: 50, startDate: '2025-03-01', endDate: '2025-08-31',
    manager: '이미영', members: ['이미영', '송태현', '박정호'], budget: 180000000, category: '시스템개발',
  },
  {
    id: 'P011', name: '내부 교육 플랫폼', description: '임직원 온라인 교육 및 학습관리 시스템(LMS) 구축',
    status: 'hold', progress: 10, startDate: '2025-06-01', endDate: '2026-03-31',
    manager: '정민우', members: ['정민우', '오하늘'], budget: 90000000, category: '웹개발',
  },
  {
    id: 'P012', name: 'BI 리포팅 고도화', description: '경영진 대시보드 및 BI 리포트 자동화',
    status: 'active', progress: 70, startDate: '2025-01-20', endDate: '2025-07-31',
    manager: '김영수', members: ['김영수', '이미영'], budget: 160000000, category: 'AI/ML',
  },
  {
    id: 'P013', name: 'DevOps 플랫폼 구축', description: 'GitOps 기반 CI/CD 및 개발 협업 환경 표준화',
    status: 'completed', progress: 100, startDate: '2024-10-01', endDate: '2025-03-31',
    manager: '임재혁', members: ['임재혁', '송태현'], budget: 70000000, category: '인프라',
  },
  {
    id: 'P014', name: '공급망 관리 시스템', description: '협력사 연동 공급망 관리(SCM) 시스템 신규 구축',
    status: 'active', progress: 20, startDate: '2025-05-01', endDate: '2026-04-30',
    manager: '박정호', members: ['박정호', '한지은', '윤서연', '송태현'], budget: 600000000, category: '시스템개발',
  },
  {
    id: 'P015', name: '레거시 시스템 정비', description: '노후 레거시 애플리케이션 점검 및 단계적 폐기',
    status: 'hold', progress: 5, startDate: '2025-07-01', endDate: '2026-06-30',
    manager: '윤서연', members: ['윤서연', '이미영'], budget: 50000000, category: '시스템개발',
  },
];
