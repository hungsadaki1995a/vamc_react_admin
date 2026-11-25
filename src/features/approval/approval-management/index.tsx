import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import DataTable from '@/components/common/table/DataTable';
import AppSelect from '@/components/inputs/AppSelect';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { useNotify } from '@/hooks/use-notify';
import { APPROVAL_STAGE_LABELS, APPROVAL_STEP_LABELS, approvalStageOf } from '@/api/common/approval-api';
import type { ApprovalInboxItem, ApprovalInboxKind, ApprovalInboxSummary } from '@/api/common/approval-api';
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

type KindChip = { key: ApprovalInboxKind | 'all' | 'other'; label: string; count: (s?: ApprovalInboxSummary) => number };

const KIND_CHIPS: KindChip[] = [
  { key: 'all', label: 'All', count: (s) => s?.total ?? 0 },
  { key: 'member', label: 'Member', count: (s) => s?.member ?? 0 },
  { key: 'sale', label: 'Sale', count: (s) => s?.sale ?? 0 },
  { key: 'purchase', label: 'Purchase', count: (s) => s?.purchase ?? 0 },
  { key: 'consulting', label: 'Consulting', count: (s) => s?.consulting ?? 0 },
  // No inbox filter exists for other processes (auctions, …): count only.
  { key: 'other', label: 'Other', count: (s) => s?.other ?? 0 },
];

const KIND_LABELS: Record<string, string> = {
  MEMBER: 'Member',
  SALE: 'Sale',
  PURCHASE: 'Purchase',
  CONSULTING: 'Consulting',
  OTHER: 'Other',
};

const TRADE_PREFIXES = [
  { prefix: 'PROC_DSPSL_MDT', label: 'Sale' },
  { prefix: 'PROC_PUR_MDT', label: 'Purchase' },
  { prefix: 'PROC_CNSLT', label: 'Consulting' },
];
const TRADE_STAGES = ['RCPT', 'CTRT', 'SIGN', 'ANX', 'END', 'END_SIGN'] as const;

/** Process filter options: every trade stage per kind, the consulting report, the member sign-up. */
const PROCESS_OPTIONS = [
  { value: '', label: 'All processes' },
  ...TRADE_PREFIXES.flatMap(({ prefix, label }) =>
    TRADE_STAGES.filter((stage) => !(prefix === 'PROC_CNSLT' && stage === 'ANX')).map((stage) => ({
      value: `${prefix}_${stage}`,
      label: `${label} · ${APPROVAL_STAGE_LABELS[stage]}`,
    })),
  ),
  { value: 'PROC_CNSLT_RPTP', label: `Consulting · ${APPROVAL_STAGE_LABELS.RPTP}` },
  { value: 'PROC_MBR_JOIN', label: 'Member · Sign-up' },
];

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
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: 'Kind', dataIndex: 'processKind', width: 100, align: 'center', render: (v?: string) => (v && KIND_LABELS[v]) || v || '-' },
    {
      title: 'Approval Stage',
      dataIndex: 'atrzProcCd',
      width: 200,
      render: (v: string, r) => (
        <span title={v}>{r.atrzProcNm || APPROVAL_STAGE_LABELS[approvalStageOf(v)]}</span>
      ),
    },
    { title: 'Step', dataIndex: 'stpNm', width: 110, align: 'center', render: (v?: string) => (v && APPROVAL_STEP_LABELS[v]) || v || '-' },
    { title: 'Target', key: 'target', width: 260, render: (_v, r) => targetOf(r) },
    { title: 'Requester', dataIndex: 'requesterEmpNm', width: 180, render: (v?: string, r?: ApprovalInboxItem) => v || r?.requesterEmpNo || '-' },
    { title: 'Requested At', dataIndex: 'requestedAt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: 'Assigned At', dataIndex: 'assignedAt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      align: 'center',
      fixed: 'right',
      render: (_v, item) => {
        const canDecide = canWriteMenu(item.menuCd);
        return (
          <span className={styles.rowActions}>
            <ActionButton size="small" intent="quaternary" appearance="outlined" onClick={() => setPopup({ kind: 'info', item })}>
              Info
            </ActionButton>
            {canDecide && (
              <ActionButton size="small" intent="primary" appearance="filled" onClick={() => setPopup({ kind: 'approve', item })}>
                Approve
              </ActionButton>
            )}
            {canDecide && (
              <ActionButton size="small" intent="danger" appearance="outlined" onClick={() => setPopup({ kind: 'reject', item })}>
                Reject
              </ActionButton>
            )}
            <ActionButton size="small" intent="text" onClick={() => handleOpen(item)}>
              Open
            </ActionButton>
          </span>
        );
      },
    },
  ];

  return (
    <div className={pageStyles.container}>
      <SysPageHeader
        breadcrumb={['Approval Management']}
        title="Approval Management"
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
            <span className={pageStyles.filterLabel}>Approval Process</span>
            <AppSelect className={styles.processSelect} value={procDraft} options={PROCESS_OPTIONS} onChange={(v) => setProcDraft(String(v ?? ''))} />
          </div>
        </div>
      )}
      <div className={styles.chips} role="tablist" aria-label="Process kind">
        {KIND_CHIPS.map((chip) => {
          const selectable = chip.key !== 'other';
          const active = chip.key === kind;
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={styles.chip}
              data-active={active || undefined}
              disabled={!selectable}
              onClick={() => selectable && selectKind(chip.key as ApprovalInboxKind | 'all')}
            >
              {chip.label}
              <span className={styles.chipCount}>{chip.count(summary)}</span>
            </button>
          );
        })}
      </div>
      <div className={pageStyles.summaryRow}>
        <span className={pageStyles.totalCount}>Total ({total})</span>
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
          details={[{ label: 'Requested By', value: popup.item.requesterEmpNm || popup.item.requesterEmpNo || '-' }]}
          onClose={() => setPopup(null)}
        />
      )}
      {(popup?.kind === 'approve' || popup?.kind === 'reject') && (
        <ApprovalDecisionPopup
          atrzHstryId={popup.item.atrzHstryId}
          mode={popup.kind}
          target={targetOf(popup.item)}
          details={[{ label: 'Kind', value: (popup.item.processKind && KIND_LABELS[popup.item.processKind]) || '-' }]}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
