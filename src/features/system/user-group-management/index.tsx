import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { Role, RoleGroup, RoleUser } from '@/api/system/role-group-api';
import { SysButton, SysEmpty, SysPage, SysSectionHeader, SysTable, SysTitleBar, UseBadge } from '../_shared/sys-list-ui';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '../_shared/sys-messages';
import { useSysDialogs } from '../_shared/use-sys-dialogs';
import { errorMessage } from '../_shared/system-utils';
import RoleGroupModal from './role-group-modal';
import type { RoleGroupModalTarget } from './role-group-modal';
import StaffSearchModal from './staff-search-modal';
import { useRoleAssignees, useRoleGroups, useRoles, useSaveRoleAssignees } from './use-role-groups';
import styles from './user-group-management.module.scss';

// User Group Management - List (VPA09020301): User Group → Group Roles → Role Staff.

export default function UserGroupManagement() {
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const { canWrite } = useMenuPermission();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [staffKeys, setStaffKeys] = useState<string[]>([]);
  const [modal, setModal] = useState<RoleGroupModalTarget | null>(null);
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);

  const groups = useRoleGroups();
  const roles = useRoles(groupId);
  const staff = useRoleAssignees(groupId, roleId);
  const saveAssignees = useSaveRoleAssignees();
  const selectedGroup = groups.data?.find((group) => group.roleGroupId === groupId);

  const selectGroup = (id: string) => {
    if (id === groupId) return;
    setGroupId(id);
    setRoleId(null);
    setStaffKeys([]);
  };

  const selectRole = (id: string) => {
    if (id === roleId) return;
    setRoleId(id);
    setStaffKeys([]);
  };

  const handleAddStaff = async (empNos: string[]) => {
    if (!groupId || !roleId) return;
    try {
      await saveAssignees.mutateAsync({ roleGroupId: groupId, roleId, addEmpNos: empNos, removeEmpNos: [] });
      toast.success(SYS_MESSAGES.saved);
      setStaffSearchOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDeleteStaff = () => {
    if (!groupId || !roleId || staffKeys.length === 0) return;
    confirm({
      content: SYS_MESSAGES.confirmDeleteCount(staffKeys.length),
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await saveAssignees.mutateAsync({ roleGroupId: groupId, roleId, addEmpNos: [], removeEmpNos: staffKeys });
          toast.success(SYS_MESSAGES.deleted);
          setStaffKeys([]);
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  /** ID cell: selects the row and opens the edit popup. */
  const idLink = (id: string, onOpen: () => void) => (
    <button
      type="button"
      className={styles.idLink}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      {id}
    </button>
  );

  const groupColumns: TableColumnsType<RoleGroup> = [
    {
      title: 'Group ID',
      dataIndex: 'roleGroupId',
      width: 120,
      align: 'center',
      render: (id: string, row) =>
        idLink(id, () => {
          selectGroup(id);
          setModal({ kind: 'group', record: row });
        }),
    },
    { title: 'Group Name', dataIndex: 'roleGroupNm', ellipsis: true },
    { title: 'Use', dataIndex: 'useYn', width: 100, align: 'center', render: (v: string) => <UseBadge value={v} /> },
  ];

  const roleColumns: TableColumnsType<Role> = [
    {
      title: 'Role ID',
      dataIndex: 'roleId',
      width: 120,
      align: 'center',
      render: (id: string, row) =>
        idLink(id, () => {
          selectRole(id);
          setModal({ kind: 'role', roleGroupId: row.roleGroupId, record: row });
        }),
    },
    { title: 'Role Name', dataIndex: 'roleNm', ellipsis: true },
    { title: 'Use', dataIndex: 'useYn', width: 100, align: 'center', render: (v: string) => <UseBadge value={v} /> },
  ];

  const staffColumns: TableColumnsType<RoleUser> = [
    { title: 'Employee No.', dataIndex: 'userNo', width: 140, align: 'center' },
    { title: 'Name', dataIndex: 'userNm', ellipsis: true },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="User Group Management"
        breadcrumb={['System Operation Management', 'Admin Management', 'User Group Management']}
      />
      <div className={styles.panels}>
        <section className={styles.panel}>
          <SysSectionHeader
            title="User Group"
            total={groups.data?.length ?? 0}
            primaryActions={
              canWrite && (
                <SysButton look="navy" onClick={() => setModal({ kind: 'group' })}>
                  New
                </SysButton>
              )
            }
          />
          <SysTable<RoleGroup>
            fill
            rowKey="roleGroupId"
            columns={groupColumns}
            dataSource={groups.data ?? []}
            loading={groups.isFetching}
            selectedRowKey={groupId}
            onRowClick={(row) => selectGroup(row.roleGroupId)}
          />
        </section>

        <section className={styles.panel}>
          <SysSectionHeader
            title={selectedGroup ? `[${selectedGroup.roleGroupNm}] Roles` : 'Roles'}
            total={groupId ? (roles.data?.length ?? 0) : undefined}
            primaryActions={
              canWrite && (
                <SysButton
                  look="navy"
                  disabled={!groupId}
                  onClick={() => groupId && setModal({ kind: 'role', roleGroupId: groupId })}
                >
                  New
                </SysButton>
              )
            }
          />
          {groupId ? (
            <SysTable<Role>
              fill
              rowKey="roleId"
              columns={roleColumns}
              dataSource={roles.data ?? []}
              loading={roles.isFetching}
              selectedRowKey={roleId}
              onRowClick={(row) => selectRole(row.roleId)}
            />
          ) : (
            <SysEmpty>Select a user group.</SysEmpty>
          )}
        </section>

        <section className={styles.panel}>
          <SysSectionHeader
            title="Role Staff"
            total={roleId ? (staff.data?.length ?? 0) : undefined}
            actions={
              canWrite && (
                <SysButton disabled={!roleId || staffKeys.length === 0} onClick={handleDeleteStaff}>
                  Delete
                </SysButton>
              )
            }
            primaryActions={
              canWrite && (
                <SysButton look="navy" disabled={!roleId} onClick={() => setStaffSearchOpen(true)}>
                  Add Staff
                </SysButton>
              )
            }
          />
          {roleId ? (
            <SysTable<RoleUser>
              fill
              rowKey="userNo"
              columns={staffColumns}
              dataSource={staff.data ?? []}
              loading={staff.isFetching || saveAssignees.isPending}
              rowSelection={
                canWrite
                  ? { selectedRowKeys: staffKeys, onChange: (keys) => setStaffKeys(keys.map(String)) }
                  : undefined
              }
            />
          ) : (
            <SysEmpty>Select a role.</SysEmpty>
          )}
        </section>
      </div>

      {modal && (
        <RoleGroupModal
          key={`${modal.kind}-${modal.record ? 'edit' : 'new'}`}
          target={modal}
          canWrite={canWrite}
          onClose={() => setModal(null)}
        />
      )}
      {staffSearchOpen && groupId && roleId && (
        <StaffSearchModal
          roleGroupId={groupId}
          roleId={roleId}
          saving={saveAssignees.isPending}
          onClose={() => setStaffSearchOpen(false)}
          onSelect={(empNos) => void handleAddStaff(empNos)}
        />
      )}
    </SysPage>
  );
}
