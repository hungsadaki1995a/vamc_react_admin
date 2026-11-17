import { useCommonCodes } from '@/hooks/use-common-codes';

/** FAQ categories come from COM_CD group FAQ_CTGRY_CD — never hardcode them. */
export function useFaqCategories() {
  return useCommonCodes('FAQ_CTGRY_CD');
}
