import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloLimitException, ZaloLimitRule } from '@/api/system/zalo-limit-api';
import { DateTimeText, StatusBadge, SysButton, SysEmpty, SysTable } from '@/components/common/sys-ui/SysListUi';
import { SysField } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiErrorCode, errorMessage, formatSysDateTime } from '@/utils/system-utils';
import ZaloChangeHistoryTable from '../_shared/ZaloChangeHistoryTable';
import ZaloDetailPanel from '../_shared/ZaloDetailPanel';
import ZaloLimitExceptionModal from './ZaloLimitExceptionModal';
import ZaloLimitRuleFields from './ZaloLimitRuleFields';
import { isRuleDirty, limitText, ruleExplanation, ruleFormErrors, toRuleForm, toUpdateRequest } from './zalo-limit-constants';
import type { RuleFieldKey, RuleFormState } from './zalo-limit-constants';
import {
  useChangeZaloLimitRuleUse,
  useDeleteZaloLimitException,
  useSaveZaloLimitRule,
  useZaloLimitExceptions,
  useZaloLimitRuleHistory,
} from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - Rule Details beside the list. General: edit and [Save], [Activate] / [Deactivate], [Copy]
// (opens New filled in); Exceptions (n): per-account limits of sender / recipient rules; Change History.

type TabKey = 'general' | 'exceptions' | 'history';

/** Exception popup: closed, Add (null) or edit of a row. */
type ExceptionModalState = { exception: ZaloLimitException | null } | null;

function buildExceptionColumns(
  t: TFunction,
  rule: ZaloLimitRule,
  onDelete: ((row: ZaloLimitException) => void) | null,
): TableColumnsType<ZaloLimitException> {
  const columns: TableColumnsType<ZaloLimitException> = [
    {
      title: t('zalo.limits.exceptions.columns.account'),
      dataIndex: 'trgtId',
      key: 'trgtId',
      width: 100,
      ellipsis: true,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: t('zalo.limits.exceptions.columns.limit'),
      dataIndex: 'excpLmtVal',
      key: 'excpLmtVal',
      align: 'right',
      width: 90,
      render: (v: number) => limitText(v, rule.lmtMsrCd),
    },
    {
      title: t('zalo.limits.exceptions.columns.expires'),
      key: 'expryDt',
      align: 'center',
      width: 96,
      render: (_: unknown, row) =>
        row.expired ? (
          <StatusBadge tone="gray">{t('zalo.limits.exceptions.expired')}</StatusBadge>
        ) : row.expryDt ? (
          <DateTimeText value={row.expryDt} dateOnly />
        ) : (
          t('zalo.limits.fields.openEnded')
        ),
    },
    { title: t('zalo.limits.exceptions.columns.reason'), dataIndex: 'excpRsn', key: 'excpRsn', ellipsis: true },
  ];
  if (onDelete) {
    columns.push({
      title: '',
      key: 'delete',
      align: 'center',
      width: 64,
      render: (_: unknown, row) => (
        <SysButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row);
          }}
        >
          {t('zalo.limits.buttons.delete')}
        </SysButton>
      ),
    });
  }
  return columns;
}

interface ZaloLimitRuleDetailProps {
  /** Selected row; null while the list is empty. */
  rule: ZaloLimitRule | null;
  canWrite: boolean;
  onCopy: (rule: ZaloLimitRule) => void;
  /** Lets the page ask before leaving unsaved edits. */
  onDirtyChange: (dirty: boolean) => void;
}

