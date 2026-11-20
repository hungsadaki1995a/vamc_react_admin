import { useState } from 'react';
import { Input, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { BatchJobItem, BatchJobSearch } from '@/api/system/batch-api';
import { SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_DIALOG_LABELS } from '@/features/system/_shared/sys-messages';
import {
  DateTimeText,
  ResultBadge,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '@/features/system/_shared/SysListUi';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import BatchHistoryModal from './BatchHistoryModal';
import BatchJobModal from './BatchJobModal';
import { BATCH_BREADCRUMB, BATCH_MESSAGES, toResult } from './batch-utils';
import { useBatchJobs, useDownloadBatchJobs, useRefreshBatchSchedules } from './use-batch-jobs';
import styles from './batch-management.module.scss';

/** Edit popup target: `null` = closed, `'new'` = register mode. */
type EditTarget = BatchJobItem | 'new' | null;

const COLUMNS: TableColumnsType<BatchJobItem> = [
  {
    title: 'Use',
    dataIndex: 'scheduleVtlzYn',
    width: 90,
    align: 'center',
    render: (value: boolean) => <UseBadge value={value} />,
  },
  { title: 'Job Name', dataIndex: 'btchJobNm', width: 220 },
  { title: 'Group', dataIndex: 'btchGroup', width: 120 },
  // Width bounds the cell so the ellipsis works inside the max-content scroll table.
  { title: 'Description', dataIndex: 'jobExpln', width: 320, ellipsis: true },
  { title: 'Cron', dataIndex: 'cronExpression', width: 150, render: (value?: string) => value || '-' },
  {
    title: 'Last Run',
    dataIndex: 'lastExcnAt',
    width: 170,
    align: 'center',
    render: (value?: string) => <DateTimeText value={value} seconds />,
  },
  {
    title: 'Latest Result',
    dataIndex: 'lastBtchStts',
    width: 120,
    align: 'center',
    render: (value?: string) => <ResultBadge value={toResult(value)} />,
  },
  {
    title: 'Modified Date',
    key: 'mdfcnDt',
    width: 170,
    align: 'center',
    render: (_value, row) => <DateTimeText value={row.mdfcnDt ?? row.crtDt} seconds />,
  },
];

/** Batch Management - List (VPA09040401, menu A06040400). */
export default function BatchManagement() {
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const { canWrite } = useMenuPermission();

  const list = usePagedList<BatchJobSearch>({ useYn: '', btchGroup: '', btchJobNm: '' });
  const { data, isFetching } = useBatchJobs(list.applied, list.pageQuery);
  const download = useDownloadBatchJobs();
  const refresh = useRefreshBatchSchedules();

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [historyJob, setHistoryJob] = useState<string | null>(null);

  const refreshSchedule = () =>
    confirm({
      content: BATCH_MESSAGES.confirmRefresh,
      okText: SYS_DIALOG_LABELS.apply,
      onOk: async () => {
        try {
          await refresh.mutateAsync();
          toast.success(BATCH_MESSAGES.refreshed);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });

  const total = data?.totalElements ?? 0;

  return (
    <SysPage>
      <SysTitleBar title="Batch Management" breadcrumb={BATCH_BREADCRUMB} />
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <Select
            options={USE_YN_FILTER_OPTIONS}
            value={list.draft.useYn}
            onChange={(useYn) => list.setDraft({ useYn })}
          />
        </SysFilterItem>
        <SysFilterItem label="Group">
          <Input
            value={list.draft.btchGroup}
            maxLength={50}
            allowClear
            onChange={(e) => list.setDraft({ btchGroup: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Job Name">
          <Input
            value={list.draft.btchJobNm}
            maxLength={100}
            allowClear
            onChange={(e) => list.setDraft({ btchJobNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <>
            {canWrite && (
              <>
                <SysButton loading={refresh.isPending} onClick={refreshSchedule}>
                  Refresh Schedule
                </SysButton>
                <span className={styles.actionDivider} />
              </>
            )}
            <SysExcelButton loading={download.isPending} onClick={() => download.mutate(list.applied)} />
          </>
        }
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setEditTarget('new')}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<BatchJobItem>
        rowKey="btchJobNm"
        columns={COLUMNS}
        dataSource={data?.content}
        loading={isFetching && !data}
        onRowClick={setEditTarget}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />

      {editTarget && (
        <BatchJobModal
          key={editTarget === 'new' ? 'edit:new' : `edit:${editTarget.btchJobNm}`}
          job={editTarget === 'new' ? undefined : editTarget}
          canWrite={canWrite}
          onClose={() => setEditTarget(null)}
          onOpenHistory={setHistoryJob}
        />
      )}
      {historyJob && (
        <BatchHistoryModal key={`history:${historyJob}`} jobName={historyJob} allowRerun={canWrite} onClose={() => setHistoryJob(null)} />
      )}
    </SysPage>
  );
}
