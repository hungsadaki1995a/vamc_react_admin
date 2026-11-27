import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import AppSwitch from '@/components/inputs/AppSwitch';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { ZaloConnection, ZaloConnectionLog } from '@/api/system/zalo-connection-api';
import { DateTimeText, StatusBadge, SysButton, SysPage, SysSectionHeader, SysTable, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormSection } from '@/components/common/sys-ui/SysFormUi';
import { errorMessage, formatSysDateTime } from '@/utils/system-utils';
import ZaloStatCells from '../_shared/ZaloStatCells';
import { actorText } from '../_shared/zalo-messages';
import { useChangeZaloAutoRefresh, useRefreshZaloToken, useTestZaloConnection, useZaloConnection } from './use-zalo-connection';
import styles from './zalo-connection.module.scss';

// Zalo OA Connection (menu A09050600): mode (demo / live), the Official Account and app configured on the server,
// the OA token (expiry, refresh, automatic refresh), the webhook and the connection log. Secrets and tokens never
// reach the browser; in demo mode nothing is sent to Zalo.

/** Access token left under this many hours is shown in red. */
const TOKEN_LOW_HOURS = 6;

/** Result of [Test Connection] in this browser session. */
interface LastCheck {
  ok: boolean;
  text: string;
}

function buildLogColumns(t: TFunction): TableColumnsType<ZaloConnectionLog> {
  return [
    {
      title: t('zalo.connection.log.columns.at'),
      dataIndex: 'at',
      key: 'at',
      align: 'center',
      width: 150,
      render: (v: string) => <DateTimeText value={v} seconds />,
    },
    { title: t('zalo.connection.log.columns.event'), dataIndex: 'event', key: 'event', width: 130, ellipsis: true },
    {
      title: t('zalo.connection.log.columns.result'),
      dataIndex: 'result',
      key: 'result',
      align: 'center',
      width: 90,
      render: (v?: string) =>
        v ? <StatusBadge tone={v === 'OK' ? 'green' : 'red'}>{v === 'OK' ? 'OK' : t('zalo.common.failed')}</StatusBadge> : '-',
    },
    {
      title: t('zalo.connection.log.columns.detail'),
      key: 'detail',
      ellipsis: true,
      render: (_: unknown, row) => [row.detail, row.by ? actorText(row.by) : null].filter(Boolean).join(' · ') || '-',
    },
  ];
}

/** "16 hours left" / "Expired" / "Not used in demo mode". */
function tokenLeft(t: TFunction, connection: ZaloConnection | undefined): { text: string; low: boolean } {
  if (!connection) return { text: '-', low: false };
  if (connection.mode === 'DEMO') return { text: t('zalo.connection.token.notUsed'), low: false };
  if (!connection.accessTokenExprDt) return { text: t('zalo.connection.token.none'), low: true };
  const hours = dayjs(connection.accessTokenExprDt).diff(dayjs(), 'hour');
  if (hours < 0) return { text: t('zalo.connection.token.expired'), low: true };
  return { text: t('zalo.connection.token.hoursLeft', { count: hours }), low: hours <= TOKEN_LOW_HOURS };
}

