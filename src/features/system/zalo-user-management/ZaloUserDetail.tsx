import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import AppRadio from '@/components/inputs/AppRadio';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloChangeHistory, ZaloSendMode, ZaloUser, ZaloUserMessage, ZaloUserType } from '@/api/system/zalo-api';
import { DateTimeText, StatusBadge, SysButton, SysEmpty, SysTable } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormSection } from '@/components/common/sys-ui/SysFormUi';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage, formatSysDateTime } from '@/utils/system-utils';
import ZaloDetailPanel from '../_shared/ZaloDetailPanel';
import { actorText } from '../_shared/zalo-messages';
import ZaloLinkStateBadge from './ZaloLinkStateBadge';
import ZaloTestMessageModal from './ZaloTestMessageModal';
import { accountText, historyEventText } from './zalo-user-constants';
import {
  useLinkZaloUser,
  useOpenZaloSendHistory,
  useUnlinkZaloUser,
  useZaloUser,
  useZaloUserHistory,
  useZaloUserMessages,
} from './use-zalo-users';
import styles from './zalo-user-management.module.scss';

// Zalo Users - User Details panel beside the list: General (link to an account when pending, unlink, test message),
// Link History and Messages (20 newest, content never shown) with a shortcut to Notification Send History.

type TabKey = 'general' | 'links' | 'messages';
type FieldKey = 'userTypeCd' | 'userNo';

function buildHistoryColumns(t: TFunction): TableColumnsType<ZaloChangeHistory> {
  return [
    {
      title: t('zalo.users.history.columns.at'),
      dataIndex: 'chgDt',
      key: 'chgDt',
      align: 'center',
      width: 130,
      render: (v: string) => <DateTimeText value={v} />,
    },
    { title: t('zalo.users.history.columns.by'), dataIndex: 'chgBy', key: 'chgBy', align: 'center', width: 80, render: (v?: string) => actorText(v) },
    { title: t('zalo.users.history.columns.event'), key: 'event', ellipsis: true, render: (_: unknown, row) => historyEventText(row) },
  ];
}

function buildMessageColumns(t: TFunction): TableColumnsType<ZaloUserMessage> {
  return [
    {
      title: t('zalo.users.messages.columns.sentAt'),
      dataIndex: 'sentAt',
      key: 'sentAt',
      align: 'center',
      width: 130,
      render: (v: string) => <DateTimeText value={v} />,
    },
    { title: t('zalo.users.messages.columns.template'), dataIndex: 'tplCd', key: 'tplCd', ellipsis: true, render: (v?: string) => v || '-' },
    {
      title: t('zalo.users.messages.columns.channel'),
      dataIndex: 'mode',
      key: 'mode',
      align: 'center',
      width: 90,
      render: (v?: ZaloSendMode) => codeLabel('zalo.channels', v),
    },
    {
      title: t('zalo.users.messages.columns.result'),
      key: 'success',
      align: 'center',
      width: 80,
      render: (_: unknown, row) => (
        <span title={row.failRsn || undefined}>
          <StatusBadge tone={row.success ? 'green' : 'red'}>{t(row.success ? 'zalo.common.success' : 'zalo.common.failed')}</StatusBadge>
        </span>
      ),
    },
  ];
}

interface ZaloUserDetailProps {
  /** Null while the list is empty. */
  zaloUserId: string | null;
  /** List row shown until the detail arrives. */
  fallback?: ZaloUser;
  canWrite: boolean;
}

