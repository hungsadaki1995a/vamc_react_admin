import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Alert } from 'antd';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { usePagedList } from '@/hooks/use-paged-list';
import type { ZaloLinkStatus, ZaloUser, ZaloUserSearch, ZaloUserType } from '@/api/system/zalo-api';
import {
  DateTimeText,
  StatusBadge,
  SysButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/components/common/sys-ui/SysListUi';
import { ALL, SYS_PAGE_SIZE } from '@/config/sys-constants';
import type { YesNo } from '@/config/sys-constants';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage } from '@/utils/system-utils';
import ZaloInviteModal from './ZaloInviteModal';
import ZaloLinkModal from './ZaloLinkModal';
import ZaloSimulateModal from './ZaloSimulateModal';
import { accountText } from './zalo-user-constants';
import {
  useRebuildZaloPhoneIndex,
  useUnlinkZaloUser,
  useZaloStatus,
  useZaloUserSummary,
  useZaloUsers,
} from './use-zalo-users';
import styles from './zalo-user-management.module.scss';

// Zalo Users (menu A09050300): Zalo users who follow the OA, their account links, invitations and,
// in demo mode only, the simulated OA follow + phone share that drives the automatic link.

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

function LinkStateBadge({ user }: { user: ZaloUser }) {
  if (user.linkStatus !== 'LINKED') return <StatusBadge tone="orange">{codeLabel('zalo.linkState', 'PENDING')}</StatusBadge>;
  const method = user.linkMthdCd ?? 'MANUAL';
  return <StatusBadge tone={method === 'AUTO' ? 'green' : 'blue'}>{codeLabel('zalo.linkState', method)}</StatusBadge>;
}

interface ColumnActions {
  canWrite: boolean;
  onLink: (user: ZaloUser) => void;
  onUnlink: (user: ZaloUser) => void;
}

function buildColumns(t: TFunction, { canWrite, onLink, onUnlink }: ColumnActions): TableColumnsType<ZaloUser> {
  const columns: TableColumnsType<ZaloUser> = [
    { title: t('zalo.users.columns.zaloNm'), dataIndex: 'zaloNm', key: 'zaloNm', width: 160, ellipsis: true, render: (v?: string) => v || '-' },
    { title: t('zalo.users.columns.telno'), dataIndex: 'telno', key: 'telno', width: 130, render: (v?: string) => v || '-' },
    {
      title: t('zalo.users.columns.status'),
      key: 'linkStatus',
      align: 'center',
      width: 170,
      render: (_: unknown, row) => <LinkStateBadge user={row} />,
    },
    { title: t('zalo.users.columns.account'), key: 'account', ellipsis: true, render: (_: unknown, row) => accountText(row) },
    {
      title: t('zalo.users.columns.following'),
      dataIndex: 'flwYn',
      key: 'flwYn',
      align: 'center',
      width: 120,
      render: (v?: YesNo) => (v ? t(v === 'Y' ? 'zalo.common.yes' : 'zalo.common.no') : '-'),
    },
    {
      title: t('zalo.users.columns.linkDt'),
      dataIndex: 'linkDt',
      key: 'linkDt',
      width: 150,
      render: (v?: string) => <DateTimeText value={v} />,
    },
    {
      title: t('zalo.users.columns.lstItrctDt'),
      dataIndex: 'lstItrctDt',
      key: 'lstItrctDt',
      width: 150,
      render: (v?: string) => <DateTimeText value={v} />,
    },
  ];
  if (!canWrite) return columns;
  return [
    ...columns,
    {
      title: t('zalo.users.columns.actions'),
      key: 'actions',
      align: 'center',
      width: 130,
      render: (_: unknown, row) =>
        row.linkStatus === 'LINKED' ? (
          <SysButton size="small" onClick={() => onUnlink(row)}>
            {t('zalo.users.buttons.unlink')}
          </SysButton>
        ) : (
          <SysButton size="small" look="outline" onClick={() => onLink(row)}>
            {t('zalo.users.buttons.link')}
          </SysButton>
        ),
    },
  ];
}

