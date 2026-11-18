import { useState, type CSSProperties } from 'react';
import { Input, Modal, Radio, Table, Tabs } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  executeBatchJob,
  getBatchHistory,
  getBatchJobs,
  updateBatchSchedule,
  type BatchHistoryItem,
  type BatchJobItem,
} from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, FormField, SysPageHeader, SysPagination } from '@/features/system/_shared/system-ui';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;

/** Batch Management (menu A06040400). */
export default function BatchManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'jobs' | 'history'>('jobs');
  const [keyword, setKeyword] = useState('');
  const [histPage, setHistPage] = useState(1);
  const [schedModal, setSchedModal] = useState<BatchJobItem | null>(null);

  const { data: jobsData, isFetching: jobsLoading, refetch: refetchJobs } = useApiQuery<PageResponse<BatchJobItem>>(
    ['sys', 'batch', 'jobs'],
    () => getBatchJobs(1, 100),
    { placeholderData: keepPreviousData },
  );

  const { data: histData, isFetching: histLoading, refetch: refetchHist } = useApiQuery<PageResponse<BatchHistoryItem>>(
    ['sys', 'batch', 'history', histPage],
    () => getBatchHistory(histPage, PAGE_SIZE),
    { enabled: tab === 'history', placeholderData: keepPreviousData },
  );

  const jobs = (jobsData?.content ?? []).filter((j) =>
    !keyword.trim() || j.btchJobNm.toLowerCase().includes(keyword.trim().toLowerCase()),
  );
  const histories = histData?.content ?? [];
  const histTotal = histData?.totalElements ?? 0;

  const handleExecute = (jobName: string) => {
    dialog.warning({
      okCancel: true,
      content: `Execute batch job "${jobName}" now?`,
      onOk: async () => {
        try {
          await executeBatchJob(jobName);
          toast.success(`Executed ${jobName}.`);
          void queryClient.invalidateQueries({ queryKey: ['sys', 'batch'] });
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const jobColumns: TableColumnsType<BatchJobItem> = [
    { title: 'Job Name', dataIndex: 'btchJobNm', width: 220 },
    { title: 'Group', dataIndex: 'btchGroup', width: 130, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Description', dataIndex: 'jobExpln', render: (v?: string) => v || '-' },
    { title: 'Cron', dataIndex: 'cronExpression', width: 140, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Scheduled',
      dataIndex: 'scheduleVtlzYn',
      width: 90,
      align: 'center',
      render: (v?: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v ?? 'N'}</span>,
    },
    { title: 'Last Run', dataIndex: 'lastExcnAt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    {
      title: 'Actions',
      key: 'act',
      width: 160,
      align: 'center',
      render: (_v, row) => (
        <div className={styles.actions} style={{ justifyContent: 'center' }}>
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => setSchedModal(row)}>Schedule</button>
          <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => handleExecute(row.btchJobNm)}>Run</button>
        </div>
      ),
    },
  ];

  const histColumns: TableColumnsType<BatchHistoryItem> = [
    { title: 'Job Name', dataIndex: 'btchJobNm', width: 200 },
    { title: 'Status', dataIndex: 'btchStts', width: 110, align: 'center' },
    { title: 'Trigger', dataIndex: 'trgrType', width: 100, align: 'center' },
    { title: 'Total', dataIndex: 'tprcsNocs', width: 70, align: 'right' },
    { title: 'Success', dataIndex: 'scsNocs', width: 70, align: 'right' },
    { title: 'Fail', dataIndex: 'failNocs', width: 70, align: 'right' },
    { title: 'Started At', dataIndex: 'bgngDt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    { title: 'Ended At', dataIndex: 'endDt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'System Management', 'Batch Management']}
        title="Batch Management"
        onReset={() => setKeyword('')}
        onSearch={() => (tab === 'jobs' ? void refetchJobs() : void refetchHist())}
      />

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as 'jobs' | 'history')}
        items={[
          {
            key: 'jobs',
            label: 'Batch Jobs',
            children: (
              <>
                <div className={styles.filterCard} style={{ marginBottom: 12 }}>
                  <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Job Name</span>
                    <Input className={styles.filterInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
                  </div>
                </div>
                <div className={styles.tableWrapper}>
                  <Table<BatchJobItem> rowKey="btchJobNm" columns={jobColumns} dataSource={jobs} loading={jobsLoading} pagination={false} size="small" scroll={{ x: 'max-content' }} />
                </div>
              </>
            ),
          },
          {
            key: 'history',
            label: 'Execution History',
            children: (
              <>
                <div className={styles.tableWrapper}>
                  <Table<BatchHistoryItem> rowKey="btchHstryId" columns={histColumns} dataSource={histories} loading={histLoading} pagination={false} size="small" scroll={{ x: 'max-content' }} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <SysPagination page={histPage} pageSize={PAGE_SIZE} total={histTotal} onChange={setHistPage} />
                </div>
              </>
            ),
          },
        ]}
      />

      {schedModal && (
        <ScheduleModal
          job={schedModal}
          canWrite={canWrite}
          onClose={() => setSchedModal(null)}
          onSaved={() => void queryClient.invalidateQueries({ queryKey: ['sys', 'batch', 'jobs'] })}
        />
      )}
    </div>
  );
}

function ScheduleModal({ job, canWrite, onClose, onSaved }: { job: BatchJobItem; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useNotify();
  const [cron, setCron] = useState(job.cronExpression ?? '');
  const [enabled, setEnabled] = useState<'Y' | 'N'>(job.scheduleVtlzYn ?? 'N');

  const handleSave = async () => {
    try {
      await updateBatchSchedule(job.btchJobNm, cron.trim(), enabled);
      toast.success('Schedule updated.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={`Schedule: ${job.btchJobNm}`} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Cron Expression" span="full"><Input value={cron} placeholder="0 0 * * * *" onChange={(e) => setCron(e.target.value)} /></FormField>
        <FormField label="Active" span="full"><Radio.Group value={enabled} onChange={(e) => setEnabled(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}
