import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import DataTable from '@/components/common/table/DataTable';
import AppSelect from '@/components/inputs/AppSelect';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { useNotify } from '@/hooks/use-notify';
import { approvalStageOf } from '@/api/common/approval-api';
import type { ApprovalInboxItem, ApprovalInboxKind, ApprovalInboxSummary } from '@/api/common/approval-api';
import { codeLabel } from '@/lib/i18n/code-label';
import { formatDateTime } from '@/utils/date-format';
import { rowNumber } from '@/utils/system-utils';
import pageStyles from '@/components/common/sys-ui/system-page.module.scss';
import ApprovalDecisionPopup from '../_shared/ApprovalDecisionPopup';
import type { ApprovalDecision } from '../_shared/ApprovalDecisionPopup';
import ApprovalInfoPopup from '../_shared/ApprovalInfoPopup';
import { useApprovalInbox, useApprovalInboxSummary, useMenuWriteCheck, useOpenApprovalTarget } from './use-approval-inbox';
import styles from './approval-management.module.scss';

// Approval Management (VPA10000001, menu A10000000). The screen design has no page for it (Q-U1); built from the
// plan proposal: chips per process kind from the inbox summary, process filter, the items waiting for the signed-in
// employee, and per row [Info] / [Approve] / [Reject] in place plus [Open] to the screen that owns the target.
// Decided items leave the inbox; their history is shown by the approval information popup.

const PAGE_SIZE = 15;

type KindChip = { key: ApprovalInboxKind | 'all'; count: (s?: ApprovalInboxSummary) => number };

/** Chip labels: `approval.inbox.kinds.<key>`. */
const KIND_CHIPS: KindChip[] = [
  { key: 'all', count: (s) => s?.total ?? 0 },
  { key: 'member', count: (s) => s?.member ?? 0 },
  { key: 'sale', count: (s) => s?.sale ?? 0 },
  { key: 'purchase', count: (s) => s?.purchase ?? 0 },
  { key: 'consulting', count: (s) => s?.consulting ?? 0 },
  // Every other process (auction publication, …).
  { key: 'other', count: (s) => s?.other ?? 0 },
];

const TRADE_PREFIXES = [
  { prefix: 'PROC_DSPSL_MDT', kind: 'sale' },
  { prefix: 'PROC_PUR_MDT', kind: 'purchase' },
  { prefix: 'PROC_CNSLT', kind: 'consulting' },
] as const;
const TRADE_STAGES = ['RCPT', 'CTRT', 'SIGN', 'ANX', 'END', 'END_SIGN'] as const;

/** Process filter options: every trade stage per kind, the consulting report, the member sign-up. */
function processOptions(t: TFunction) {
  const option = (kind: (typeof TRADE_PREFIXES)[number]['kind'], stage: string) =>
    t('approval.inbox.processOption', { kind: t(`approval.inbox.kinds.${kind}`), stage: codeLabel('approval.stages', stage) });
  return [
    { value: '', label: t('approval.inbox.allProcesses') },
    ...TRADE_PREFIXES.flatMap(({ prefix, kind }) =>
      TRADE_STAGES.filter((stage) => !(prefix === 'PROC_CNSLT' && stage === 'ANX')).map((stage) => ({
        value: `${prefix}_${stage}`,
        label: option(kind, stage),
      })),
    ),
    { value: 'PROC_CNSLT_RPTP', label: option('consulting', 'RPTP') },
    { value: 'PROC_MBR_JOIN', label: t('approval.inbox.memberSignup') },
  ];
}

/** Label of the server's process kind (MEMBER, SALE, …); an unknown kind is shown as sent. */
function kindLabel(processKind?: string): string {
  const code = processKind?.toLowerCase();
  const label = codeLabel('approval.inbox.kinds', code);
  return label === code ? (processKind ?? '-') : label;
}

type PopupState = { kind: 'info'; item: ApprovalInboxItem } | { kind: ApprovalDecision; item: ApprovalInboxItem } | null;

function targetOf(item: ApprovalInboxItem): string {
  // Readable numbers first; the UUID keys only while the server sends no number.
  return item.srvcCtrtNo || item.srvcAplyNo || item.srvcAplyId || item.srvcCtrtCd || item.mbrNo || item.atrzTrgtId || '-';
}

