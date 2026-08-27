import { useCallback, useMemo } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectOption, SearchSelectFieldProps } from '@/components/inputs/SearchSelectField';
import { getUsrSimpleList } from '@/api/usr';
import { useComponentLabel } from '@/hooks/useComponentLabel';

// ── Modal table columns ────────────────────────────────────────────────────────

/** 모달 표 컬럼 — 헤더 문구는 공통 라벨로 채운다(훅은 모듈 최상단에서 못 쓴다) */
function buildColumns(tsg: (field: string, defaultText?: string) => string): ColumnsType<SearchSelectOption> {
  return [
    { title: tsg('usrId', '사용자ID'), dataIndex: 'value', key: 'value', width: 130, ellipsis: true },
    { title: tsg('usrNm', '이름'),     dataIndex: 'label', key: 'label', ellipsis: true },
    { title: tsg('dpNm', '부서'),     dataIndex: 'dpNm',  key: 'dpNm',  minWidth: 140, ellipsis: true },
  ];
}

// ── Props ─────────────────────────────────────────────────────────────────────

type UsrSelectFieldProps = Pick<
  SearchSelectFieldProps,
  'value' | 'onChange' | 'multiple' | 'disabled' | 'style' | 'placeholder' | 'codeWidth'
>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsrSelectField(props: UsrSelectFieldProps) {
  const { tvt, tsg } = useComponentLabel();
  const columns = useMemo(() => buildColumns(tsg), [tsg]);
  const fetchOptions = useCallback(async (keyword: string): Promise<SearchSelectOption[]> => {
    const res = await getUsrSimpleList(keyword ? { usrNm: keyword } : {});
    return (res.data ?? []).map((usr) => ({
      label: usr.usrNm,
      value: usr.usrId,
      dpNm:  usr.dpNm ?? '',
    }));
  }, []);

  return (
    <SearchSelectField
      fetchOptions={fetchOptions}
      modalTitle={tvt('usrSearch', '사용자 검색')}
      modalWidth={520}
      columns={columns}
      modalSearchFields={['label', 'value', 'dpNm']}
      placeholder={props.placeholder ?? tvt('usrSelect', '사용자 선택')}
      {...props}
    />
  );
}
