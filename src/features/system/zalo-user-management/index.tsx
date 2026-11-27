import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { usePagedList } from '@/hooks/use-paged-list';
import type { ZaloLinkStatus, ZaloUser, ZaloUserSearch, ZaloUserType } from '@/api/system/zalo-api';
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
  SysSplit,
  SysTable,
  SysTitleBar,
} from '@/components/common/sys-ui/SysListUi';
import { ALL, SYS_PAGE_SIZE } from '@/config/sys-constants';
import type { YesNo } from '@/config/sys-constants';
import { rowNumber } from '@/utils/system-utils';
import ZaloStatCells from '../_shared/ZaloStatCells';
import ZaloInviteModal from './ZaloInviteModal';
import ZaloLinkStateBadge from './ZaloLinkStateBadge';
import ZaloSimulateModal from './ZaloSimulateModal';
import ZaloUserDetail from './ZaloUserDetail';
import { accountText } from './zalo-user-constants';
import { useDownloadZaloUsersExcel, useZaloStatus, useZaloUserSummary, useZaloUsers } from './use-zalo-users';
import styles from './zalo-user-management.module.scss';

// Zalo Users (menu A09050300): Zalo users who follow the OA and their account links. List on the left, User Details of
// the selected row on the right (link / unlink, test message, link history, messages). [Simulate OA Follow + Phone
// Share] is shown in demo mode only.

interface UserFilter {
  linkStatus: ZaloLinkStatus | '';
  followYn: YesNo | '';
  userTypeCd: ZaloUserType | '';
  keyword: string;
}

const INITIAL_FILTER: UserFilter = { linkStatus: ALL, followYn: ALL, userTypeCd: ALL, keyword: '' };

function toSearch(filter: UserFilter): ZaloUserSearch {
  return {
    linkStatus: filter.linkStatus,
    followYn: filter.followYn,
    userTypeCd: filter.userTypeCd,
    keyword: filter.keyword.trim(),
  };
}

function buildColumns(t: TFunction, page: number, total: number): TableColumnsType<ZaloUser> {
  return [
    {
      title: 'No',
      key: 'no',
      align: 'center',
      width: 50,
      render: (_: unknown, __, index) => rowNumber(total, page, SYS_PAGE_SIZE, index),
    },
    {
      title: t('zalo.users.columns.status'),
      key: 'linkStatus',
      align: 'center',
      width: 124,
      render: (_: unknown, row) => <ZaloLinkStateBadge user={row} />,
    },
    {
      title: t('zalo.users.columns.zaloNm'),
      dataIndex: 'zaloNm',
      key: 'zaloNm',
      width: 150,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: t('zalo.users.columns.telno'),
      dataIndex: 'telno',
      key: 'telno',
      align: 'center',
      width: 110,
      render: (v?: string) => v || '-',
    },
    { title: t('zalo.users.columns.account'), key: 'account', ellipsis: true, render: (_: unknown, row) => accountText(row) },
    {
      title: t('zalo.users.columns.followingShort'),
      dataIndex: 'flwYn',
      key: 'flwYn',
      align: 'center',
      width: 90,
      render: (v?: YesNo) => (v ? t(v === 'Y' ? 'zalo.common.yes' : 'zalo.common.no') : '-'),
    },
    {
      title: t('zalo.users.columns.linkDt'),
      dataIndex: 'linkDt',
      key: 'linkDt',
      width: 130,
      render: (v?: string) => <DateTimeText value={v} />,
    },
  ];
}

type ModalState = { type: 'invite' } | { type: 'simulate' } | null;

