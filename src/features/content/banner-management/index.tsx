import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { Banner } from '@/api/contents/banner-api';
import { DateTimeText, SysButton, SysPage, SysTable, SysTitleBar } from '@/features/system/_shared/SysListUi';
import BannerModal from './BannerModal';
import BannerThumb from './BannerThumb';
import { BANNER_HOME_POSITION, BANNER_LIST_SIZE, BANNER_MAX, BANNER_MESSAGES } from './banner-constants';
import { useBanners } from './use-banners';
import styles from './banner-management.module.scss';

// Banner Management - List (VPA07060101), menu A07060100.
// Design: no search filter, "Search Results | Total n / Max 5", rows in display order, row click → edit popup.
// The screen lists the user home banner area; every banner there is shown on the user home.

const HOME_SEARCH = { positionId: BANNER_HOME_POSITION };

const byText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '');

/** Popup state: closed, register (null) or edit (row). */
type ModalState = { banner: Banner | null } | null;

const columns: TableColumnsType<Banner> = [
  {
    title: 'Order',
    dataIndex: 'order',
    key: 'order',
    width: 80,
    defaultSortOrder: 'ascend',
    sorter: (a, b) => (a.order ?? 0) - (b.order ?? 0),
  },
  {
    title: 'Image',
    key: 'image',
    width: 200,
    align: 'center',
    render: (_v, row) => <BannerThumb fileUnqId={row.imageFileId} alt={row.title} />,
  },
  {
    title: 'Banner Title',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    sorter: (a, b) => byText(a.title, b.title),
  },
  {
    title: 'Modified Date',
    dataIndex: 'mdfcnDt',
    key: 'mdfcnDt',
    width: 130,
    align: 'center',
    sorter: (a, b) => byText(a.mdfcnDt ?? a.crtDt, b.mdfcnDt ?? b.crtDt),
    render: (v: string | undefined, row) => <DateTimeText value={v ?? row.crtDt} />,
  },
  {
    title: 'Modified By',
    dataIndex: 'mdfcnBy',
    key: 'mdfcnBy',
    width: 130,
    sorter: (a, b) => byText(a.mdfcnBy ?? a.crtBy, b.mdfcnBy ?? b.crtBy),
    render: (v: string | undefined, row) => v || row.crtBy || '-',
  },
];

export default function BannerManagement() {
  const { canWrite } = useMenuPermission();
  const { data, isFetching, error } = useBanners(HOME_SEARCH, 1, BANNER_LIST_SIZE);
  const [modal, setModal] = useState<ModalState>(null);

  const banners = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <SysPage fill>
      <SysTitleBar title="Banner Management" breadcrumb={['Content Management', 'Site Display Management', 'Banner Management']} />
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <span>Search Results</span>
          <span className={styles.sectionTotal}>
            Total <strong>{total}</strong> / Max {BANNER_MAX}
          </span>
          {error && <span className={styles.errorText}>{error.message}</span>}
        </div>
        {canWrite && (
          <SysButton look="navy" disabled={total >= BANNER_MAX} onClick={() => setModal({ banner: null })}>
            New
          </SysButton>
        )}
      </div>
      <SysTable<Banner>
        rowKey="bannerId"
        fill
        tableLayout="fixed"
        columns={columns}
        dataSource={banners}
        loading={isFetching}
        locale={{ emptyText: BANNER_MESSAGES.empty }}
        onRowClick={(banner) => setModal({ banner })}
      />
      {modal && (
        <BannerModal
          key={modal.banner?.bannerId ?? 'new'}
          banner={modal.banner}
          bannerCount={total}
          nextOrder={total + 1}
          canWrite={canWrite}
          onClose={() => setModal(null)}
        />
      )}
    </SysPage>
  );
}