export default function ZaloUserDetail({ zaloUserId, fallback, canWrite }: ZaloUserDetailProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const [tab, setTab] = useState<TabKey>('general');
  const [testOpen, setTestOpen] = useState(false);
  const [values, setValues] = useState<{ userTypeCd: ZaloUserType; userNo: string }>({ userTypeCd: 'MBR', userNo: '' });
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const { data: detail } = useZaloUser(zaloUserId);
  const { data: messages, isFetching: messagesLoading } = useZaloUserMessages(zaloUserId);
  const { data: history, isFetching: historyLoading } = useZaloUserHistory(zaloUserId, tab === 'links');
  const link = useLinkZaloUser();
  const unlink = useUnlinkZaloUser();
  const openSendHistory = useOpenZaloSendHistory();
  const user = detail ?? fallback;

  if (!user) {
    return (
      <ZaloDetailPanel title={t('zalo.users.detail.title')}>
        <SysEmpty>{t('zalo.users.detail.empty')}</SysEmpty>
      </ZaloDetailPanel>
    );
  }

  const linked = user.linkStatus === 'LINKED';
  const at = (value?: string) => formatSysDateTime(value);
  const followText = user.flwYn === 'Y' ? t('zalo.users.detail.followSince', { at: at(user.flwDt) }) : t('zalo.common.no');
  const shareText = user.shareAgreYn === 'Y' ? t('zalo.users.detail.sharedPhone', { phone: user.telno || '-' }) : t('zalo.common.no');
  const methodText =
    linked && user.linkMthdCd
      ? t(user.linkMthdCd === 'AUTO' ? 'zalo.users.detail.methodAuto' : 'zalo.users.detail.methodManual', { at: at(user.linkDt) })
      : '-';

  const handleLink = async () => {
    if (!checkRequired(values, ['userTypeCd', 'userNo'])) return;
    try {
      await link.mutateAsync({ zaloUserId: user.zaloUserId, request: { userTypeCd: values.userTypeCd, userNo: values.userNo.trim() } });
      toast.success(t('messages.zalo.linked'));
      setValues({ userTypeCd: 'MBR', userNo: '' });
    } catch (error) {
      const handled = applyApiError(error, {
        [ZALO_ERRORS.accountNotFound]: ['userNo', t('messages.zalo.accountNotFound')],
        [ZALO_ERRORS.accountAlreadyLinked]: ['userNo', t('messages.zalo.accountAlreadyLinked')],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const handleUnlink = () => {
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

  const tabs = [
    { key: 'general' as const, label: t('zalo.users.tabs.general') },
    { key: 'links' as const, label: t('zalo.users.tabs.links') },
    { key: 'messages' as const, label: t('zalo.users.tabs.messages', { count: messages?.length ?? 0 }) },
  ];

  return (
    <ZaloDetailPanel<TabKey>
      title={t('zalo.users.detail.title')}
      subtitle={user.zaloNm || '-'}
      badge={<ZaloLinkStateBadge user={user} />}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      leftActions={
        tab === 'general' &&
        canWrite &&
        linked && (
          <SysButton look="danger" loading={unlink.isPending} onClick={handleUnlink}>
            {t('zalo.users.buttons.unlink')}
          </SysButton>
        )
      }
      rightActions={
        tab === 'general' &&
        canWrite && (
          <>
            <SysButton onClick={() => setTestOpen(true)}>{t('zalo.users.buttons.testMessage')}</SysButton>
            {!linked && (
              <SysButton look="navy" loading={link.isPending} onClick={() => void handleLink()}>
                {t('zalo.users.buttons.link')}
              </SysButton>
            )}
          </>
        )
      }
    >
      {tab === 'general' && (
        <>
          <SysFieldGrid columns={1} labelWidth={124}>
            <SysField label={t('zalo.users.columns.zaloNm')}>{user.zaloNm || '-'}</SysField>
            <SysField label={t('zalo.users.columns.telno')}>{user.telno || '-'}</SysField>
            <SysField label={t('zalo.users.columns.following')}>{followText}</SysField>
            <SysField label={t('zalo.users.detail.shareAgree')}>{shareText}</SysField>
            <SysField label={t('zalo.users.detail.terms')}>
              {t(linked ? 'zalo.users.detail.termsAgreed' : 'zalo.users.detail.termsNone')}
            </SysField>
            <SysField label={t('zalo.users.columns.account')}>{accountText(user)}</SysField>
            <SysField label={t('zalo.users.detail.linkMethod')}>{methodText}</SysField>
            <SysField label={t('zalo.users.detail.receive')}>
              {t(linked ? 'zalo.users.detail.receiveOn' : 'zalo.users.detail.receiveNotLinked')}
            </SysField>
          </SysFieldGrid>
          {canWrite && !linked && (
            <SysFormSection title={t('zalo.users.link.title')}>
              <SysFieldGrid columns={1} labelWidth={124}>
                <SysField label={t('zalo.users.link.userType')} required error={errors.userTypeCd}>
                  <AppRadio.Group
                    value={values.userTypeCd}
                    options={[
                      { value: 'MBR', label: t('zalo.userTypes.MBR') },
                      { value: 'EMP', label: t('zalo.userTypes.EMP') },
                    ]}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, userTypeCd: e.target.value as ZaloUserType }));
                      clearError('userTypeCd');
                    }}
                  />
                </SysField>
                <SysField label={t('zalo.users.link.userNo')} required error={errors.userNo}>
                  <TextInput
                    value={values.userNo}
                    maxLength={10}
                    aria-label={t('zalo.users.link.userNo')}
                    placeholder={t('zalo.users.link.userNoPlaceholder')}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, userNo: e.target.value }));
                      clearError('userNo');
                    }}
                  />
                </SysField>
              </SysFieldGrid>
            </SysFormSection>
          )}
        </>
      )}

      {tab === 'links' && (
        <>
          <SysTable<ZaloChangeHistory>
            rowKey={(row, index) => `${row.chgDt}-${row.chgItemNm}-${index ?? 0}`}
            className={styles.panelTable}
            tableLayout="fixed"
            columns={buildHistoryColumns(t)}
            dataSource={history ?? []}
            loading={historyLoading}
          />
          <p className={styles.note}>{t('zalo.users.history.note')}</p>
        </>
      )}

      {tab === 'messages' && (
        <>
          <SysTable<ZaloUserMessage>
            rowKey="logId"
            className={styles.panelTable}
            tableLayout="fixed"
            columns={buildMessageColumns(t)}
            dataSource={messages ?? []}
            loading={messagesLoading}
            locale={{ emptyText: t('zalo.users.messages.empty') }}
          />
          {openSendHistory && (
            <button type="button" className={styles.linkButton} onClick={openSendHistory}>
              {t('zalo.users.messages.openHistory')}
            </button>
          )}
        </>
      )}

      {testOpen && <ZaloTestMessageModal user={user} onClose={() => setTestOpen(false)} />}
    </ZaloDetailPanel>
  );
}
