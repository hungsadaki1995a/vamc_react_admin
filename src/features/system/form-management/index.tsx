import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { FormItem, FormLang, FormSearch, YesNo } from '@/api/system/form-api';
import {
  DateTimeText,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '@/components/common/sys-ui/SysListUi';
import { ALL, SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import FormModal from './FormModal';
import { useDownloadFormExcel, useForms } from './use-forms';
import styles from './form-management.module.scss';

// Form Management - List (VPA09010201).

interface FormFilter {
  useYn: YesNo | '';
  langCd: FormLang | '';
  formNm: string;
}

const LANG_FILTER_OPTIONS: { value: FormLang | ''; label: string }[] = [
  { value: ALL, label: 'All' },
  { value: 'VN', label: 'VN' },
  { value: 'EN', label: 'EN' },
];

const columns: TableColumnsType<FormItem> = [
  { title: 'Form No.', dataIndex: 'formNo', key: 'formNo', align: 'center', sorter: true, width: 100 },
  { title: 'Use', dataIndex: 'useYn', key: 'useYn', align: 'center', sorter: true, width: 90, render: (v: YesNo) => <UseBadge value={v} /> },
  { title: 'Language', dataIndex: 'langCd', key: 'langCd', align: 'center', sorter: true, width: 110 },
  // Form Name and File share the rest of the width equally (fixed layout), long values are ellipsized.
  { title: 'Form Name', dataIndex: 'formNm', key: 'formNm', sorter: true, ellipsis: true },
  { title: 'File', dataIndex: 'fileUrl', key: 'fileUrl', sorter: true, ellipsis: true, render: (v?: string | null) => v || '-' },
  {
    title: 'Registered Date',
    dataIndex: 'crtDt',
    key: 'crtDt',
    align: 'center',
    sorter: true,
    width: 150,
    render: (v?: string) => <DateTimeText value={v} />,
  },
  {
    title: 'Modified Date',
    dataIndex: 'mdfcnDt',
    key: 'mdfcnDt',
    align: 'center',
    sorter: true,
    width: 150,
    render: (v?: string) => <DateTimeText value={v} />,
  },
];

function toSearch(filter: FormFilter): FormSearch {
  return { useYn: filter.useYn, langCd: filter.langCd, formNm: filter.formNm.trim() };
}

/** Popup state: closed, register (null) or edit (row). */
type ModalState = { form: FormItem | null } | null;

export default function FormManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<FormFilter>({ useYn: ALL, langCd: ALL, formNm: '' });
  const search = toSearch(list.applied);
  const { data, isFetching, refetch } = useForms(search, list.pageQuery);
  const excel = useDownloadFormExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  return (
    <SysPage>
      <SysTitleBar
        title="Form Management"
        breadcrumb={['System Operation Management', 'NPL Platform Management', 'Form Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <AppSelect
            value={list.draft.useYn}
            options={USE_YN_FILTER_OPTIONS}
            onChange={(useYn) => list.setDraft({ useYn: String(useYn ?? '') as YesNo | '' })}
          />
        </SysFilterItem>
        <SysFilterItem label="Language">
          <AppSelect
            value={list.draft.langCd}
            options={LANG_FILTER_OPTIONS}
            onChange={(langCd) => list.setDraft({ langCd: String(langCd ?? '') as FormLang | '' })}
          />
        </SysFilterItem>
        <SysFilterItem label="Form Name">
          <TextInput
            value={list.draft.formNm}
            allowClear
            onChange={(e) => list.setDraft({ formNm: e.target.value })}
            onPressEnter={() => { if (!list.search()) void refetch(); }}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={() => { if (!list.reset()) void refetch(); }} onSearch={() => { if (!list.search()) void refetch(); }} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <SysExcelButton
            onClick={() =>
              excel.mutate({ search, sort: { sortBy: list.pageQuery.sortBy, sortDirection: list.pageQuery.sortDirection } })
            }
            loading={excel.isPending}
          />
        }
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModal({ form: null })}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<FormItem>
        rowKey="formNo"
        className={styles.listTable}
        fill
        tableLayout="fixed"
        scroll={{ x: 1000 }}
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(form) => setModal({ form })}
        sort={list.sort}
        onSortChange={list.setSort}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && (
        <FormModal
          key={modal.form?.formNo ?? 'new'}
          form={modal.form}
          canWrite={canWrite}
          onClose={() => setModal(null)}
        />
      )}
    </SysPage>
  );
}