export default function ZaloUserManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const list = usePagedList<UserFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching, refetch } = useZaloUsers(search, list.pageQuery);
  const { data: summary } = useZaloUserSummary();
  const { data: status } = useZaloStatus();
  const excel = useDownloadZaloUsersExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  // The design always shows a user: the picked row, else the first row of the page.
  const selected = rows.find((row) => row.zaloUserId === selectedId) ?? rows[0];

  const allOption = { value: ALL, label: t('zalo.common.all') } as const;
  const linkStatusOptions = [
    allOption,
    { value: 'LINKED' as const, label: t('zalo.linkStatus.LINKED') },
    { value: 'PENDING' as const, label: t('zalo.linkStatus.PENDING') },
  ];
  const followOptions = [
    allOption,
    { value: 'Y' as const, label: t('zalo.common.yes') },
    { value: 'N' as const, label: t('zalo.common.no') },
  ];
  const userTypeOptions = [
    allOption,
    { value: 'MBR' as const, label: t('zalo.userTypes.MBR') },
    { value: 'EMP' as const, label: t('zalo.userTypes.EMP') },
  ];

  const invites = summary ? `${summary.invitesToday.toLocaleString('en-US')}` : '-';
  const stats = [
    { key: 'linked', label: t('zalo.users.summary.linked'), value: <strong>{summary?.linked ?? '-'}</strong> },
    { key: 'pending', label: t('zalo.users.summary.pending'), value: <strong>{summary?.pending ?? '-'}</strong> },
    { key: 'following', label: t('zalo.users.summary.following'), value: <strong>{summary?.following ?? '-'}</strong> },
    {
      key: 'invites',
      label: t('zalo.users.summary.invitesToday'),
      value: (
        <span title={summary?.inviteLmtCd ?? undefined}>
          <strong>{invites}</strong>
          {summary?.inviteLimit != null && ` / ${summary.inviteLimit.toLocaleString('en-US')}`}
        </span>
      ),
    },
  ];

  return (
    <SysPage>
      <SysTitleBar
        title={t('zalo.users.title')}
        breadcrumb={[t('zalo.breadcrumb.root'), t('zalo.breadcrumb.notification'), t('zalo.users.title')]}
      />
      <ZaloStatCells items={stats} />
      <SysFilterPanel>
        <SysFilterItem label={t('zalo.users.filter.linkStatus')}>
          <AppSelect<ZaloLinkStatus | ''>
            value={list.draft.linkStatus}
            options={linkStatusOptions}
            onChange={(linkStatus) => list.setDraft({ linkStatus })}
          />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.users.filter.following')}>
          <AppSelect<YesNo | ''> value={list.draft.followYn} options={followOptions} onChange={(followYn) => list.setDraft({ followYn })} />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.users.filter.userType')}>
          <AppSelect<ZaloUserType | ''>
            value={list.draft.userTypeCd}
            options={userTypeOptions}
            onChange={(userTypeCd) => list.setDraft({ userTypeCd })}
          />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.common.keyword')}>
          <TextInput
            value={list.draft.keyword}
            placeholder={t('zalo.users.filter.keywordPlaceholder')}
            allowClear
            maxLength={100}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => { if (!list.search()) void refetch(); }}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={() => { if (!list.reset()) void refetch(); }} onSearch={() => { if (!list.search()) void refetch(); }} loading={isFetching} />
      <SysSplit
        ratio="minmax(0, 1fr) 440px"
        left={
          <div className={styles.pane}>
            <SysSectionHeader
              total={total}
              actions={
                <>
                  <SysExcelButton loading={excel.isPending} onClick={() => excel.mutate(search)} />
                  {canWrite && status?.mockMode && (
                    <SysButton onClick={() => setModal({ type: 'simulate' })}>{t('zalo.users.buttons.simulate')}</SysButton>
                  )}
                </>
              }
              primaryActions={
                canWrite && (
                  <SysButton look="navy" onClick={() => setModal({ type: 'invite' })}>
                    {t('zalo.users.buttons.invite')}
                  </SysButton>
                )
              }
            />
            <SysTable<ZaloUser>
              rowKey="zaloUserId"
              className={styles.listTable}
              fill
              tableLayout="fixed"
              columns={buildColumns(t, list.page, total)}
              dataSource={rows}
              loading={isFetching}
              selectedRowKey={selected?.zaloUserId}
              onRowClick={(row) => setSelectedId(row.zaloUserId)}
            />
            <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
          </div>
        }
        right={
          <ZaloUserDetail
            key={selected?.zaloUserId ?? 'none'}
            zaloUserId={selected?.zaloUserId ?? null}
            fallback={selected}
            canWrite={canWrite}
          />
        }
      />
      {modal?.type === 'invite' && <ZaloInviteModal onClose={() => setModal(null)} />}
      {modal?.type === 'simulate' && <ZaloSimulateModal onClose={() => setModal(null)} />}
    </SysPage>
  );
}
