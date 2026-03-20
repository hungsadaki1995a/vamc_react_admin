import { useCallback } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectOption, SearchSelectFieldProps, SearchSelectValue } from '@/components/inputs/SearchSelectField';
import { getSceList } from '@/api/sce';

// ── Modal table columns ────────────────────────────────────────────────────────

const SCE_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: '업무',   dataIndex: 'bzLrgCzCd', key: 'bzLrgCzCd', width: 80,  ellipsis: true },
  { title: '화면명', dataIndex: 'label',     key: 'label',     ellipsis: true },
  { title: '화면ID', dataIndex: 'value',     key: 'value',     width: 150, ellipsis: true },
];

// ── Props ─────────────────────────────────────────────────────────────────────

// value: { label: sceNm, value: sceId } — 앞부분(화면명) / 뒷부분(화면ID)
type SceSelectFieldProps = Pick<
  SearchSelectFieldProps,
  'disabled' | 'style' | 'placeholder' | 'codeWidth'
> & {
  value?: SearchSelectValue | null;
  onChange?: (val: SearchSelectValue | null) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SceSelectField({ value, onChange, ...rest }: SceSelectFieldProps) {
  const fetchOptions = useCallback(async (keyword: string): Promise<SearchSelectOption[]> => {
    const res = await getSceList(keyword ? { sceNm: keyword, popupYn: 'N' } : { popupYn: 'N' });
    return (res.data ?? []).map((sce) => ({
      label:     sce.sceNm,
      value:     sce.sceId,
      bzLrgCzCd: sce.bzLrgCzCd,
    }));
  }, []);

  return (
    <SearchSelectField
      value={value}
      onChange={(val) => onChange?.(Array.isArray(val) ? (val[0] ?? null) : val)}
      fetchOptions={fetchOptions}
      modalTitle="화면 검색"
      modalWidth={600}
      columns={SCE_COLUMNS}
      modalSearchFields={['label', 'value', 'bzLrgCzCd']}
      placeholder={rest.placeholder ?? '화면 선택'}
      {...rest}
    />
  );
}
