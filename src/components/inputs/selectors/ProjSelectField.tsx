import { useCallback } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type {
  SearchSelectOption,
  SearchSelectFieldProps,
  SearchSelectValue,
} from '@/components/inputs/SearchSelectField';
import { getMyProjects } from '@/api/project';

// ── Modal table columns ────────────────────────────────────────────────────────

const PROJ_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: '프로젝트ID', dataIndex: 'value',   key: 'value',   width: 130, ellipsis: true },
  { title: '프로젝트명', dataIndex: 'label',   key: 'label',   ellipsis: true },
  { title: '고객사',     dataIndex: 'clnNm',   key: 'clnNm',   width: 120, ellipsis: true },
  { title: '업무부서',   dataIndex: 'bzDpNm',  key: 'bzDpNm',  width: 120, ellipsis: true },
];

// ── Props ─────────────────────────────────────────────────────────────────────

// value: { label: projNm, value: projId }
type ProjSelectFieldProps = Pick<
  SearchSelectFieldProps,
  'multiple' | 'disabled' | 'style' | 'placeholder' | 'codeWidth'
> & {
  value?: SearchSelectValue | SearchSelectValue[] | null;
  onChange?: (val: SearchSelectValue | SearchSelectValue[] | null) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjSelectField({ value, onChange, ...rest }: ProjSelectFieldProps) {
  const fetchOptions = useCallback(async (keyword: string): Promise<SearchSelectOption[]> => {
    const res = await getMyProjects();
    const list = res.data ?? [];
    const filtered = keyword
      ? list.filter(
          (p) =>
            p.projNm?.toLowerCase().includes(keyword.toLowerCase()) ||
            p.projId.toLowerCase().includes(keyword.toLowerCase()),
        )
      : list;

    return filtered.map((p) => ({
      label:   p.projNm ?? p.projId,
      value:   p.projId,
      clnNm:   p.clnNm  ?? '',
      bzDpNm:  p.bzDpNm ?? '',
    }));
  }, []);

  return (
    <SearchSelectField
      value={value}
      onChange={onChange}
      fetchOptions={fetchOptions}
      modalTitle="프로젝트 검색"
      modalWidth={680}
      columns={PROJ_COLUMNS}
      modalSearchFields={['label', 'value', 'clnNm', 'bzDpNm']}
      placeholder={rest.placeholder ?? '프로젝트 선택'}
      {...rest}
    />
  );
}
