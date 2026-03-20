import { useCallback } from 'react';
import type { ColumnsType } from 'antd/es/table';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectOption, SearchSelectFieldProps } from '@/components/inputs/SearchSelectField';
import { getUsrSimpleList } from '@/api/usr';

// ── Modal table columns ────────────────────────────────────────────────────────

const USR_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: '사용자ID', dataIndex: 'value', key: 'value', width: 130, ellipsis: true },
  { title: '이름',     dataIndex: 'label', key: 'label', ellipsis: true },
  { title: '부서',     dataIndex: 'dpNm',  key: 'dpNm',  minWidth: 140, ellipsis: true },
];

// ── Props ─────────────────────────────────────────────────────────────────────

type UsrSelectFieldProps = Pick<
  SearchSelectFieldProps,
  'value' | 'onChange' | 'multiple' | 'disabled' | 'style' | 'placeholder' | 'codeWidth'
>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsrSelectField(props: UsrSelectFieldProps) {
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
      modalTitle="사용자 검색"
      modalWidth={520}
      columns={USR_COLUMNS}
      modalSearchFields={['label', 'value', 'dpNm']}
      placeholder={props.placeholder ?? '사용자 선택'}
      {...props}
    />
  );
}
