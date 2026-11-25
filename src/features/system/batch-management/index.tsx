import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { BatchJobItem, BatchJobSearch } from '@/api/system/batch-api';
import { SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/config/sys-constants';
import { SYS_DIALOG_LABELS } from '@/config/sys-messages';
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
} from '@/components/common/sys-ui/SysListUi';
import { errorMessage } from '@/utils/system-utils';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import BatchHistoryModal from './BatchHistoryModal';
import BatchJobModal from './BatchJobModal';
import { BATCH_BREADCRUMB, BATCH_MESSAGES, toResult } from './batch-utils';
import { useBatchJobs, useDownloadBatchJobs, useRefreshBatchSchedules } from './use-batch-jobs';
import styles from './batch-management.module.scss';

/** Edit popup target: `null` = closed, `'new'` = register mode. */
type EditTarget = BatchJobItem | 'new' | null;

// Fixed layout: every column keeps its width and Description ellipsizes, so all 8 columns stay visible (design).
const COLUMNS: TableColumnsType<BatchJobItem> = [
  {
    title: 'Use',
    dataIndex: 'scheduleVtlzYn',
    sorter: true,
    width: 80,
    align: 'center',
    render: (value: boolean) => <UseBadge value={value} />,
  },
  { title: 'Job Name', dataIndex: 'btchJobNm', sorter: true, width: 200, ellipsis: true },
  { title: 'Group', dataIndex: 'btchGroup', sorter: true, width: 110, ellipsis: true },
  { title: 'Description', dataIndex: 'jobExpln', sorter: true, ellipsis: true },
  {
    title: 'Cron',
    dataIndex: 'cronExpression',
    sorter: true,
    width: 130,
    ellipsis: true,
    render: (value?: string) => value || '-',
  },
  {
    title: 'Last Run',
    dataIndex: 'lastExcnAt',
    sorter: true,
    width: 160,
    render: (value?: string) => <DateTimeText value={value} seconds />,
  },
  {
    title: 'Latest Result',
    dataIndex: 'lastBtchStts',
    sorter: true,
    width: 120,
    align: 'center',
    render: (value?: string) => <ResultBadge value={toResult(value)} />,
  },
  {
    title: 'Modified Date',
    key: 'mdfcnDt',
    sorter: true,
    width: 160,
    render: (_value, row) => <DateTimeText value={row.mdfcnDt ?? row.crtDt} seconds />,
  },
];

/** Batch Management - List (VPA09040401, menu A09040400). */
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
    <SysPage fill>
      <SysTitleBar title="Batch Management" breadcrumb={BATCH_BREADCRUMB} />
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <AppSelect
            options={USE_YN_FILTER_OPTIONS}
            value={list.draft.useYn}
            onChange={(useYn) => list.setDraft({ useYn: (useYn ?? '') as BatchJobSearch['useYn'] })}
          />
        </SysFilterItem>
        <SysFilterItem label="Group">
          <TextInput
            value={list.draft.btchGroup}
            maxLength={50}
            allowClear
            onChange={(e) => list.setDraft({ btchGroup: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Job Name">
          <TextInput
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
      <div className={styles.listBody}>
        <SysTable<BatchJobItem>
          fill
          tableLayout="fixed"
          rowKey="btchJobNm"
          columns={COLUMNS}
          dataSource={data?.content}
          loading={isFetching && !data}
          onRowClick={setEditTarget}
          sort={list.sort}
          onSortChange={list.setSort}
        />
        <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      </div>

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
