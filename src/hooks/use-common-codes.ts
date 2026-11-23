import { useMemo } from 'react';
import { useApiQuery } from '@/hooks/use-api-query';
import { getCommonCodes } from '@/api/common/common-code-api';
import type { CommonCode } from '@/api/common/common-code-api';

export interface CodeSelectOption {
  label: string;
  value: string;
}

/** Stable empty list: a new `[]` per render would change the returned options on every render while loading. */
const NO_CODES: CommonCode[] = [];

/** Select options of one COM_CD group (codes in use, server order). Pass null to skip. */
export function useCommonCodes(groupCd: string | null): CodeSelectOption[] {
  const { data: codes = NO_CODES } = useApiQuery<CommonCode[]>(
    ['common-codes', groupCd],
    () => getCommonCodes(groupCd as string),
    { enabled: groupCd !== null, staleTime: 5 * 60 * 1000 },
  );
  return useMemo(() => codes.map((code) => ({ label: code.cdNm, value: code.cd })), [codes]);
}
