import type { MyProjectResponseDto } from '@/lib/api/types';

export async function mockLoadProjects(): Promise<MyProjectResponseDto[]> {
  return [
    {
      projId: 'PJ001',
      projNm: '샘플 프로젝트',
      projType: 'DEV',
      clnNm: null,
      bzDpNm: null,
      pmId: 'admin',
      adminId: 'admin',
      pnSrDt: null,
      pnEdDt: null,
      rltSrDt: null,
      rltEdDt: null,
      bigo: null,
      rgDttm: '',
      roles: [],
    },
  ];
}
