import { useMemo, useState } from 'react';
import { Input, InputNumber, Radio, Table, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useMenuStore } from '@/stores/menu-store';
import {
  createMenuSetting,
  deleteMenuSetting,
  getMenuSettings,
  updateMenuSetting,
} from '@/api/sys/menu-setting-api';
import type {
  MenuSeCd,
  MenuSetting,
  MenuSettingSearch,
  SaveMenuSettingRequest,
  YesNo,
} from '@/api/sys/menu-setting-api';
import { FormField, SysPageHeader, UseFlag } from './sys-ui';
import { errorMessage } from './sys-utils';
import styles from './sys-page.module.css';

// Menu Settings — list + inline New/Edit form.
//   menuSeCd = W → Platform Menu Management (VPA003901 / VPA0039P01)
//   menuSeCd = A → Admin Menu Management    (VPA004401 / VPA0044P01)

interface MenuSettingsProps {
  menuSeCd: MenuSeCd;
}

interface FormState {
  useYn: YesNo;
  menuCd: string;
  menuNmVn: string;
  menuNmEn: string;
  upMenuCd: string;
  menuSeq: number | null;
  menuUrlAddr: string;
  lblCd: string;
  menuExpln: string;
}

const EMPTY_FORM: FormState = {
  useYn: 'N',
  menuCd: '',
  menuNmVn: '',
  menuNmEn: '',
  upMenuCd: '',
  menuSeq: null,
  menuUrlAddr: '',
  lblCd: '',
  menuExpln: '',
};

const EMPTY_FILTER = { menuCd: '', menuNmVn: '', menuNmEn: '' };

function toForm(row: MenuSetting): FormState {
  return {
    useYn: row.useYn,
    menuCd: row.menuCd,
    menuNmVn: row.menuNmVn ?? '',
    menuNmEn: row.menuNmEn ?? '',
    upMenuCd: row.upMenuCd,
    menuSeq: row.menuSeq,
    menuUrlAddr: row.menuUrlAddr ?? '',
    lblCd: row.lblCd ?? '',
    menuExpln: row.menuExpln ?? '',
  };
}