export default function ZaloConnectionScreen() {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { canWrite } = useMenuPermission();
  const { data: connection, isFetching } = useZaloConnection();
  const testConnection = useTestZaloConnection();
  const refreshToken = useRefreshZaloToken();
  const changeAutoRefresh = useChangeZaloAutoRefresh();
  const [lastCheck, setLastCheck] = useState<LastCheck | null>(null);
  const demo = connection?.mode !== 'LIVE';
  const left = tokenLeft(t, connection);
  const autoOn = connection?.autoRfrshYn === 'Y';
  const lastEvent = connection?.lstWbhkDt
    ? `${formatSysDateTime(connection.lstWbhkDt)} · ${connection.lstWbhkEvtNm ?? '-'}`
    : t(demo ? 'zalo.connection.webhook.noneDemo' : 'zalo.connection.webhook.none');
  const notSet = t('zalo.connection.notSet');

  const handleTest = async () => {
    const at = formatSysDateTime(dayjs().toISOString());
    try {
      const response = await testConnection.mutateAsync();
      const result = response.data;
      if (!result?.performed) {
        setLastCheck({ ok: false, text: t('zalo.connection.oa.checkDemo', { at }) });
        toast.warning(t('messages.zalo.connection.testDemo'));
        return;
      }
      const ms = result.elapsedMs;
      setLastCheck({
        ok: result.ok,
        text: result.ok
          ? t('zalo.connection.oa.checkOk', { at, name: connection?.oaName ?? '-', ms })
          : t('zalo.connection.oa.checkFailed', { at, message: result.message ?? '-' }),
      });
      if (result.ok) toast.success(t('messages.zalo.connection.testOk'));
      else toast.error(result.message ?? t('messages.zalo.connection.testFailed'));
    } catch (error) {
      setLastCheck({ ok: false, text: `${at} · ${errorMessage(error)}` });
      toast.error(errorMessage(error));
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await refreshToken.mutateAsync();
      const result = response.data;
      if (result?.performed && result.ok) toast.success(t('messages.zalo.connection.refreshed'));
      else toast.warning(result?.message ?? t(demo ? 'messages.zalo.connection.refreshDemo' : 'messages.zalo.connection.refreshLater'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleAutoRefresh = async (on: boolean) => {
    try {
      await changeAutoRefresh.mutateAsync(on ? 'Y' : 'N');
      toast.success(t(on ? 'messages.zalo.connection.autoOn' : 'messages.zalo.connection.autoOff'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleCopyUrl = async () => {
    if (!connection?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(connection.webhookUrl);
      toast.success(t('messages.zalo.connection.urlCopied'));
    } catch {
      toast.error(t('messages.zalo.connection.copyFailed'));
    }
  };

  const stats = [
    {
      key: 'mode',
      label: t('zalo.connection.summary.mode'),
      value: connection ? (
        <StatusBadge tone={demo ? 'orange' : 'green'}>{t(demo ? 'zalo.connection.mode.demo' : 'zalo.connection.mode.live')}</StatusBadge>
      ) : (
        '-'
      ),
    },
    {
      key: 'connection',
      label: t('zalo.connection.summary.connection'),
      value: connection ? (
        <StatusBadge tone={connection.connected ? 'green' : 'gray'}>
          {t(connection.connected ? 'zalo.connection.state.connected' : 'zalo.connection.state.notConnected')}
        </StatusBadge>
      ) : (
        '-'
      ),
    },
    {
      key: 'token',
      label: t('zalo.connection.summary.token'),
      value: (
        <span className={styles.tokenLeft} data-low={left.low || undefined} data-muted={demo || undefined}>
          {left.text}
        </span>
      ),
    },
    { key: 'webhook', label: t('zalo.connection.summary.webhook'), value: lastEvent },
  ];

  const logs = connection?.logs ?? [];

  return (
    <SysPage>
      <SysTitleBar
        title={t('zalo.connection.title')}
        breadcrumb={[t('zalo.breadcrumb.root'), t('zalo.breadcrumb.notification'), t('zalo.connection.title')]}
      />
      <ZaloStatCells items={stats} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <SysFormSection
            title={t('zalo.connection.oa.title')}
            actions={
              canWrite && (
                <SysButton loading={testConnection.isPending} onClick={() => void handleTest()}>
                  {t('zalo.connection.buttons.test')}
                </SysButton>
              )
            }
          >
            <SysFieldGrid columns={1} labelWidth={150}>
              <SysField label={t('zalo.connection.oa.oaId')}>{connection?.oaId || notSet}</SysField>
              <SysField label={t('zalo.connection.oa.oaName')}>{connection?.oaName || notSet}</SysField>
              <SysField label={t('zalo.connection.oa.appId')}>{connection?.appId || notSet}</SysField>
              <SysField label={t('zalo.connection.oa.secret')}>
                <span className={styles.mutedText}>
                  {t(connection?.secretConfigured ? 'zalo.connection.oa.secretSet' : 'zalo.connection.oa.secretNotSet')}
                </span>
              </SysField>
              <SysField label={t('zalo.connection.oa.followLink')}>
                {/* Without an OA ID the server link is only the zalo.me prefix. */}
                {connection?.oaId && connection.followLink ? (
                  <a href={connection.followLink} target="_blank" rel="noreferrer" className={styles.link}>
                    {connection.followLink}
                  </a>
                ) : (
                  notSet
                )}
              </SysField>
              <SysField label={t('zalo.connection.oa.lastCheck')}>
                <span className={styles.checkText} data-state={lastCheck ? (lastCheck.ok ? 'ok' : 'failed') : undefined}>
                  {lastCheck ? lastCheck.text : t('zalo.connection.oa.notChecked')}
                </span>
              </SysField>
            </SysFieldGrid>
          </SysFormSection>

          <SysFormSection
            title={t('zalo.connection.token.title')}
            actions={
              canWrite && (
                <SysButton loading={refreshToken.isPending} onClick={() => void handleRefresh()}>
                  {t('zalo.connection.buttons.refresh')}
                </SysButton>
              )
            }
          >
            <SysFieldGrid columns={1} labelWidth={150}>
              <SysField label={t('zalo.connection.token.access')}>
                {demo ? (
                  '-'
                ) : (
                  <span>
                    {t('zalo.connection.token.expires', { at: formatSysDateTime(connection?.accessTokenExprDt) })} ·{' '}
                    <span className={styles.tokenLeft} data-low={left.low || undefined}>
                      {left.text}
                    </span>
                  </span>
                )}
              </SysField>
              <SysField label={t('zalo.connection.token.refresh')}>
                {demo || !connection?.refreshTokenExprDt
                  ? '-'
                  : t('zalo.connection.token.expires', { at: formatSysDateTime(connection.refreshTokenExprDt) })}
              </SysField>
              <SysField label={t('zalo.connection.token.auto')}>
                <span className={styles.switchRow}>
                  <AppSwitch
                    checked={autoOn}
                    disabled={!canWrite || !connection}
                    loading={changeAutoRefresh.isPending}
                    aria-label={t('zalo.connection.token.auto')}
                    onChange={(on) => void handleAutoRefresh(on)}
                  />
                  <span>{t(autoOn ? 'zalo.connection.token.autoOn' : 'zalo.connection.token.autoOff')}</span>
                </span>
              </SysField>
              <SysField label={t('zalo.connection.token.lastRefreshed')}>
                {demo ? '-' : formatSysDateTime(connection?.lstRfrshDt)}
              </SysField>
              <SysField label={t('zalo.connection.token.alert')}>
                <span className={styles.mutedText}>{t('zalo.connection.token.alertText')}</span>
              </SysField>
            </SysFieldGrid>
          </SysFormSection>
        </div>

        <div className={styles.column}>
          <SysFormSection
            title={t('zalo.connection.webhook.title')}
            actions={
              <SysButton disabled={!connection?.webhookUrl} onClick={() => void handleCopyUrl()}>
                {t('zalo.connection.buttons.copyUrl')}
              </SysButton>
            }
          >
            <SysFieldGrid columns={1} labelWidth={150}>
              <SysField label={t('zalo.connection.webhook.url')}>
                {connection?.webhookUrl ? (
                  <span className={styles.code}>{connection.webhookUrl}</span>
                ) : (
                  <span className={styles.mutedText}>{t('zalo.connection.webhook.urlPlaceholder')}</span>
                )}
              </SysField>
              <SysField label={t('zalo.connection.webhook.signature')}>
                {t(connection?.signatureCheck === false ? 'zalo.connection.webhook.signatureOff' : 'zalo.connection.webhook.signatureOn')}
              </SysField>
              <SysField label={t('zalo.connection.webhook.events')}>
                {connection?.eventsHandled.length ? connection.eventsHandled.join(' · ') : '-'}
              </SysField>
              <SysField label={t('zalo.connection.webhook.lastEvent')}>{lastEvent}</SysField>
            </SysFieldGrid>
          </SysFormSection>

          <section className={styles.logSection}>
            <SysSectionHeader title={t('zalo.connection.log.title')} total={logs.length} />
            <SysTable<ZaloConnectionLog>
              rowKey={(row, index) => `${row.at}-${row.event}-${index ?? 0}`}
              tableLayout="fixed"
              columns={buildLogColumns(t)}
              dataSource={logs}
              loading={isFetching}
              locale={{ emptyText: t(demo ? 'zalo.connection.log.emptyDemo' : 'zalo.connection.log.empty') }}
            />
          </section>
        </div>
      </div>
      <p className={styles.footnote}>{t(demo ? 'zalo.connection.footnote.demo' : 'zalo.connection.footnote.live')}</p>
    </SysPage>
  );
}
