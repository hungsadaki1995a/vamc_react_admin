import { useMemo, useState } from 'react';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { BatchHistoryItem } from '@/api/system/batch-api';
import { SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { SYS_DIALOG_LABELS } from '@/features/system/_shared/sys-messages';
import { DateTimeText, ResultBadge, SysButton, SysPager, SysTable, UseBadge } from '@/features/system/_shared/sys-list-ui';
import { SysField, SysFieldGrid, SysFormModal, SysFormSection } from '@/features/system/_shared/sys-form-ui';
import { rowNumber } from '@/features/system/_shared/system-utils';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { BATCH_MESSAGES, formatDuration, runErrorMessage, toResult } from './batch-utils';
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
      align: 'center',
      render: (_value, _row, index) => rowNumber(total, page, SYS_PAGE_SIZE, index),
    },
    {
      title: 'Run At',
      dataIndex: 'bgngDt',
      width: 170,
      align: 'center',
      render: (value?: string) => <DateTimeText value={value} seconds />,
    },
    {
      title: 'Result',
      dataIndex: 'btchStts',
      width: 100,
      align: 'center',
      render: (value?: string) => <ResultBadge value={toResult(value)} />,
    },
    {
      title: 'Processed',
      dataIndex: 'tprcsNocs',
      width: 100,
      align: 'right',
      render: (value?: number) => (value === undefined || value === null ? '-' : value.toLocaleString('en-US')),
    },
    {
      title: 'Duration',
      dataIndex: 'prgrsHr',
      width: 110,
      align: 'center',
      render: (value?: number) => formatDuration(value),
    },
    {
      title: 'Error',
      dataIndex: 'errMsg',
      render: (value: string | undefined, row) =>
        row.btchStts === 'FAILED' && value ? <span className={styles.errorText}>{value}</span> : '-',
    },
    ...(allowRerun
      ? [
          {
            title: 'Rerun',
            key: 'rerun',
            width: 90,
            align: 'center' as const,
            render: (_value: unknown, row: BatchHistoryItem) =>
              row.btchStts === 'FAILED' ? (
                <SysButton size="small" loading={execute.isPending} onClick={rerun}>
                  Rerun
                </SysButton>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <SysFormModal open title="Batch Execution History" onCancel={onClose} width={1080}>
      <SysFormSection title="Job Information">
        <SysFieldGrid columns={2}>
          <SysField label="Job Name">{jobName}</SysField>
          <SysField label="Group">{job?.btchGroup ?? '-'}</SysField>
          <SysField label="Cron">{job?.cronExpression || '-'}</SysField>
          <SysField label="Use">{job ? <UseBadge value={job.scheduleVtlzYn} /> : '-'}</SysField>
        </SysFieldGrid>
      </SysFormSection>
      <SysFormSection title="Execution History">
        <SysTable<BatchHistoryItem>
          rowKey="btchHstryId"
          columns={columns}
          dataSource={data?.content}
          loading={isFetching && !data}
          className={styles.historyTable}
        />
        <SysPager page={page} pageSize={SYS_PAGE_SIZE} total={total} onChange={setPage} />
      </SysFormSection>
    </SysFormModal>
  );
}
