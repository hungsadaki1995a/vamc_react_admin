import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import { errorMessage, rowNumber } from '@/utils/system-utils';
import ZaloInviteModal from './ZaloInviteModal';
import ZaloLinkStateBadge from './ZaloLinkStateBadge';
import ZaloSimulateModal from './ZaloSimulateModal';
import ZaloUserModal from './ZaloUserModal';
import { accountText } from './zalo-user-constants';
import { useRebuildZaloPhoneIndex, useZaloStatus, useZaloUsers } from './use-zalo-users';
import styles from './zalo-user-management.module.scss';

// Zalo Users (menu A09050300): Zalo users who follow the OA and their account links. Row click opens the detail
// popup (manual link / unlink). [Simulate OA Follow + Phone Share] is shown in demo mode only.

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
      width: 60,
      render: (_: unknown, __, index) => rowNumber(total, page, SYS_PAGE_SIZE, index),
    },
    {
      title: t('zalo.users.columns.status'),
      key: 'linkStatus',
      align: 'center',
      width: 140,
      render: (_: unknown, row) => <ZaloLinkStateBadge user={row} />,
    },
    {
      title: t('zalo.users.columns.zaloNm'),
      dataIndex: 'zaloNm',
      key: 'zaloNm',
      width: 160,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: t('zalo.users.columns.telno'),
      dataIndex: 'telno',
      key: 'telno',
      align: 'center',
      width: 130,
      render: (v?: string) => v || '-',
    },
    { title: t('zalo.users.columns.account'), key: 'account', ellipsis: true, render: (_: unknown, row) => accountText(row) },
    {
      title: t('zalo.users.columns.following'),
      dataIndex: 'flwYn',
      key: 'flwYn',
      align: 'center',
      width: 110,
      render: (v?: YesNo) => (v ? t(v === 'Y' ? 'zalo.common.yes' : 'zalo.common.no') : '-'),
    },
    {
      title: t('zalo.users.columns.linkDt'),
      dataIndex: 'linkDt',
      key: 'linkDt',
      width: 150,
      render: (v?: string) => <DateTimeText value={v} />,
    },
  ];
}

type ModalState = { type: 'detail'; user: ZaloUser } | { type: 'invite' } | { type: 'simulate' } | null;

export default function ZaloUserManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const list = usePagedList<UserFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useZaloUsers(search, list.pageQuery);
  const { data: status } = useZaloStatus();
  const rebuild = useRebuildZaloPhoneIndex();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

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

  return (
    <SysPage>
      <SysTitleBar
        title={t('zalo.users.title')}
        breadcrumb={[t('zalo.breadcrumb.root'), t('zalo.breadcrumb.notification'), t('zalo.users.title')]}
      />
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
        total={total}
        actions={
          canWrite && (
            <>
              <SysButton loading={rebuild.isPending} onClick={handleRebuild}>
                {t('zalo.users.buttons.rebuildIndex')}
              </SysButton>
              {status?.mockMode && <SysButton onClick={() => setModal({ type: 'simulate' })}>{t('zalo.users.buttons.simulate')}</SysButton>}
            </>
          )
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
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(row) => setModal({ type: 'detail', user: row })}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal?.type === 'detail' && <ZaloUserModal user={modal.user} canWrite={canWrite} onClose={() => setModal(null)} />}
      {modal?.type === 'invite' && <ZaloInviteModal onClose={() => setModal(null)} />}
      {modal?.type === 'simulate' && <ZaloSimulateModal onClose={() => setModal(null)} />}
    </SysPage>
  );
}
