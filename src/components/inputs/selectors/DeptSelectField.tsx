import { useCallback } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type {
  SearchSelectOption,
  SearchSelectFieldProps,
} from '@/components/inputs/SearchSelectField';
import { getOrgTree, getOrgList } from '@/api/org';

// ── Modal table columns ────────────────────────────────────────────────────────

const DEPT_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: '부서코드', dataIndex: 'value',   key: 'value',   width: 130, ellipsis: true },
  { title: '부서명',   dataIndex: 'label',   key: 'label',   ellipsis: true },
  { title: '상위부서', dataIndex: 'upOrgId', key: 'upOrgId', width: 160, ellipsis: true },
];

// ── Props ─────────────────────────────────────────────────────────────────────

type DeptSelectFieldProps = Pick<
  SearchSelectFieldProps,
  'value' | 'onChange' | 'multiple' | 'disabled' | 'style' | 'placeholder' | 'codeWidth'
>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeptSelectField(props: DeptSelectFieldProps) {
  const fetchOptions = useCallback(async (keyword: string): Promise<SearchSelectOption[]> => {
    // Empty keyword (modal open) → full tree with indentation to show hierarchy
    // Keyword provided (autocomplete typing) → flat search by orgNm
    const list = keyword
      ? await getOrgList({ orgNm: keyword })
      : await getOrgTree();

    return list.map((org) => ({
      label:   keyword ? org.orgNm : org.displayNm,
      value:   org.orgId,
      upOrgId: org.upOrgId,
    }));
  }, []);

  return (
    <SearchSelectField
      fetchOptions={fetchOptions}
      modalTitle="부서 검색"
      modalWidth={580}
      columns={DEPT_COLUMNS}
      modalSearchFields={['label', 'value', 'upOrgId']}
      placeholder={props.placeholder ?? '부서 선택'}
      {...props}
    />
  );
}
