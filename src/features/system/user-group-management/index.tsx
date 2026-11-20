import { useMemo, useState } from 'react';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  createRole,
  createRoleGroup,
  deleteRole,
  deleteRoleGroup,
  getRoleAssignees,
  getRoleGroups,
  getRoles,
  saveRoleAssignees,
  updateRole,
  updateRoleGroup,
} from '@/api/system/role-group-api';
import type { Role, RoleGroup, RoleUser } from '@/api/system/role-group-api';
import type { EmployeeLookup } from '@/api/system/employee-api';
import { SysPageHeader } from '../_shared/SystemUi';
import { errorMessage } from '../_shared/system-utils';
import styles from '../_shared/system-page.module.css';
import CodeNameCard from './CodeNameCard';
import type { CodeNameItem } from './CodeNameCard';
import SelectEmployeeModal from './SelectEmployeeModal';

// User Group Management (VPA004601) — User Group → Group Role → Role Assignee.
// Menu A06020300. Nothing in the role / assignee columns works until its parent is selected.

interface AssigneeRow {
  empNo: string;
  name: string;
  /** Picked in the popup, not saved yet. */
  pending: boolean;
}

const GROUP_ID_PATTERN = /^RG\d{5}$/;

export default function SYS030103SC() {
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: groups = [], isFetching: groupsLoading } = useApiQuery<RoleGroup[]>(
    ['sys', 'role-groups'],
    getRoleGroups,
  );
  const { data: roles = [], isFetching: rolesLoading } = useApiQuery<Role[]>(
    ['sys', 'roles', groupId],
    () => getRoles(groupId as string),
    { enabled: groupId !== null },
  );
  const { data: assignees = [], isFetching: assigneesLoading } = useApiQuery<RoleUser[]>(
    ['sys', 'role-assignees', groupId, roleId],
    () => getRoleAssignees(groupId as string, roleId as string),
    { enabled: groupId !== null && roleId !== null },
  );

  // Newest first, as in the wireframe (No counts down).
  const groupItems = useMemo<CodeNameItem[]>(
    () => [...groups].reverse().map((g) => ({ id: g.roleGroupId, name: g.roleGroupNm, useYn: g.useYn })),
    [groups],
  );
  const roleItems = useMemo<CodeNameItem[]>(
    () =>
      groupId === null
        ? []
        : [...roles].reverse().map((r) => ({ id: r.roleId, name: r.roleNm, useYn: r.useYn })),
    [roles, groupId],
  );

  // ── Assignee edits (saved as one batch) ───────────────────────────────────
  const [added, setAdded] = useState<EmployeeLookup[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [savingAssignees, setSavingAssignees] = useState(false);

  const resetAssigneeEdits = () => {
    setAdded([]);
    setRemoved([]);
    setChecked([]);
  };

  const selectGroup = (item: CodeNameItem | null) => {
    setGroupId(item?.id ?? null);
    setRoleId(null);
    resetAssigneeEdits();
  };

  const selectRole = (item: CodeNameItem | null) => {
    setRoleId(item?.id ?? null);
    resetAssigneeEdits();
  };

  const assigneeRows = useMemo<AssigneeRow[]>(
    () =>
      roleId === null
        ? []
        : [
            ...added.map((e) => ({ empNo: e.empNo, name: e.empNm, pending: true })),
            ...assignees
              .filter((a) => !removed.includes(a.userNo))
              .map((a) => ({ empNo: a.userNo, name: a.userNm, pending: false })),
          ],
    [added, assignees, removed, roleId],
  );
  const assigneeDirty = added.length > 0 || removed.length > 0;

  // ── Group handlers ────────────────────────────────────────────────────────
  const runWrite = async (action: () => Promise<{ message: string }>, fallback: string) => {
    try {
      const response = await action();
      toast.success(response.message || fallback);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  };

  const saveGroup = async (item: CodeNameItem, isEdit: boolean) => {
    if (!GROUP_ID_PATTERN.test(item.id)) {
      toast.warning(tsm('invalidGroupId', 'Group ID must be "RG" followed by 5 digits (e.g. RG01001).'));
      return false;
    }
    if (!item.name) {
      toast.warning(tsm('groupNameRequired', 'Enter the group name.'));
      return false;
    }
    const request = { roleGroupId: item.id, roleGroupNm: item.name, useYn: item.useYn };
    const ok = await runWrite(
      () => (isEdit ? updateRoleGroup(request) : createRoleGroup(request)),
      tsm('saved', 'Saved.'),
    );
    if (ok) {
      await queryClient.invalidateQueries({ queryKey: ['sys', 'role-groups'] });
      // A newly registered group becomes the selection so its roles can be added.
      if (!isEdit) selectGroup(item);
    }
    return ok;
  };

  const removeGroup = (item: CodeNameItem) => {
    dialog.warning({
      okCancel: true,
      content: tsm('confirmDeleteGroup', 'Delete this user group? A group that still has roles cannot be deleted.'),
      onOk: async () => {
        if (await runWrite(() => deleteRoleGroup(item.id), tsm('deleted', 'Deleted.'))) {
          selectGroup(null);
          void queryClient.invalidateQueries({ queryKey: ['sys', 'role-groups'] });
        }
      },
    });
  };

  // ── Role handlers ─────────────────────────────────────────────────────────
  const saveRole = async (item: CodeNameItem, isEdit: boolean) => {
    if (groupId === null) return false;
    if (!item.id || !item.name) {
      toast.warning(tsm('roleRequired', 'Enter the role ID and role name.'));
      return false;
    }
    const request: Role = { roleId: item.id, roleNm: item.name, roleGroupId: groupId, useYn: item.useYn };
    const ok = await runWrite(
      () => (isEdit ? updateRole(request) : createRole(request)),
      tsm('saved', 'Saved.'),
    );
    if (ok) {
      await queryClient.invalidateQueries({ queryKey: ['sys', 'roles'] });
      if (!isEdit) selectRole(item);
    }
    return ok;
  };

  const removeRole = (item: CodeNameItem) => {
    dialog.warning({
      okCancel: true,
      content: tsm(
        'confirmDeleteRole',
        'Delete this role? A role that still has assignees or menu permissions cannot be deleted.',
      ),
      onOk: async () => {
        if (await runWrite(() => deleteRole(item.id), tsm('deleted', 'Deleted.'))) {
          selectRole(null);
          void queryClient.invalidateQueries({ queryKey: ['sys', 'roles'] });
        }
      },
    });
  };

  // ── Assignee handlers ─────────────────────────────────────────────────────
  const handleAddEmployees = (employees: EmployeeLookup[]) => {
    setAdded((prev) => [...prev, ...employees.filter((e) => !prev.some((p) => p.empNo === e.empNo))]);
    setLookupOpen(false);
  };

  const handleRemoveChecked = () => {
    if (checked.length === 0) {
      toast.warning(tsm('selectAssignee', 'Select the assignee(s) to remove.'));
      return;
    }
    // Unsaved picks are simply dropped; saved assignees are queued for removal.
    const saved = checked.filter((empNo) => !added.some((e) => e.empNo === empNo));
    setAdded((prev) => prev.filter((e) => !checked.includes(e.empNo)));
    setRemoved((prev) => [...prev, ...saved]);
    setChecked([]);
  };

  const handleSaveAssignees = async () => {
    if (groupId === null || roleId === null) return;
    setSavingAssignees(true);
    try {
      const response = await saveRoleAssignees(
        groupId,
        roleId,
        added.map((e) => e.empNo),
        removed,
      );
      toast.success(response.message || tsm('saved', 'Saved.'));
      resetAssigneeEdits();
      await queryClient.invalidateQueries({ queryKey: ['sys', 'role-assignees'] });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingAssignees(false);
    }
  };

  const assigneeColumns: TableColumnsType<AssigneeRow> = [
    { title: tsg('empNo', 'Employee Number'), dataIndex: 'empNo', width: 140, align: 'center' },
    {
      title: tsg('empNm', 'Name'),
      dataIndex: 'name',
      align: 'center',
      render: (value: string, row) => (
        <>
          {value}
          {row.pending && <span className={styles.textMuted}> ({tvt('pending', 'new')})</span>}
        </>
      ),
    },
  ];

  const common = {
    use: tvt('use', 'Use'),
    reset: tvb('reset', 'Reset'),
    delete: tvb('delete', 'Delete'),
    save: tvb('save', 'Save'),
  };
  const title = tvh('page', 'User Group Management');
  const assigneeLocked = !canWrite || roleId === null;

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[
          tvt('bcSystem', 'System Operations Management'),
          tvt('bcAdmin', 'Admin Management'),
          title,
        ]}
        title={title}
      />

      <div className={styles.columns}>
        <CodeNameCard
          labels={{
            ...common,
            title: tvh('userGroup', 'User Group'),
            formTitle: tvh('groupForm', 'Group New/Edit'),
            id: tvt('groupId', 'Group ID'),
            name: tvt('groupName', 'Group Name'),
            idPlaceholder: tvt('phGroupId', 'Enter Group ID (RG + 5 digits)'),
            namePlaceholder: tvt('phGroupName', 'Enter Group Name'),
          }}
          items={groupItems}
          loading={groupsLoading}
          canWrite={canWrite}
          idMaxLength={7}
          selectedId={groupId}
          onSelect={selectGroup}
          onSave={saveGroup}
          onDelete={removeGroup}
        />

        <CodeNameCard
          labels={{
            ...common,
            title: tvh('groupRole', 'Group Role'),
            formTitle: tvh('roleForm', 'New/Modify Role'),
            id: tvt('roleId', 'Role ID'),
            name: tvt('roleName', 'Role Name'),
            idPlaceholder: tvt('phRoleId', 'Enter Role ID'),
            namePlaceholder: tvt('phRoleName', 'Enter Role Name'),
            emptyHint: tvt('selectGroup', 'Please select a group.'),
          }}
          items={roleItems}
          loading={rolesLoading}
          disabled={groupId === null}
          canWrite={canWrite}
          idMaxLength={7}
          selectedId={roleId}
          onSelect={selectRole}
          onSave={saveRole}
          onDelete={removeRole}
        />

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{tvh('roleAssignee', 'Role Assignee')}</h2>
          <span className={styles.totalCount}>Total ({assigneeRows.length})</span>
          <div className={styles.cardBody}>
            <div className={styles.tableWrapper}>
              <Table<AssigneeRow>
                rowKey="empNo"
                columns={assigneeColumns}
                dataSource={assigneeRows}
                loading={assigneesLoading}
                pagination={false}
                size="small"
                scroll={{ y: 420 }}
                locale={{ emptyText: ' ' }}
                rowSelection={{
                  selectedRowKeys: checked,
                  onChange: (keys) => setChecked(keys.map(String)),
                  getCheckboxProps: () => ({ disabled: assigneeLocked }),
                }}
              />
            </div>
            {roleId === null && (
              <div className={styles.cardEmpty}>{tvt('selectRole', 'Please select a role.')}</div>
            )}
          </div>
          <div className={styles.cardFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSmall}`}
              disabled={assigneeLocked}
              onClick={() => setLookupOpen(true)}
            >
              {tvb('addAssignee', 'Add Assignee')}
            </button>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSmall}`}
                disabled={assigneeLocked}
                onClick={handleRemoveChecked}
              >
                {common.delete}
              </button>
              <button
                type="button"
                className={`${styles.btnDark} ${styles.btnSmall}`}
                disabled={assigneeLocked || !assigneeDirty || savingAssignees}
                onClick={handleSaveAssignees}
              >
                {common.save}
              </button>
            </div>
          </div>
        </section>
      </div>

      {lookupOpen && groupId !== null && roleId !== null && (
        <SelectEmployeeModal
          roleGroupId={groupId}
          roleId={roleId}
          pendingEmpNos={added.map((e) => e.empNo)}
          onClose={() => setLookupOpen(false)}
          onConfirm={handleAddEmployees}
        />
      )}
    </div>
  );
}