export default function ZaloLimitRuleDetail({ rule, canWrite, onCopy, onDirtyChange }: ZaloLimitRuleDetailProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const [tab, setTab] = useState<TabKey>('general');
  const [exceptionModal, setExceptionModal] = useState<ExceptionModalState>(null);
  const [values, setValues] = useState<RuleFormState>(() => toRuleForm(rule));
  const { errors, setError, clearError } = useFieldErrors<RuleFieldKey>();
  const lmtCd = rule?.lmtCd ?? null;
  const { data: exceptions, isFetching: exceptionsLoading } = useZaloLimitExceptions(lmtCd, tab === 'exceptions');
  const { data: history, isFetching: historyLoading } = useZaloLimitRuleHistory(lmtCd, tab === 'history');
  const save = useSaveZaloLimitRule();
  const changeUse = useChangeZaloLimitRuleUse();
  const deleteException = useDeleteZaloLimitException();
  const dirty = rule !== null && isRuleDirty(values, rule);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  if (!rule) {
    return (
      <ZaloDetailPanel title={t('zalo.limits.detail.title')}>
        <SysEmpty>{t('zalo.limits.detail.empty')}</SysEmpty>
      </ZaloDetailPanel>
    );
  }

  const active = rule.useYn === 'Y';
  const exceptionScope = rule.lmtScopeCd !== 'SYSTEM';

  const patch = (key: RuleFieldKey | null, value: Partial<RuleFormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    if (key) clearError(key);
  };

  const handleSave = async () => {
    const invalid = Object.entries(ruleFormErrors(values)) as [RuleFieldKey, string][];
    if (invalid.length > 0) {
      invalid.forEach(([key, message]) => setError(key, message));
      return;
    }
    try {
      const response = await save.mutateAsync({ lmtCd: rule.lmtCd, request: toUpdateRequest(values) });
      if (response.data) setValues(toRuleForm(response.data));
      toast.success(SYS_MESSAGES.updated);
    } catch (error) {
      if (apiErrorCode(error) === ZALO_ERRORS.limitRuleInvalid) {
        setError('efctEndDt', errorMessage(error));
      } else {
        toast.error(errorMessage(error));
      }
    }
  };

  const handleToggle = async () => {
    try {
      await changeUse.mutateAsync({ lmtCd: rule.lmtCd, useYn: active ? 'N' : 'Y' });
      toast.success(t(active ? 'messages.zalo.limits.deactivated' : 'messages.zalo.limits.activated'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleDeleteException = (row: ZaloLimitException) => {
    confirm({
      content: t('messages.zalo.limits.confirmDeleteException', { account: row.trgtId }),
      okText: t('zalo.limits.buttons.delete'),
      danger: true,
      onOk: async () => {
        try {
          await deleteException.mutateAsync({ lmtCd: rule.lmtCd, trgtId: row.trgtId });
          toast.success(SYS_MESSAGES.deleted);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const modifiedAt = rule.mdfcnDt ?? rule.crtDt;
  const modifiedBy = rule.mdfcnBy ?? rule.crtBy;
  const tabs = [
    { key: 'general' as const, label: t('zalo.limits.tabs.general') },
    { key: 'exceptions' as const, label: t('zalo.limits.tabs.exceptions', { count: exceptions?.length ?? rule.excpCount }) },
    { key: 'history' as const, label: t('zalo.limits.tabs.history') },
  ];

  return (
    <ZaloDetailPanel<TabKey>
      title={t('zalo.limits.detail.title')}
      subtitle={rule.lmtCd}
      badge={<StatusBadge tone={active ? 'blue' : 'gray'}>{t(active ? 'zalo.common.active' : 'zalo.common.inactive')}</StatusBadge>}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      leftActions={
        tab === 'general' &&
        canWrite && (
          <SysButton loading={changeUse.isPending} onClick={() => void handleToggle()}>
            {t(active ? 'zalo.limits.buttons.deactivate' : 'zalo.limits.buttons.activate')}
          </SysButton>
        )
      }
      rightActions={
        tab === 'general' &&
        canWrite && (
          <>
            <SysButton onClick={() => onCopy(rule)}>{t('zalo.limits.buttons.copy')}</SysButton>
            <SysButton look="navy" loading={save.isPending} disabled={!dirty} onClick={() => void handleSave()}>
              {t('zalo.limits.buttons.save')}
            </SysButton>
          </>
        )
      }
    >
      {tab === 'general' && (
        <>
          <ZaloLimitRuleFields values={values} onPatch={patch} errors={errors} isCreate={false} disabled={!canWrite}>
            <SysField label={t('zalo.limits.fields.lastModified')}>
              {modifiedAt ? t('zalo.limits.detail.modifiedBy', { at: formatSysDateTime(modifiedAt), by: modifiedBy ?? '-' }) : '-'}
            </SysField>
            <SysField label={t('zalo.limits.fields.peakUsage')}>
              {t('zalo.limits.detail.peakUsage', { used: limitText(rule.usedVal, rule.lmtMsrCd), pct: rule.usedPct })}
            </SysField>
          </ZaloLimitRuleFields>
          <p className={styles.explainBox}>{ruleExplanation(values, rule.lmtCd)}</p>
        </>
      )}

      {tab === 'exceptions' && (
        <>
          <div className={styles.tabToolbar}>
            <p className={styles.note}>{t(exceptionScope ? 'zalo.limits.exceptions.note' : 'zalo.limits.exceptions.systemNote')}</p>
            {canWrite && exceptionScope && (
              <SysButton look="navy" onClick={() => setExceptionModal({ exception: null })}>
                {t('zalo.limits.buttons.add')}
              </SysButton>
            )}
          </div>
          <SysTable<ZaloLimitException>
            rowKey="trgtId"
            className={styles.panelTable}
            tableLayout="fixed"
            columns={buildExceptionColumns(t, rule, canWrite ? handleDeleteException : null)}
            dataSource={exceptions ?? []}
            loading={exceptionsLoading}
            locale={{ emptyText: t('zalo.limits.exceptions.empty') }}
            onRowClick={canWrite ? (row) => setExceptionModal({ exception: row }) : undefined}
          />
          {exceptionScope && <p className={styles.note}>{t(rule.lmtScopeCd === 'SENDER' ? 'zalo.limits.exceptions.accountSender' : 'zalo.limits.exceptions.accountRecipient')}</p>}
        </>
      )}

      {tab === 'history' && (
        <>
          <ZaloChangeHistoryTable rows={history ?? []} loading={historyLoading} />
          <p className={styles.note}>{t('zalo.limits.detail.historyNote')}</p>
        </>
      )}

      {exceptionModal && (
        <ZaloLimitExceptionModal
          rule={rule}
          exception={exceptionModal.exception}
          onClose={() => setExceptionModal(null)}
        />
      )}
    </ZaloDetailPanel>
  );
}
