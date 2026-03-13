import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';

export interface User {
  usrId: string;
  usrNm: string;
  cpNm: string;
  email: string;
  dpCd: string;
  dpNm: string;
  jbtCd: string;
  jbcCd: string;
  gdCd: string;
  stdCost: string;
  phnNo: string;
  usrIp: string;
  mrCont: string;
  grpNm: string;
}

/** Form-layer type: dpNm holds a SearchSelectValue for DeptSelectField binding */
export interface UserFormValues extends Omit<User, 'dpNm' | 'dpCd'> {
  dpNm: SearchSelectValue | null;
}
