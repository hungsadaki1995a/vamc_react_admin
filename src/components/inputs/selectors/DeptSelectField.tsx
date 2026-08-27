import { useCallback, useMemo } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type {
  SearchSelectOption,
  SearchSelectFieldProps,
} from '@/components/inputs/SearchSelectField';
import { getOrgTree, getOrgList } from '@/api/org';
import { useComponentLabel } from '@/hooks/useComponentLabel';

// ── Modal table columns ────────────────────────────────────────────────────────

/** 모달 표 컬럼 — 헤더 문구는 공통 라벨로 채운다(훅은 모듈 최상단에서 못 쓴다) */
function buildColumns(tsg: (field: string, defaultText?: string) => string): ColumnsType<SearchSelectOption> {
  return [
    { title: tsg('orgId', '부서코드'), dataIndex: 'value',   key: 'value',   width: 130, ellipsis: true },
    { title: tsg('orgNm', '부서명'),   dataIndex: 'label',   key: 'label',   ellipsis: true },
    { title: tsg('upOrgNm', '상위부서'), dataIndex: 'upOrgId', key: 'upOrgId', width: 160, ellipsis: true },
  ];
}

// ── Props ─────────────────────────────────────────────────────────────────────

type DeptSelectFieldProps = Pick<
  SearchSelectFieldProps,
  'value' | 'onChange' | 'multiple' | 'disabled' | 'style' | 'placeholder' | 'codeWidth'
>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeptSelectField(props: DeptSelectFieldProps) {
  const { tvt, tsg } = useComponentLabel();
  const columns = useMemo(() => buildColumns(tsg), [tsg]);
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
      modalTitle={tvt('deptSearch', '부서 검색')}
      modalWidth={580}
      columns={columns}
      modalSearchFields={['label', 'value', 'upOrgId']}
      placeholder={props.placeholder ?? tvt('deptSelect', '부서 선택')}
      {...props}
    />
  );
}
