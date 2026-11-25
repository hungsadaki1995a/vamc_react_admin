import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import AppSwitch from '@/components/inputs/AppSwitch';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { ApprovalProcessItem, ApprovalProcessSearch } from '@/api/system/approval-process-api';
import {
  DateTimeText,
  SysButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/features/system/_shared/SysListUi';
import { SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { APPROVAL_PROCESS_MESSAGES } from './approval-process-constants';
import { ApprovalProcessModal } from './ApprovalProcessModal';
import { useApprovalProcesses, useUpdateApprovalProcessStatus } from './use-approval-processes';
import styles from './approval-process-management.module.scss';

// Approval Process Management (menu A09040500): approval processes and their ordered steps / roles.

const INITIAL_FILTER: ApprovalProcessSearch = { keyword: '', useYn: '' };

export default function ApprovalProcessManagement() {
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const list = usePagedList<ApprovalProcessSearch>(INITIAL_FILTER);
  // undefined = closed, null = register, string = row opened.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const { data, isFetching } = useApprovalProcesses(list.applied, list.pageQuery);
  const updateStatus = useUpdateApprovalProcessStatus();

  const changeStatus = (row: ApprovalProcessItem, active: boolean) => {
    const apply = async () => {
      try {
        await updateStatus.mutateAsync({ atrzProcId: row.atrzProcId, useYn: active ? 'Y' : 'N' });
        toast.success(SYS_MESSAGES.updated);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    };
    if (active) {
      void apply();
      return;
    }
    confirm({ content: APPROVAL_PROCESS_MESSAGES.confirmDeactivate, okText: 'Deactivate', onOk: apply });
  };

  const columns: TableColumnsType<ApprovalProcessItem> = [
    { title: 'Process Code', dataIndex: 'atrzProcCd' },
    { title: 'Process Name', dataIndex: 'atrzProcNm' },
    { title: 'Steps', dataIndex: 'stepCount', align: 'center', render: (v?: number) => v ?? '-' },
    {
      title: 'Use',
      dataIndex: 'useYn',
      align: 'center',
      render: (v: string, row) => (
        // The switch toggles the status in place; the click must not open the row
        <span onClick={(e) => e.stopPropagation()}>
          <AppSwitch
            checked={v === 'Y'}
            disabled={!canWrite || updateStatus.isPending}
            onChange={(checked) => changeStatus(row, checked)}
          />
        </span>
      ),
    },
    { title: 'Registered By', dataIndex: 'crtBy', align: 'center', render: (v?: string) => v || '-' },
    { title: 'Registered Date', dataIndex: 'crtDt', align: 'center', render: (v?: string) => <DateTimeText value={v} dateOnly /> },
    { title: 'Modified Date', dataIndex: 'mdfcnDt', align: 'center', render: (v?: string) => <DateTimeText value={v} dateOnly /> },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="Approval Process Management"
        breadcrumb={['System Operation Management', 'System Management', 'Approval Process Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Code / Name">
          <TextInput
            placeholder="Process code or name"
            value={list.draft.keyword}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Use">
          <AppSelect options={USE_YN_FILTER_OPTIONS} value={list.draft.useYn} onChange={(useYn) => list.setDraft({ useYn })} />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      <SysSectionHeader
        total={data?.totalElements ?? 0}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setOpenId(null)}>
              New
            </SysButton>
          )
        }
      />
      <div className={styles.listBody}>
        <SysTable<ApprovalProcessItem>
          fill
          rowKey="atrzProcId"
          columns={columns}
          dataSource={data?.content}
          loading={isFetching}
          onRowClick={(row) => setOpenId(row.atrzProcId)}
        />
        <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />
      </div>

      {openId !== undefined && (
        <ApprovalProcessModal key={openId ?? 'new'} atrzProcId={openId} canWrite={canWrite} onClose={() => setOpenId(undefined)} />
      )}
    </SysPage>
  );
}