export default function ApprovalManagement() {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const [kind, setKind] = useState<ApprovalInboxKind | 'all'>('all');
  const [procDraft, setProcDraft] = useState('');
  const [atrzProcCd, setAtrzProcCd] = useState('');
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [popup, setPopup] = useState<PopupState>(null);

  const search = { kind: kind === 'all' ? undefined : kind, atrzProcCd: atrzProcCd || undefined };
  const { data, isFetching } = useApprovalInbox(search, { page, size: PAGE_SIZE });
  const { data: summary } = useApprovalInboxSummary();
  const canWriteMenu = useMenuWriteCheck();
  const openTarget = useOpenApprovalTarget();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const selectKind = (next: ApprovalInboxKind | 'all') => {
    setKind(next);
    setPage(1);
  };

  const handleOpen = (item: ApprovalInboxItem) => {
    if (!openTarget(item)) toast.warning(t('messages.approval.noScreen'));
  };

  const columns: TableColumnsType<ApprovalInboxItem> = [
    { title: t('approval.fields.rowNo'), key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: t('approval.inbox.kind'), dataIndex: 'processKind', width: 100, align: 'center', render: (v?: string) => kindLabel(v) },
    {
      title: t('approval.fields.approvalStage'),
      dataIndex: 'atrzProcCd',
      width: 200,
      render: (v: string, r) => (
        <span title={v}>{r.atrzProcNm || codeLabel('approval.stages', approvalStageOf(v))}</span>
      ),
    },
    { title: t('approval.fields.step'), dataIndex: 'stpNm', width: 110, align: 'center', render: (v?: string) => codeLabel('approval.steps', v) },
    { title: t('approval.inbox.target'), key: 'target', width: 260, render: (_v, r) => targetOf(r) },
    // Who decided the previous step and so sent the item to this step.
    { title: t('approval.inbox.requestedBy'), dataIndex: 'requesterEmpNm', width: 180, render: (v?: string, r?: ApprovalInboxItem) => v || r?.requesterEmpNo || '-' },
    { title: t('approval.inbox.requestedAt'), dataIndex: 'requestedAt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: t('approval.inbox.assignedAt'), dataIndex: 'assignedAt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    {
      title: t('approval.inbox.actions'),
      key: 'actions',
      width: 300,
      align: 'center',
      fixed: 'right',
      render: (_v, item) => {
        const canDecide = canWriteMenu(item.menuCd);
        return (
          <span className={styles.rowActions}>
            <ActionButton size="small" intent="quaternary" appearance="outlined" onClick={() => setPopup({ kind: 'info', item })}>
              {t('approval.inbox.info')}
            </ActionButton>
            {canDecide && (
              <ActionButton size="small" intent="primary" appearance="filled" onClick={() => setPopup({ kind: 'approve', item })}>
                {t('approval.decision.approve')}
              </ActionButton>
            )}
            {canDecide && (
              <ActionButton size="small" intent="danger" appearance="outlined" onClick={() => setPopup({ kind: 'reject', item })}>
                {t('approval.decision.reject')}
              </ActionButton>
            )}
            <ActionButton size="small" intent="text" onClick={() => handleOpen(item)}>
              {t('approval.inbox.open')}
            </ActionButton>
          </span>
        );
      },
    },
  ];

  return (
    <div className={pageStyles.container}>
      <SysPageHeader
        breadcrumb={[t('approval.inbox.title')]}
        title={t('approval.inbox.title')}
        onReset={() => {
          setProcDraft('');
          setAtrzProcCd('');
          selectKind('all');
        }}
        onSearch={() => {
          setAtrzProcCd(procDraft);
          setPage(1);
        }}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={pageStyles.filterCard}>
          <div className={pageStyles.filterGroup}>
            <span className={pageStyles.filterLabel}>{t('approval.inbox.process')}</span>
            <AppSelect className={styles.processSelect} value={procDraft} options={processOptions(t)} onChange={(v) => setProcDraft(String(v ?? ''))} />
          </div>
        </div>
      )}
      <div className={styles.chips} role="tablist" aria-label={t('approval.inbox.processKind')}>
        {KIND_CHIPS.map((chip) => {
          const active = chip.key === kind;
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={styles.chip}
              data-active={active || undefined}
              onClick={() => selectKind(chip.key)}
            >
              {t(`approval.inbox.kinds.${chip.key}`)}
              <span className={styles.chipCount}>{chip.count(summary)}</span>
            </button>
          );
        })}
      </div>
      <div className={pageStyles.summaryRow}>
        <span className={pageStyles.totalCount}>{t('approval.inbox.total', { n: total })}</span>
      </div>
      <div className={pageStyles.tableWrapper}>
        <DataTable<ApprovalInboxItem>
          rowKey="atrzHstryId"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('messages.approval.noItems') }}
        />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {popup?.kind === 'info' && (
        <ApprovalInfoPopup
          atrzHstryId={popup.item.atrzHstryId}
          target={targetOf(popup.item)}
          onClose={() => setPopup(null)}
        />
      )}
      {(popup?.kind === 'approve' || popup?.kind === 'reject') && (
        <ApprovalDecisionPopup
          atrzHstryId={popup.item.atrzHstryId}
          mode={popup.kind}
          target={targetOf(popup.item)}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