type ModalState = { type: 'link'; user: ZaloUser } | { type: 'invite' } | { type: 'simulate' } | null;

export default function ZaloUserManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const list = usePagedList<UserFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useZaloUsers(search, list.pageQuery);
  const { data: summary } = useZaloUserSummary();
  const { data: status } = useZaloStatus();
  const unlink = useUnlinkZaloUser();
  const rebuild = useRebuildZaloPhoneIndex();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;
  const mockMode = status?.mockMode === true;
  const indexReady = status?.phoneIndexReady !== false;

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

  const handleUnlink = (user: ZaloUser) => {
    confirm({
      content: t('messages.zalo.confirmUnlink', { account: user.userNo ?? '-' }),
      okText: t('zalo.users.buttons.unlink'),
      danger: true,
      onOk: async () => {
        try {
          await unlink.mutateAsync(user.zaloUserId);
          toast.success(t('messages.zalo.unlinked'));
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const handleRebuild = () => {
    confirm({
      content: t('messages.zalo.confirmRebuild'),
      okText: t('zalo.common.run'),
      onOk: async () => {
        try {
          const response = await rebuild.mutateAsync();
          toast.success(t('messages.zalo.rebuilt', { members: response.data?.members ?? 0, employees: response.data?.employees ?? 0 }));
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const columns = buildColumns(t, {
    canWrite,
    onLink: (user) => setModal({ type: 'link', user }),
    onUnlink: handleUnlink,
  });

  return (
    <SysPage>
      <SysTitleBar
        title={t('zalo.users.title')}
        breadcrumb={[t('zalo.breadcrumb.root'), t('zalo.breadcrumb.notification'), t('zalo.users.title')]}
      />
      {mockMode && <Alert type="info" showIcon title={t('zalo.common.demoMode')} />}
      {status && !status.phoneIndexReady && <Alert type="warning" showIcon title={t('zalo.common.phoneIndexMissing')} />}
      <div className={styles.summary}>
        <SummaryCard label={t('zalo.users.summary.linked')} value={summary?.linked} tone="linked" />
        <SummaryCard label={t('zalo.users.summary.pending')} value={summary?.pending} tone="pending" />
        <SummaryCard label={t('zalo.users.summary.following')} value={summary?.following} tone="following" />
      </div>
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
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        title={t('zalo.common.searchResults')}
        total={total}
        actions={
          canWrite && (
            <SysButton loading={rebuild.isPending} disabled={!indexReady} onClick={handleRebuild}>
              {t('zalo.users.buttons.rebuildIndex')}
            </SysButton>
          )
        }
        primaryActions={
          canWrite && (
            <>
              {mockMode && (
                <SysButton look="outline" disabled={!indexReady} onClick={() => setModal({ type: 'simulate' })}>
                  {t('zalo.users.buttons.simulate')}
                </SysButton>
              )}
              <SysButton look="navy" onClick={() => setModal({ type: 'invite' })}>
                {t('zalo.users.buttons.invite')}
              </SysButton>
            </>
          )
        }
      />
      <SysTable<ZaloUser>
        rowKey="zaloUserId"
        className={styles.listTable}
        fill
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal?.type === 'link' && <ZaloLinkModal user={modal.user} onClose={() => setModal(null)} />}
      {modal?.type === 'invite' && <ZaloInviteModal onClose={() => setModal(null)} />}
      {modal?.type === 'simulate' && <ZaloSimulateModal onClose={() => setModal(null)} />}
    </SysPage>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value?: number; tone: 'linked' | 'pending' | 'following' }) {
  return (
    <div className={styles.summaryCard} data-tone={tone}>
      <span className={styles.summaryLabel}>{label}</span>
      <strong className={styles.summaryValue}>{value === undefined ? '-' : value.toLocaleString('en-US')}</strong>
    </div>
  );
}
