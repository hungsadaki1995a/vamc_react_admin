import { useCallback, useMemo } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectOption, SearchSelectFieldProps, SearchSelectValue } from '@/components/inputs/SearchSelectField';
import { getSceList } from '@/api/sce';
import { useComponentLabel } from '@/hooks/useComponentLabel';

// ── Modal table columns ────────────────────────────────────────────────────────

/** 모달 표 컬럼 — 헤더 문구는 공통 라벨로 채운다(훅은 모듈 최상단에서 못 쓴다) */
function buildColumns(tsg: (field: string, defaultText?: string) => string): ColumnsType<SearchSelectOption> {
  return [
    { title: tsg('bzLrgCzCd', '업무'),   dataIndex: 'bzLrgCzCd', key: 'bzLrgCzCd', width: 80,  ellipsis: true },
    { title: tsg('sceNm', '화면명'), dataIndex: 'label',     key: 'label',     ellipsis: true },
    { title: tsg('sceId', '화면ID'), dataIndex: 'value',     key: 'value',     width: 150, ellipsis: true },
  ];
}

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
  const { tvt, tsg } = useComponentLabel();
  const columns = useMemo(() => buildColumns(tsg), [tsg]);
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
      modalTitle={tvt('sceSearch', '화면 검색')}
      modalWidth={600}
      columns={columns}
      modalSearchFields={['label', 'value', 'bzLrgCzCd']}
      placeholder={rest.placeholder ?? tvt('sceSelect', '화면 선택')}
      {...rest}
    />
  );
}
