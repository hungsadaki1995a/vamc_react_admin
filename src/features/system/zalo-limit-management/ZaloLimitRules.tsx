import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import type { ZaloLimitMsgType, ZaloLimitRule, ZaloLimitRuleSearch, ZaloLimitScope } from '@/api/system/zalo-limit-api';
import {
  StatusBadge,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysSearchActions,
  SysSectionHeader,
  SysSplit,
  SysTable,
} from '@/components/common/sys-ui/SysListUi';
import { ALL, API_DATE_ISO, SYS_DATE_FORMAT } from '@/config/sys-constants';
import type { YesNo } from '@/config/sys-constants';
import { codeLabel } from '@/lib/i18n/code-label';
import { isSameQuery } from '@/utils/query-utils';
import ZaloLimitRuleDetail from './ZaloLimitRuleDetail';
import ZaloLimitRuleModal from './ZaloLimitRuleModal';
import { LIMIT_MSG_TYPES, LIMIT_SCOPES, limitText, usageLevel } from './zalo-limit-constants';
import { useDownloadZaloLimitRulesExcel, useZaloLimitRules } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - Limit Rules page: filter, rule list with peak usage on the left, Rule Details on the right.

interface RuleFilter {
  lmtScopeCd: ZaloLimitScope | '';
  zaloMsgTypeCd: ZaloLimitMsgType | '';
  useYn: YesNo | '';
  /** Rules in effect on this day; null = any. */
  efctDt: Dayjs | null;
}

const initialFilter = (): RuleFilter => ({ lmtScopeCd: ALL, zaloMsgTypeCd: ALL, useYn: ALL, efctDt: dayjs().startOf('day') });

function toSearch(filter: RuleFilter): ZaloLimitRuleSearch {
  return {
    lmtScopeCd: filter.lmtScopeCd,
    zaloMsgTypeCd: filter.zaloMsgTypeCd,
    useYn: filter.useYn,
    efctDt: filter.efctDt ? filter.efctDt.format(API_DATE_ISO) : undefined,
  };
}

/** Peak usage bar: width = percent, colour by the rule's warn threshold. */
function UsageBar({ rule }: { rule: ZaloLimitRule }) {
  return (
    <span className={styles.usage} data-level={usageLevel(rule.usedPct, rule.warnRt)}>
      <span className={styles.usageTrack}>
        <span className={styles.usageFill} style={{ '--usage-pct': `${rule.usedPct}%` } as CSSProperties} />
      </span>
      <span className={styles.usagePct}>{rule.usedPct}%</span>
    </span>
  );
}

function buildColumns(t: TFunction): TableColumnsType<ZaloLimitRule> {
  return [
    {
      title: t('zalo.limits.columns.status'),
      dataIndex: 'useYn',
      key: 'useYn',
      align: 'center',
      width: 70,
      render: (v: YesNo) => (
        <StatusBadge tone={v === 'Y' ? 'blue' : 'gray'}>{t(v === 'Y' ? 'zalo.common.active' : 'zalo.common.inactive')}</StatusBadge>
      ),
    },
    { title: t('zalo.limits.columns.code'), dataIndex: 'lmtCd', key: 'lmtCd', align: 'center', width: 76 },
    {
      title: t('zalo.limits.columns.scope'),
      dataIndex: 'lmtScopeCd',
      key: 'lmtScopeCd',
      width: 118,
      ellipsis: true,
      render: (v: ZaloLimitScope) => codeLabel('zalo.limitScopes', v),
    },
    {
      title: t('zalo.limits.columns.msgType'),
      dataIndex: 'zaloMsgTypeCd',
      key: 'zaloMsgTypeCd',
      width: 104,
      ellipsis: true,
      render: (v: ZaloLimitMsgType) => codeLabel('zalo.limitMsgTypes', v),
    },
    {
      title: t('zalo.limits.columns.period'),
      dataIndex: 'lmtPrdCd',
      key: 'lmtPrdCd',
      align: 'center',
      width: 68,
      render: (v: string) => codeLabel('zalo.limitPeriods', v),
    },
    {
      title: t('zalo.limits.columns.measure'),
      dataIndex: 'lmtMsrCd',
      key: 'lmtMsrCd',
      align: 'center',
      width: 94,
      render: (v: string) => codeLabel('zalo.limitMeasures', v),
    },
    {
      title: t('zalo.limits.columns.limit'),
      key: 'lmtVal',
      align: 'right',
      width: 92,
      render: (_: unknown, row) => limitText(row.lmtVal, row.lmtMsrCd),
    },
    { title: t('zalo.limits.columns.peak'), key: 'peak', render: (_: unknown, row) => <UsageBar rule={row} /> },
  ];
}

/** Create popup: closed, blank New (null) or Copy of a rule. */
type ModalState = { source: ZaloLimitRule | null } | null;

