import { useMemo, useState } from 'react';
import { Button } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { BatchHistoryItem } from '@/api/system/batch-api';
import { SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { SYS_DIALOG_LABELS } from '@/features/system/_shared/sys-messages';
import { DateTimeText, ResultBadge, SysPager, SysTable, UseBadge } from '@/features/system/_shared/SysListUi';
import { SysFormModal } from '@/features/system/_shared/SysFormUi';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { BATCH_MESSAGES, formatCount, formatDuration, runErrorMessage, toResult } from './batch-utils';
import { useBatchHistory, useBatchJob, useExecuteBatchJob } from './use-batch-jobs';
import styles from './batch-management.module.scss';

interface BatchHistoryModalProps {
  jobName: string;
  onClose: () => void;
  /** Shows [Rerun] on failed rows; off when opened from Exchange Rate (execute needs Batch write permission). */
  allowRerun?: boolean;
}

/** Batch Management - Execution History (VPA090404P02), read-only. Mount with `key={jobName}`. */
export default function BatchHistoryModal({ jobName, onClose, allowRerun = false }: BatchHistoryModalProps) {
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const [page, setPage] = useState(1);
  const pageQuery = useMemo(() => ({ page, size: SYS_PAGE_SIZE }), [page]);

  const { data: job } = useBatchJob(jobName);
  const { data, isFetching } = useBatchHistory(jobName, pageQuery);
  const execute = useExecuteBatchJob();
  const total = data?.totalElements ?? 0;

  const rerun = () =>
    confirm({
      content: BATCH_MESSAGES.confirmRerun,
      okText: SYS_DIALOG_LABELS.rerun,
      onOk: async () => {
        try {
          await execute.mutateAsync(jobName);
          toast.success(BATCH_MESSAGES.runStarted(jobName));
          setPage(1);
        } catch (error) {
          toast.error(runErrorMessage(error));
        }
      },
    });

  const columns: TableColumnsType<BatchHistoryItem> = [
    {
      title: 'No',
      key: 'no',
      width: 70,
      // Newest first, numbered from 1 as in the design.
      render: (_value, _row, index) => (page - 1) * SYS_PAGE_SIZE + index + 1,
    },
    {
      title: 'Run At',
      dataIndex: 'bgngDt',
      width: 170,
      render: (value?: string) => <DateTimeText value={value} seconds />,
    },
    {
      title: 'Result',
      dataIndex: 'btchStts',
      width: 90,
      align: 'center',
      render: (value?: string) => <ResultBadge value={toResult(value)} />,
    },
    {
      title: 'Processed',
      dataIndex: 'tprcsNocs',
      width: 100,
      render: (value?: number) => formatCount(value),
    },
    {
      title: 'Duration',
      dataIndex: 'prgrsHr',
      width: 120,
      render: (value?: number) => formatDuration(value),
    },
    {
      title: 'Error',
      dataIndex: 'errMsg',
      render: (value: string | undefined, row) =>
        row.btchStts === 'FAILED' && value ? <span className={styles.errorText}>{value}</span> : '-',
    },
    {
      title: 'Rerun',
      key: 'rerun',
      width: 90,
      render: (_value, row) =>
        // Rerun needs Batch write permission; from Exchange Rate the column shows '-'.
        allowRerun && row.btchStts === 'FAILED' ? (
          <Button type="link" size="small" className={styles.linkButton} disabled={execute.isPending} onClick={rerun}>
            Rerun
          </Button>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <SysFormModal open title="Batch Execution History" onCancel={onClose} width={1080}>
      <div className={styles.jobInfo}>
        <span className={styles.jobInfoItem}>
          <span className={styles.jobInfoLabel}>Job Name</span>
          {jobName}
        </span>
        <span className={styles.jobInfoItem}>
          <span className={styles.jobInfoLabel}>Group</span>
          {job?.btchGroup ?? '-'}
        </span>
        <span className={styles.jobInfoItem}>
          <span className={styles.jobInfoLabel}>Cron</span>
          {job?.cronExpression || '-'}
        </span>
        <span className={styles.jobInfoItem}>
          <span className={styles.jobInfoLabel}>Use</span>
          {job ? <UseBadge value={job.scheduleVtlzYn} /> : '-'}
        </span>
      </div>
      <SysTable<BatchHistoryItem>
        rowKey="btchHstryId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching && !data}
        className={styles.historyTable}
      />
      <SysPager page={page} pageSize={SYS_PAGE_SIZE} total={total} onChange={setPage} />
    </SysFormModal>
  );
}
