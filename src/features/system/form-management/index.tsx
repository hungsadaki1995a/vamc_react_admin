import { useState } from 'react';
import { Input, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { FORM_API_AVAILABLE } from '@/api/system/form-api';
import type { FormItem, FormLang, FormSearch, YesNo } from '@/api/system/form-api';
import {
  DateTimeText,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysNotAvailable,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '../_shared/SysListUi';
import { ALL, SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '../_shared/sys-constants';
import { usePagedList } from '../_shared/use-paged-list';
import FormModal from './FormModal';
import { useDownloadFormExcel, useForms } from './use-forms';

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
  { title: 'Form No.', dataIndex: 'formNo', key: 'formNo', align: 'center', sorter: true, width: 110 },
  { title: 'Use', dataIndex: 'useYn', key: 'useYn', align: 'center', sorter: true, width: 100, render: (v: YesNo) => <UseBadge value={v} /> },
  { title: 'Language', dataIndex: 'langCd', key: 'langCd', align: 'center', sorter: true, width: 110 },
  { title: 'Form Name', dataIndex: 'formNm', key: 'formNm', sorter: true },
  { title: 'File', dataIndex: 'fileUrl', key: 'fileUrl', sorter: true },
  {
    title: 'Registered Date',
    dataIndex: 'crtDt',
    key: 'crtDt',
    align: 'center',
    sorter: true,
    width: 160,
    render: (v?: string) => <DateTimeText value={v} />,
  },
  {
    title: 'Modified Date',
    dataIndex: 'mdfcnDt',
    key: 'mdfcnDt',
    align: 'center',
    sorter: true,
    width: 160,
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
  const { data, isFetching } = useForms(search, list.pageQuery);
  const excel = useDownloadFormExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  return (
    <SysPage>
      <SysTitleBar
        title="Form Management"
        breadcrumb={['System Operation Management', 'NPL Platform Management', 'Form Management']}
      />
      {!FORM_API_AVAILABLE && (
        <SysNotAvailable>
          The form API is waiting for a schema change (file URL column). The list stays empty and saving is disabled
          until it is deployed.
        </SysNotAvailable>
      )}
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <Select
            value={list.draft.useYn}
            options={USE_YN_FILTER_OPTIONS}
            onChange={(useYn) => list.setDraft({ useYn })}
          />
        </SysFilterItem>
        <SysFilterItem label="Language">
          <Select value={list.draft.langCd} options={LANG_FILTER_OPTIONS} onChange={(langCd) => list.setDraft({ langCd })} />
        </SysFilterItem>
        <SysFilterItem label="Form Name">
          <Input
            value={list.draft.formNm}
            allowClear
            onChange={(e) => list.setDraft({ formNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <SysExcelButton
            onClick={() => excel.mutate(search)}
            loading={excel.isPending}
            disabled={!FORM_API_AVAILABLE}
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