export default function ZaloLimitRules({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const { guardDiscard } = useSysDialogs();
  const [draft, setDraft] = useState<RuleFilter>(initialFilter);
  const [applied, setApplied] = useState<RuleFilter>(draft);
  const search = toSearch(applied);
  const { data, isFetching, refetch } = useZaloLimitRules(search);

  /** Same filter keeps the query key, so reload it explicitly (the button always searches). */
  const applyFilter = (next: RuleFilter) => {
    if (isSameQuery(toSearch(next), search)) void refetch();
    setApplied(next);
  };
  const excel = useDownloadZaloLimitRulesExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedCd, setSelectedCd] = useState<string | null>(null);
  const dirty = useRef(false);
  const rows = data ?? [];
  // The design always shows a rule: the picked row, else the first row.
  const selected = rows.find((row) => row.lmtCd === selectedCd) ?? rows[0] ?? null;
  const handleDirtyChange = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);

  /** Leaving unsaved edits of the detail panel asks first. */
  const leaveDetail = (proceed: () => void) =>
    guardDiscard(dirty.current, () => {
      dirty.current = false;
      proceed();
    });

  const patchDraft = (value: Partial<RuleFilter>) => setDraft((prev) => ({ ...prev, ...value }));
  const allOption = { value: ALL, label: t('zalo.common.all') } as const;
  const scopeOptions = [allOption, ...LIMIT_SCOPES.map((code) => ({ value: code, label: codeLabel('zalo.limitScopes', code) }))];
  const typeOptions = [allOption, ...LIMIT_MSG_TYPES.map((code) => ({ value: code, label: codeLabel('zalo.limitMsgTypes', code) }))];
  const useOptions = [
    allOption,
    { value: 'Y' as const, label: t('zalo.common.active') },
    { value: 'N' as const, label: t('zalo.common.inactive') },
  ];

  return (
    <>
      <SysFilterPanel>
        <SysFilterItem label={t('zalo.limits.filter.scope')}>
          <AppSelect<ZaloLimitScope | ''>
            value={draft.lmtScopeCd}
            options={scopeOptions}
            onChange={(lmtScopeCd) => patchDraft({ lmtScopeCd })}
          />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.limits.filter.msgType')}>
          <AppSelect<ZaloLimitMsgType | ''>
            value={draft.zaloMsgTypeCd}
            options={typeOptions}
            onChange={(zaloMsgTypeCd) => patchDraft({ zaloMsgTypeCd })}
          />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.limits.filter.status')}>
          <AppSelect<YesNo | ''> value={draft.useYn} options={useOptions} onChange={(useYn) => patchDraft({ useYn })} />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.limits.filter.effectiveOn')}>
          <AppDatePicker
            className={styles.fullWidth}
            value={draft.efctDt}
            format={SYS_DATE_FORMAT}
            placeholder="DD-MM-YYYY"
            aria-label={t('zalo.limits.filter.effectiveOn')}
            onChange={(efctDt) => patchDraft({ efctDt })}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions
        onReset={() =>
          leaveDetail(() => {
            const reset = initialFilter();
            setDraft(reset);
            applyFilter(reset);
          })
        }
        onSearch={() => leaveDetail(() => applyFilter(draft))}
        loading={isFetching}
      />
      <SysSplit
        ratio="minmax(0, 1fr) 440px"
        left={
          <div className={styles.pane}>
            <SysSectionHeader
              title={t('zalo.limits.listTitle')}
              total={rows.length}
              actions={<SysExcelButton loading={excel.isPending} onClick={() => excel.mutate(search)} />}
              primaryActions={
                canWrite && (
                  <SysButton look="navy" onClick={() => setModal({ source: null })}>
                    {t('zalo.common.new')}
                  </SysButton>
                )
              }
            />
            <SysTable<ZaloLimitRule>
              rowKey="lmtCd"
              className={styles.listTable}
              fill
              tableLayout="fixed"
              columns={buildColumns(t)}
              dataSource={rows}
              loading={isFetching}
              selectedRowKey={selected?.lmtCd}
              onRowClick={(row) => {
                if (row.lmtCd !== selected?.lmtCd) leaveDetail(() => setSelectedCd(row.lmtCd));
              }}
            />
            <p className={styles.note}>{t('zalo.limits.evaluationOrder')}</p>
          </div>
        }
        right={
          <ZaloLimitRuleDetail
            key={selected?.lmtCd ?? 'none'}
            rule={selected}
            canWrite={canWrite}
            onCopy={(rule) => setModal({ source: rule })}
            onDirtyChange={handleDirtyChange}
          />
        }
      />
      {modal && (
        <ZaloLimitRuleModal
          source={modal.source}
          onClose={() => setModal(null)}
          onCreated={(lmtCd) => leaveDetail(() => setSelectedCd(lmtCd))}
        />
      )}
    </>
  );
}
