// ─── Mock data for all API endpoints ────────────────────────────────────────
// Used when VITE_MOCK=true (no backend required)

import type { MeResponse, MyProjectResponseDto } from '@/lib/api/types';
import type { MnuResponse } from '@/api/menu';
import type { CodeDetail } from '@/api/common';

// RSA-2048 SPKI public key (for mock — encryption still runs but server accepts any input)
export const MOCK_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqXWlYVqcGc9+I+lEpc5UppRH169pp5XkqPqzc+eiDDVEKxowLS/+gRP6RTWVYYdkQsdp8EdLcBYflXkbYVQXx5a/8oIiyw0KykLjgmdqUORP2/4cVt0CDnIhY2O906fP8VkKLVT5Nqk10prhXkPS1Bub+Gk4GD9DdAXo+hqp3gW2xGXqPjhZLrmWY6qrcP0KrWH3TjN4n7TVXxbjHY8+znLbGUnqAq2TTdtScI6ZnepCFXYioZrDCchmYHHcUFc4EFtgX48dZdPR+OlQsBN0ivTDYzvww7gm22bFTPDvsAEQT/d1MiUWpWGHvZDjL4BQeZxKDGmVJzi1I+VZsbjYmwIDAQAB';

export const MOCK_ACCESS_TOKEN = 'mock-access-token-dev';
export const MOCK_REFRESH_TOKEN = 'mock-refresh-token-dev';

// Mock credentials: any non-empty username/password works, but these are the "known" ones
export const MOCK_CREDENTIALS = { username: 'admin', password: '1234' };

export const MOCK_ME: MeResponse = {
  usrId: 'admin',
  usrNm: '관리자',
  email: 'admin@shinhan.com',
  dpCd: 'IT001',
  usrCCd: 'USR',
  phnNo: '010-0000-0000',
  roles: ['ADMIN', 'USER'],
};

export const MOCK_PROJECTS: MyProjectResponseDto[] = [
  {
    projId: 'PROJ001',
    projNm: 'DS PMS 구축 프로젝트',
    projType: 'DEV',
    clnNm: '신한DS',
    bzDpNm: 'IT개발팀',
    pmId: 'admin',
    adminId: 'admin',
    pnSrDt: '2025-01-01',
    pnEdDt: '2025-12-31',
    rltSrDt: '2025-01-01',
    rltEdDt: '2025-12-31',
    bigo: '프로젝트 관리 시스템 구축',
    rgDttm: '2025-01-01T00:00:00',
    roles: [
      { roleId: 'PM', roleNm: '프로젝트 관리자' },
    ],
  },
  {
    projId: 'PROJ002',
    projNm: '차세대 뱅킹 시스템',
    projType: 'SI',
    clnNm: '신한은행',
    bzDpNm: '디지털혁신팀',
    pmId: 'user01',
    adminId: 'admin',
    pnSrDt: '2025-03-01',
    pnEdDt: '2026-02-28',
    rltSrDt: '2025-03-15',
    rltEdDt: '2026-03-31',
    bigo: null,
    rgDttm: '2025-03-01T00:00:00',
    roles: [
      { roleId: 'DEV', roleNm: '개발자' },
    ],
  },
];

export const MOCK_MENUS: MnuResponse[] = [
];

export const MOCK_LABELS: Record<string, string> = {
  // Common buttons
  'BUTTON.SEARCH': '조회',
  'BUTTON.SAVE': '저장',
  'BUTTON.DELETE': '삭제',
  'BUTTON.CANCEL': '취소',
  'BUTTON.CONFIRM': '확인',
  'BUTTON.CLOSE': '닫기',
  'BUTTON.ADD': '추가',
  'BUTTON.EDIT': '수정',
  'BUTTON.EXCEL_DOWN': '엑셀 다운로드',
  'BUTTON.EXCEL_UP': '엑셀 업로드',
  // Common messages
  'MESSAGE.CONFIRM.TEXT_DELETE': '삭제하시겠습니까?',
  'MESSAGE.CONFIRM.TEXT_SAVE': '저장하시겠습니까?',
  'MESSAGE.INFO.TEXT_SAVED': '저장되었습니다.',
  'MESSAGE.INFO.TEXT_DELETED': '삭제되었습니다.',
  'MESSAGE.ERROR.TEXT_REQUIRED': '필수 입력 항목입니다.',
};

export const MOCK_CODES: CodeDetail[] = [
  // Project type
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'PROJ_TYPE', cd: 'DEV', cdNm: '개발', sortRank: 1 },
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'PROJ_TYPE', cd: 'SI',  cdNm: 'SI',  sortRank: 2 },
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'PROJ_TYPE', cd: 'SM',  cdNm: 'SM',  sortRank: 3 },
  // User type
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'USR_TYPE', cd: 'USR',  cdNm: '일반사용자', sortRank: 1 },
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'USR_TYPE', cd: 'ADM',  cdNm: '관리자',    sortRank: 2 },
  // Use/Not use
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'USE_YN', cd: 'Y', cdNm: '사용',  sortRank: 1 },
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'USE_YN', cd: 'N', cdNm: '미사용', sortRank: 2 },
  // Task status
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'TASK_STATUS', cd: 'TODO',  cdNm: '대기',  sortRank: 1 },
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'TASK_STATUS', cd: 'DOING', cdNm: '진행',  sortRank: 2 },
  { projId: 'PROJ001', bzLrgCzCd: 'PMS', cdDmnId: 'TASK_STATUS', cd: 'DONE',  cdNm: '완료',  sortRank: 3 },
];
