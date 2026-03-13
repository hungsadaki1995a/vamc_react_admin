import type { ApiResponse } from '@/lib/api/types';
import type { User } from '@/features/cco/CCO101001SC/types';

const MOCK_USR_LIST: User[] = [
  { usrId: 'admin',  usrNm: '관리자', cpNm: '', email: 'admin@mock.local', dpCd: 'DEPT001', dpNm: '개발1팀', jbtCd: '', jbcCd: '', gdCd: '', stdCost: '0', phnNo: '', usrIp: '', mrCont: '', grpNm: '' },
  { usrId: 'user01', usrNm: '김영수',  cpNm: '', email: 'kim@mock.local',   dpCd: 'DEPT001', dpNm: '개발1팀', jbtCd: '', jbcCd: '', gdCd: '', stdCost: '0', phnNo: '', usrIp: '', mrCont: '', grpNm: '' },
  { usrId: 'user02', usrNm: '이미영',  cpNm: '', email: 'lee@mock.local',   dpCd: 'DEPT002', dpNm: '개발2팀', jbtCd: '', jbcCd: '', gdCd: '', stdCost: '0', phnNo: '', usrIp: '', mrCont: '', grpNm: '' },
];

export async function mockGetUsrList(
  params: { usrId?: string; usrNm?: string },
): Promise<ApiResponse<User[]>> {
  let list = MOCK_USR_LIST;
  if (params.usrId) list = list.filter((u) => u.usrId.includes(params.usrId!));
  if (params.usrNm) list = list.filter((u) => u.usrNm.includes(params.usrNm!));
  return { success: true, message: 'success', data: list };
}

export async function mockSaveUsr(_req: User): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockDeleteUsr(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockResetPwdErrCnt(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockResetPwd(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockUnlockUsr(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}
