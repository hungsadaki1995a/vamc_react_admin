import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { AboutHistory } from '@/api/contents/about-page-api';
import {
  DateTimeText,
  SysButton,
  SysPage,
  SysPager,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/components/common/sys-ui/SysListUi';
import { SYS_PAGE_SIZE } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import HistoryModal from './HistoryModal';
import { useAboutHistories } from './use-history';
import styles from './history-management.module.scss';

// History Management - List (VPA07100201): timeline items of user About > About VAMC > History.
// Default order = year ascending (same as the user timeline); header click sorts; row click opens the edit popup.

const TITLE = 'History Management';
const BREADCRUMB = ['Content Management', 'About VAMC Management', TITLE];
const DEFAULT_SORT = { sortBy: 'year', sortDirection: 'ASC' as const };

const columns: TableColumnsType<AboutHistory> = [
  {
    title: 'No',
    dataIndex: 'no',
    sorter: true,
    align: 'center',
    width: 80,
    render: (v: number) => <span className={styles.noCell}>{v}</span>,
  },
  {
    title: 'Year',
    dataIndex: 'year',
    sorter: true,
    align: 'center',
    width: 80,
  },
  {
    title: 'Period Label (VN)',
    dataIndex: 'periodVn',
    sorter: true,
    align: 'center',
    width: 160,
    ellipsis: true,
  },
  {
    title: 'Content (VN)',
    dataIndex: 'contentVn',
    sorter: true,
    ellipsis: true,
    onHeaderCell: () => ({ className: styles.centerHeader }),
  },
  {
    title: 'Modified Date',
    dataIndex: 'mdfcnDt',
    sorter: true,
    align: 'center',
    width: 130,
    render: (v?: string) => <DateTimeText value={v} />,
  },
  {
    title: 'Modified By',
    dataIndex: 'mdfcnBy',
    sorter: true,
    width: 130,
    ellipsis: true,
    onHeaderCell: () => ({ className: styles.centerHeader }),
  },
];

/** Popup state: closed, register (null) or edit (post number). */
type ModalState = { pstNo: string | null } | null;

export default function HistoryManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const list = usePagedList<Record<string, never>>({}, { defaultSort: DEFAULT_SORT });
  const { data } = useAboutHistories(list.pageQuery);
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  return (
    <SysPage fill>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      <SysSectionHeader
        total={total}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModal({ pstNo: null })}>
              {t('common.new')}
            </SysButton>
          )
        }
      />
      <div className={styles.listWrap}>
        <SysTable<AboutHistory>
          rowKey="pstNo"
          className={styles.list}
          fill
          tableLayout="fixed"
          columns={columns}
          dataSource={data?.content ?? []}
          onRowClick={(row) => setModal({ pstNo: row.pstNo })}
          sort={list.sort}
          onSortChange={(sort) => list.setSort(sort ?? DEFAULT_SORT)}
        />
        {total > SYS_PAGE_SIZE && (
          <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
        )}
      </div>
      {modal && (
        <HistoryModal
          key={modal.pstNo ?? 'new'}
          pstNo={modal.pstNo}
          canWrite={canWrite}
          onClose={() => setModal(null)}
        />
      )}
    </SysPage>
  );
}
