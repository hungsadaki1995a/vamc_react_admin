import { useState, useMemo, Fragment } from 'react';
import { Select, Button, Checkbox, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';
import GridToolbar from '@/components/layout/GridToolbar';
import styles from './index.module.css';
import DevPageHeader from '@/dev/DevPageHeader';

// Roles definition
const roles = [
  { key: 'admin', label: 'Administrator' },
  { key: 'pm', label: 'PM' },
  { key: 'developer', label: 'Developer' },
  { key: 'designer', label: 'Designer' },
  { key: 'viewer', label: 'Viewer' },
];

interface MenuPermRow {
  menuId: string;
  menuName: string;
  depth: number;
  isParent: boolean;
  permissions: Record<string, { read: boolean; write: boolean }>;
}

/** Flatten menuConfig into rows with depth */
function flattenMenu(items: MenuItem[], depth = 0): MenuPermRow[] {
  const rows: MenuPermRow[] = [];
  for (const item of items) {
    if (item.hidden) continue;
    const hasChildren = item.children && item.children.length > 0;
    const row: MenuPermRow = {
      menuId: item.key,
      menuName: item.label,
      depth,
      isParent: !!hasChildren,
      permissions: {},
    };
    // Default permissions based on role
    for (const role of roles) {
      if (role.key === 'admin') {
        row.permissions[role.key] = { read: true, write: true };
      } else if (role.key === 'pm') {
        row.permissions[role.key] = { read: true, write: !hasChildren };
      } else if (role.key === 'viewer') {
        row.permissions[role.key] = { read: true, write: false };
      } else {
        row.permissions[role.key] = { read: true, write: depth > 0 };
      }
    }
    rows.push(row);
    if (hasChildren) {
      rows.push(...flattenMenu(item.children!, depth + 1));
    }
  }
  return rows;
}

export default function PermissionManagement() {
  const [projectFilter, setProjectFilter] = useState('all');
  const initialRows = useMemo(() => flattenMenu(menuConfig), []);
  const [rows, setRows] = useState<MenuPermRow[]>(initialRows);

  const handleChange = (menuId: string, roleKey: string, type: 'read' | 'write', checked: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.menuId === menuId
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [roleKey]: { ...r.permissions[roleKey], [type]: checked },
              },
            }
          : r,
      ),
    );
  };

  const handleSave = () => {
    message.success('Permission settings have been saved.');
  };

  return (
    <>
      <DevPageHeader page="PermissionManagement" />

      {/* Filter */}
      <div className={styles.permFilterBar}>
        <div className={styles.permFilterItem}>
          <span className={styles.permFilterLabel}>Project</span>
          <Select
            value={projectFilter}
            onChange={setProjectFilter}
            style={{ width: 200 }}
            options={[
              { label: 'All projects', value: 'all' },
              { label: 'ERP rollout', value: 'P001' },
              { label: 'Mobile app development', value: 'P002' },
              { label: 'AI chatbot', value: 'P003' },
            ]}
          />
        </div>
      </div>

      <GridToolbar
        totalCount={rows.length}
        actions={
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Save
          </Button>
        }
      />

      {/* Permission Matrix */}
      <div className={styles.permMatrixWrapper}>
        <table className={styles.permMatrix}>
          <thead>
            {/* 1st header row: role names */}
            <tr>
              <th className={styles.permColId} rowSpan={2}>Menu ID</th>
              <th className={styles.permColName} rowSpan={2}>Menu name</th>
              {roles.map((role) => (
                <th key={role.key} className={styles.permColRole} colSpan={2}>
                  {role.label}
                </th>
              ))}
            </tr>
            {/* 2nd header row: read / write */}
            <tr>
              {roles.map((role) => (
                <Fragment key={role.key}>
                  <th className={styles.permColCheck}>Read</th>
                  <th className={styles.permColCheck}>Write</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.menuId}
                className={row.isParent ? styles.permRowParent : ''}
              >
                <td className={styles.permColId}>
                  <span style={{ paddingLeft: row.depth * 16 }}>
                    {row.menuId}
                  </span>
                </td>
                <td className={styles.permColName}>
                  <span style={{ paddingLeft: row.depth * 16, fontWeight: row.isParent ? 600 : 400 }}>
                    {row.menuName}
                  </span>
                </td>
                {roles.map((role) => {
                  const perm = row.permissions[role.key];
                  return (
                    <Fragment key={role.key}>
                      <td className={styles.permColCheck}>
                        <Checkbox
                          checked={perm.read}
                          onChange={(e) => handleChange(row.menuId, role.key, 'read', e.target.checked)}
                        />
                      </td>
                      <td className={styles.permColCheck}>
                        <Checkbox
                          checked={perm.write}
                          onChange={(e) => handleChange(row.menuId, role.key, 'write', e.target.checked)}
                        />
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
