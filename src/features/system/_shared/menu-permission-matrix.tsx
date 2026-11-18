import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Alert, Checkbox, Spin } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useMenuStore } from '@/stores/menu-store';
import type { MatrixColumn, SaveMatrixRequest } from '@/api/system/menu-permission-api';
import type { MenuSeCd } from '@/api/system/menu-setting-api';
import { SysPageHeader } from './system-ui';
import { errorMessage } from './system-utils';
import styles from './system-page.module.scss';
import { useMenuPermissionMatrix, useSaveMenuPermissionMatrix } from './use-menu-permissions';

// Menu Permission matrix — menus (rows) × user-group roles (columns), Read / Write.
//   menuSeCd = W → Platform (Web) Menu Permission Management (VPA004301)
//   menuSeCd = A → Admin Menu Permission Management          (VPA004701)

interface Props {
  menuSeCd: MenuSeCd;
}

type Flag = { read: boolean; write: boolean };
/** Edited cells only, keyed `${roleGroupId}|${roleId}|${menuCd}`. */
type Edits = Record<string, Flag>;

const roleKey = (c: Pick<MatrixColumn, 'roleGroupId' | 'roleId'>) => `${c.roleGroupId}|${c.roleId}`;

export default function MenuPermissionMatrixScreen({ menuSeCd }: Props) {
  const isWeb = menuSeCd === 'W';
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const title = isWeb
    ? tvh('pageWeb', 'Platform Menu Permission Management')
    : tvh('pageAdmin', 'Admin Menu Permission Management');

  const { data, isFetching, error } = useMenuPermissionMatrix(menuSeCd);
  const saveMatrix = useSaveMenuPermissionMatrix();

  const [edits, setEdits] = useState<Edits>({});

  const columns = useMemo(() => data?.columns ?? [], [data]);
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const dirtyCount = Object.keys(edits).length;

  const cellOf = (rowIndex: number, colIndex: number): Flag => {
    const column = columns[colIndex];
    const row = rows[rowIndex];
    const stored = row.permissions[colIndex] ?? { read: false, write: false };
    return edits[`${roleKey(column)}|${row.menuCd}`] ?? { read: stored.read, write: stored.write };
  };

  const setCell = (rowIndex: number, colIndex: number, next: Flag) => {
    const column = columns[colIndex];
    const row = rows[rowIndex];
    const stored = row.permissions[colIndex] ?? { read: false, write: false };
    const key = `${roleKey(column)}|${row.menuCd}`;
    setEdits((prev) => {
      const copy = { ...prev };
      // Back to the stored value → no longer an edit.
      if (stored.read === next.read && stored.write === next.write) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  };

  // Write implies read; clearing read also clears write.
  const toggleRead = (r: number, c: number, checked: boolean) =>
    setCell(r, c, { read: checked, write: checked ? cellOf(r, c).write : false });
  const toggleWrite = (r: number, c: number, checked: boolean) =>
    setCell(r, c, { read: checked ? true : cellOf(r, c).read, write: checked });

  const handleSave = () => {
    if (dirtyCount === 0) {
      toast.info(tsm('noChange', 'There are no changes to save.'));
      return;
    }
    // The server replaces a role's permissions as a whole, so every changed role
    // is sent with its complete menu list. The Super Admin column is never sent.
    const changedRoles = new Set(Object.keys(edits).map((key) => key.split('|').slice(0, 2).join('|')));
    const request: SaveMatrixRequest = {
      menuSeCd,
      roles: columns
        .map((column, colIndex) => ({ column, colIndex }))
        .filter(({ column }) => !column.superAdmin && changedRoles.has(roleKey(column)))
        .map(({ column, colIndex }) => ({
          roleGroupId: column.roleGroupId,
          roleId: column.roleId,
          menus: rows
            .map((row, rowIndex) => ({ menuCd: row.menuCd, ...cellOf(rowIndex, colIndex) }))
            .filter((menu) => menu.read || menu.write),
        })),
    };

    dialog.confirm({
      content: tsm('confirmSave', 'Do you want to save the menu permissions?'),
      onOk: async () => {
        try {
          const response = await saveMatrix.mutateAsync(request);
          toast.success(response.message || tsm('saved', 'Saved.'));
          setEdits({});
          void useMenuStore.getState().invalidateMenuCache();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columnTitle = (column: MatrixColumn) =>
    column.superAdmin
      ? tsg('superAdmin', 'Super Admin')
      : `${column.roleGroupNm ?? column.roleGroupId}${column.roleNm ? ` / ${column.roleNm}` : ''}`;

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[
          tvt('bcSystem', 'System Operations Management'),
          isWeb ? tvt('bcPlatform', 'Platform Management') : tvt('bcAdmin', 'Admin Management'),
          title,
        ]}
        title={title}
      />

      {error && (
        <Alert
          type="warning"
          showIcon
          message={tvt('loadFailed', 'The permission matrix could not be loaded.')}
          description={error.message}
        />
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({rows.length})</span>
        {dirtyCount > 0 && (
          <span className={styles.textDanger}>
            {tvt('unsaved', 'Unsaved changes')}: {dirtyCount}
          </span>
        )}
      </div>

      <Spin spinning={isFetching}>
        <div className={`${styles.matrixWrapper} ${styles.matrixScroll}`}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th rowSpan={2} className={styles.stickyCode}>
                  {tsg('menuCd', 'Menu Code')}
                </th>
                <th rowSpan={2} className={styles.stickyName}>
                  {tsg('menuNmVn', 'Menu Name (VN)')}
                </th>
                {columns.map((column) => (
                  <th key={roleKey(column)} colSpan={2}>
                    {columnTitle(column)}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((column) => (
                  <th key={roleKey(column)} colSpan={2} className={styles.cellFlush}>
                    <div className={styles.matrixSplit}>
                      <span>{tsg('read', 'Read')}</span>
                      <span>{tsg('write', 'Write')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.menuCd}>
                  <td className={styles.stickyCode}>{row.menuCd}</td>
                  <td className={styles.stickyName}>
                    <span
                      className={styles.treeIndent}
                      style={{ '--depth': Math.max(0, row.menuDpth - 1) } as CSSProperties}
                    >
                      {row.menuNmVn ?? row.menuNmEn ?? '-'}
                    </span>
                    {row.useYn === 'N' && <span className={styles.textMuted}> (N)</span>}
                  </td>
                  {columns.map((column, colIndex) => {
                    const cell = cellOf(rowIndex, colIndex);
                    const dirty = `${roleKey(column)}|${row.menuCd}` in edits;
                    const disabled = !canWrite || column.superAdmin;
                    return [
                      <td key={`${roleKey(column)}-r`} className={dirty ? styles.dirty : undefined}>
                        <Checkbox
                          checked={cell.read}
                          disabled={disabled}
                          onChange={(e) => toggleRead(rowIndex, colIndex, e.target.checked)}
                        />
                      </td>,
                      <td key={`${roleKey(column)}-w`} className={dirty ? styles.dirty : undefined}>
                        <Checkbox
                          checked={cell.write}
                          disabled={disabled}
                          onChange={(e) => toggleWrite(rowIndex, colIndex, e.target.checked)}
                        />
                      </td>,
                    ];
                  })}
                </tr>
              ))}
              {!isFetching && rows.length === 0 && (
                <tr>
                  <td colSpan={2 + columns.length * 2} className={styles.cellEmpty}>
                    {tvt('noData', 'No data.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Spin>

      <div className={styles.bottomActions}>
        <button
          type="button"
          className={styles.btnDark}
          disabled={!canWrite || saveMatrix.isPending || rows.length === 0}
          onClick={handleSave}
        >
          {tvb('save', 'Save')}
        </button>
      </div>
    </div>
  );
}
