import { useMemo } from 'react';
import { useApiQuery } from '@/hooks/use-api-query';
import { getCommonCodes } from '@/api/common/common-code-api';
import type { CommonCode } from '@/api/common/common-code-api';

export interface CodeSelectOption {
  label: string;
  value: string;
}

/** Select options of one COM_CD group (codes in use, server order). Pass null to skip. */
export function useCommonCodes(groupCd: string | null): CodeSelectOption[] {
  const { data: codes = [] } = useApiQuery<CommonCode[]>(
    ['common-codes', groupCd],
    () => getCommonCodes(groupCd as string),
    { enabled: groupCd !== null, staleTime: 5 * 60 * 1000 },
  );
  return useMemo(() => codes.map((code) => ({ label: code.cdNm, value: code.cd })), [codes]);
}
