import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { SiteDisplaySearch } from '@/api/contents/site-display-api';
import type { Post } from '@/api/contents/post-api';
import {
  DateTimeText,
  SysButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '@/features/system/_shared/SysListUi';
import {
  ALL,
  API_DATE_DMY,
  SYS_DATE_FORMAT,
  SYS_PAGE_SIZE,
  USE_YN_FILTER_OPTIONS,
} from '@/features/system/_shared/sys-constants';
import type { YesNo } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import SloganModal from './SloganModal';
import { useSlogans } from './use-slogans';
import styles from './slogan-management.module.scss';

// Slogan Management - List (VPA07060301), menu A07060300.
// The design is a single "Slogan (VN) / (EN)" form; the server keeps several slogans per position (MAIN_HERO…),
// so the screen stays a list + popup drawn with the v0.8 components.

type Period = [Dayjs | null, Dayjs | null] | null;

interface SloganFilter {
  useYn: YesNo | '';
  tag: string;
  keyword: string;
  period: Period;
}

const INITIAL_FILTER: SloganFilter = { useYn: ALL, tag: '', keyword: '', period: null };

function toSearch(filter: SloganFilter): SiteDisplaySearch {
  return {
    published: filter.useYn || undefined,
    tag: filter.tag.trim() || undefined,
    keyword: filter.keyword.trim() || undefined,
    fromDate: filter.period?.[0]?.format(API_DATE_DMY),
    toDate: filter.period?.[1]?.format(API_DATE_DMY),
  };
}

const columns: TableColumnsType<Post> = [
  { title: 'Use', dataIndex: 'published', key: 'published', width: 100, align: 'center', render: (v: YesNo) => <UseBadge value={v} /> },
  { title: 'Position', dataIndex: 'tag', key: 'tag', width: 150, align: 'center', render: (v?: string) => v || '-' },
  { title: 'Slogan', dataIndex: 'title', key: 'title', ellipsis: true },
  {
    title: 'Registered Date',
    dataIndex: 'crtDt',
    key: 'crtDt',
    width: 150,
    align: 'center',
    render: (v?: string) => <DateTimeText value={v} />,
  },
  {
    title: 'Modified Date',
    dataIndex: 'mdfcnDt',
    key: 'mdfcnDt',
    width: 150,
    align: 'center',
    render: (v?: string) => <DateTimeText value={v} />,
  },
  {
    title: 'Modified By',
    dataIndex: 'mdfcnBy',
    key: 'mdfcnBy',
    width: 130,
    render: (v: string | undefined, row) => v || row.crtBy || '-',
  },
];

/** Popup state: closed, register (null) or edit (slogan id). */
type ModalState = { sloganId: string | null } | null;

export default function SloganManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<SloganFilter>(INITIAL_FILTER);
  const { data, isFetching, error } = useSlogans(toSearch(list.applied), list.page, SYS_PAGE_SIZE);
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  return (
    <SysPage>
      <SysTitleBar title="Slogan Management" breadcrumb={['Content Management', 'Site Display Management', 'Slogan Management']} />
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <AppSelect
            value={list.draft.useYn}
            options={USE_YN_FILTER_OPTIONS}
            onChange={(useYn) => list.setDraft({ useYn: String(useYn ?? '') as YesNo | '' })}
          />
        </SysFilterItem>
        <SysFilterItem label="Position">
          <TextInput
            value={list.draft.tag}
            placeholder="MAIN_HERO, FOOTER…"
            allowClear
            onChange={(e) => list.setDraft({ tag: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Slogan">
          <TextInput
            value={list.draft.keyword}
            placeholder="Slogan ID or text"
            allowClear
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Registered Date">
          <AppRangePicker
            className={styles.rangePicker}
            value={list.draft.period}
            format={SYS_DATE_FORMAT}
            separator="~"
            placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
            onChange={(period) => list.setDraft({ period: period as Period })}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        title={error ? <>Search Results <span className={styles.errorText}>{error.message}</span></> : undefined}
        total={total}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModal({ sloganId: null })}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<Post>
        rowKey="pstNo"
        className={styles.listTable}
        fill
        tableLayout="fixed"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(row) => setModal({ sloganId: row.pstNo })}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && (
        <SloganModal key={modal.sloganId ?? 'new'} sloganId={modal.sloganId} canWrite={canWrite} onClose={() => setModal(null)} />
      )}
    </SysPage>
  );
}