export default function MenuSettings({ menuSeCd }: MenuSettingsProps) {
  const isWeb = menuSeCd === 'W';
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const title = isWeb
    ? tvh('pageWeb', 'Platform Menu Management')
    : tvh('pageAdmin', 'Admin Menu Management');
  const codePattern = isWeb ? /^W\d{8}$/ : /^A\d{8}$/;

  // ── Filter ────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [applied, setApplied] = useState<MenuSettingSearch>({ menuSeCd });
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // The menu tree is small and fixed by the IA, so it loads on entry.
  const { data: menus = [], isFetching } = useApiQuery<MenuSetting[]>(
    ['sys', 'menu-settings', applied],
    () => getMenuSettings(applied),
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<MenuSetting | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = selected !== null;
  // Policy: a menu in use can only be viewed — switch it to N and save first.
  const locked = selected?.useYn === 'Y';
  const fieldsDisabled = !canWrite || locked;

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  const handleSearch = () => {
    setApplied({
      menuSeCd,
      menuCd: filter.menuCd.trim() || undefined,
      menuNmVn: filter.menuNmVn.trim() || undefined,
      menuNmEn: filter.menuNmEn.trim() || undefined,
    });
  };

  const handleFilterReset = () => {
    setFilter(EMPTY_FILTER);
    setApplied({ menuSeCd });
  };

  const handleRowClick = (row: MenuSetting) => {
    setSelected(row);
    setForm(toForm(row));
  };

  const handleFormReset = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  /** Refreshes the grid and the rail / flyout menu tree that reads the same table. */
  const refreshAfterWrite = () => {
    void queryClient.invalidateQueries({ queryKey: ['sys', 'menu-settings'] });
    void queryClient.invalidateQueries({ queryKey: ['sys', 'menu-permissions'] });
    void useMenuStore.getState().invalidateMenuCache();
  };

  const validate = (): string | null => {
    if (!codePattern.test(form.menuCd.trim())) {
      return tsm('invalidMenuCd', `Menu Code must be "${menuSeCd}" followed by 8 digits.`);
    }
    if (!codePattern.test(form.upMenuCd.trim())) {
      return tsm('invalidUpMenuCd', `Parent Menu Code must be "${menuSeCd}" followed by 8 digits.`);
    }
    if (!form.menuNmVn.trim() || !form.menuNmEn.trim()) {
      return tsm('nameRequired', 'Enter both the Vietnamese and English menu names.');
    }
    if (form.menuSeq === null) return tsm('orderRequired', 'Enter the menu order.');
    return null;
  };

  const handleSave = () => {
    // A menu in use only accepts a usage change: resend the stored values.
    const source = locked && selected ? { ...toForm(selected), useYn: form.useYn } : form;
    if (!locked) {
      const invalid = validate();
      if (invalid) {
        toast.warning(invalid);
        return;
      }
    }
    const request: SaveMenuSettingRequest = {
      menuSeCd,
      menuCd: source.menuCd.trim(),
      upMenuCd: source.upMenuCd.trim(),
      menuNmVn: source.menuNmVn.trim(),
      menuNmEn: source.menuNmEn.trim(),
      menuSeq: source.menuSeq ?? 0,
      menuUrlAddr: source.menuUrlAddr.trim() || undefined,
      lblCd: source.lblCd.trim() || undefined,
      menuExpln: source.menuExpln.trim() || undefined,
      useYn: source.useYn,
    };

    dialog.confirm({
      content: isEdit
        ? tsm('confirmUpdate', 'Do you want to save the changes?')
        : tsm('confirmCreate', 'Do you want to register this menu?'),
      onOk: async () => {
        setSaving(true);
        try {
          const response = await (isEdit ? updateMenuSetting(request) : createMenuSetting(request));
          toast.success(response.message || tsm('saved', 'Saved.'));
          handleFormReset();
          refreshAfterWrite();
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    dialog.warning({
      okCancel: true,
      content: tsm(
        'confirmDelete',
        'Delete the selected menu? All of its sub-menus will be deleted as well.',
      ),
      onOk: async () => {
        try {
          const response = await deleteMenuSetting(selected.menuCd);
          toast.success(response.message || tsm('deleted', 'Deleted.'));
          handleFormReset();
          refreshAfterWrite();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const columns = useMemo<TableColumnsType<MenuSetting>>(() => {
    const indent = (row: MenuSetting) => ({ paddingLeft: Math.max(0, row.menuDpth - 1) * 16 });
    return [
      {
        title: tsg('useYn', 'Use'),
        dataIndex: 'useYn',
        width: 60,
        align: 'center',
        render: (value: string) => <UseFlag value={value} />,
      },
      { title: tsg('menuCd', 'Menu Code'), dataIndex: 'menuCd', width: 110, align: 'center' },
      {
        title: tsg('menuNmVn', 'Menu Name (VN)'),
        dataIndex: 'menuNmVn',
        width: 240,
        render: (value: string | undefined, row) => <span style={indent(row)}>{value ?? '-'}</span>,
      },
      {
        title: tsg('menuNmEn', 'Menu Name (EN)'),
        dataIndex: 'menuNmEn',
        width: 240,
        render: (value: string | undefined, row) => <span style={indent(row)}>{value ?? '-'}</span>,
      },
      { title: tsg('upMenuCd', 'Parent Menu Code'), dataIndex: 'upMenuCd', width: 120, align: 'center' },
      { title: tsg('menuSeq', 'Menu Order'), dataIndex: 'menuSeq', width: 70, align: 'center' },
      { title: tsg('menuDpth', 'Menu Level'), dataIndex: 'menuDpth', width: 70, align: 'center' },
      {
        title: tsg('menuUrlAddr', 'Component Path'),
        dataIndex: 'menuUrlAddr',
        width: 220,
        render: (value?: string) => value || '-',
      },
      {
        title: tsg('lblCd', 'Label Code'),
        dataIndex: 'lblCd',
        width: 200,
        render: (value?: string) => value || '-',
      },
    ];
  }, [tsg]);

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[
          tvt('bcSystem', 'System Operations Management'),
          isWeb ? tvt('bcPlatform', 'Platform Management') : tvt('bcAdmin', 'Admin Management'),
          title,
        ]}
        title={title}
        resetLabel={tvb('reset', 'Reset')}
        searchLabel={tvb('search', 'Search')}
        onReset={handleFilterReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('menuCd', 'Menu Code')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phMenuCd', 'Enter Menu Code')}
              value={filter.menuCd}
              maxLength={9}
              onChange={(e) => setFilter((f) => ({ ...f, menuCd: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('menuNmVn', 'Menu Name (VN)')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phMenuNmVn', 'Enter Vietnamese Menu Name')}
              value={filter.menuNmVn}
              onChange={(e) => setFilter((f) => ({ ...f, menuNmVn: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('menuNmEn', 'Menu Name (EN)')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phMenuNmEn', 'Enter English Menu Name')}
              value={filter.menuNmEn}
              onChange={(e) => setFilter((f) => ({ ...f, menuNmEn: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({menus.length})</span>
      </div>

      <div className={`${styles.tableWrapper} ${styles.rowClickable}`}>
        <Table<MenuSetting>
          rowKey="menuCd"
          columns={columns}
          dataSource={menus}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content', y: 380 }}
          rowClassName={(row) => (row.menuCd === selected?.menuCd ? 'rowSelected' : '')}
          onRow={(row) => ({ onClick: () => handleRowClick(row) })}
        />
      </div>

      {/* ── New / Edit form (VPA0039P01 / VPA0044P01) ─────────────────────── */}
      <div className={styles.formPanel}>
        <div className={styles.formPanelHeader}>
          <span className={styles.formPanelTitle}>
            {isWeb
              ? tvh('formWeb', 'New/Edit Platform Menu')
              : tvh('formAdmin', 'Admin Menu New/Edit')}
            {locked && (
              <span className={styles.formNotice}>
                {tvt(
                  'lockedNotice',
                  'A menu in use can only be viewed. Select N and save to edit it.',
                )}
              </span>
            )}
          </span>
          <div className={styles.actions}>
            <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={handleFormReset}>
              {tvb('reset', 'Reset')}
            </button>
            <button
              type="button"
              className={`${styles.btnDanger} ${styles.btnSmall}`}
              disabled={!canWrite || !isEdit || locked}
              onClick={handleDelete}
            >
              {tvb('delete', 'Delete')}
            </button>
            <button
              type="button"
              className={`${styles.btnDark} ${styles.btnSmall}`}
              disabled={!canWrite || saving}
              onClick={handleSave}
            >
              {tvb('save', 'Save')}
            </button>
          </div>
        </div>

        <div className={styles.formGrid}>
          <FormField label={tvt('useYn', 'Usage Status')}>
            <Radio.Group
              value={form.useYn}
              disabled={!canWrite}
              onChange={(e) => patch({ useYn: e.target.value as YesNo })}
              options={[
                { value: 'Y', label: 'Y' },
                { value: 'N', label: 'N' },
              ]}
            />
          </FormField>
          <FormField label={tvt('menuCd', 'Menu Code')} required>
            <Input
              placeholder={tvt('phMenuCd', 'Enter Menu Code')}
              value={form.menuCd}
              maxLength={9}
              disabled={fieldsDisabled || isEdit}
              onChange={(e) => patch({ menuCd: e.target.value.toUpperCase() })}
            />
          </FormField>
          <FormField label={tvt('menuNmVn', 'Menu Name (VN)')} required>
            <Input
              placeholder={tvt('phMenuNmVn', 'Enter Vietnamese Menu Name')}
              value={form.menuNmVn}
              maxLength={1000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ menuNmVn: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('menuNmEn', 'Menu Name (EN)')} required>
            <Input
              placeholder={tvt('phMenuNmEn', 'Enter English Menu Name')}
              value={form.menuNmEn}
              maxLength={1000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ menuNmEn: e.target.value })}
            />
          </FormField>

          <FormField label={tvt('upMenuCd', 'Parent Menu Code')} required>
            <Input
              placeholder={tvt('phUpMenuCd', 'Enter Parent Menu Code')}
              value={form.upMenuCd}
              maxLength={9}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ upMenuCd: e.target.value.toUpperCase() })}
            />
          </FormField>
          <FormField label={tvt('menuSeq', 'Menu Order')} required>
            <InputNumber
              placeholder={tvt('phMenuSeq', 'Enter Menu Order')}
              value={form.menuSeq}
              min={0}
              max={99}
              precision={0}
              disabled={fieldsDisabled}
              onChange={(value) => patch({ menuSeq: value })}
            />
          </FormField>
          <FormField label={tvt('menuUrlAddr', 'Component Path')}>
            <Input
              placeholder={tvt('phMenuUrlAddr', 'e.g. sys030101-sc')}
              value={form.menuUrlAddr}
              maxLength={2000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ menuUrlAddr: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('lblCd', 'Label Code')}>
            <Input
              placeholder={tvt('phLblCd', 'Enter Label Code')}
              value={form.lblCd}
              maxLength={100}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ lblCd: e.target.value })}
            />
          </FormField>

          <FormField label={tvt('menuExpln', 'Menu Description')} span={isWeb ? 'wide' : 'full'}>
            <Input
              placeholder={tvt('phMenuExpln', 'Enter Description for Menu')}
              value={form.menuExpln}
              maxLength={4000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ menuExpln: e.target.value })}
            />
          </FormField>
          {isWeb && (
            <FormField label={tvt('accessRights', 'Access Rights')} span="full">
              {/* MENU_MNG has no access-rights column yet (proposed ACS_AUTHRT_SE_CD). */}
              <Tooltip title={tvt('accessRightsPending', 'Not supported by the API yet.')}>
                <Radio.Group
                  value="MBR"
                  disabled
                  options={[
                    { value: 'ALL', label: tvt('accessAll', 'ALL') },
                    { value: 'MBR', label: tvt('accessMember', 'Member (Login)') },
                  ]}
                />
              </Tooltip>
            </FormField>
          )}
        </div>
      </div>
    </div>
  );
}
