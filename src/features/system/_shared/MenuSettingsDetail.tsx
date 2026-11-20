import { Input, Radio } from 'antd';
import type { MenuSeCd, YesNo } from '@/api/system/menu-setting-api';
import { SysButton, SysEmpty, SysNotAvailable } from './SysListUi';
import { SysField, SysFieldGrid } from './SysFormUi';
import { USE_YN_RADIO_OPTIONS } from './sys-constants';
import type { FieldErrors } from './use-field-errors';
import type { MenuForm, MenuFormKey } from './menu-settings-form';
import styles from './menu-settings.module.scss';

// Right panel of Menu Settings: title, location and the editable fields of the selected menu.

const SHOW_IN_MENU_OPTIONS: { value: YesNo; label: string }[] = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
];

interface MenuSettingsDetailProps {
  menuSeCd: MenuSeCd;
  /** false = nothing selected. */
  active: boolean;
  isNew: boolean;
  title: string;
  location: string;
  form: MenuForm;
  errors: FieldErrors<MenuFormKey>;
  canWrite: boolean;
  saving: boolean;
  onChange: (patch: Partial<MenuForm>) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function MenuSettingsDetail({
  menuSeCd,
  active,
  isNew,
  title,
  location,
  form,
  errors,
  canWrite,
  saving,
  onChange,
  onCancel,
  onSave,
}: MenuSettingsDetailProps) {
  if (!active) {
    return (
      <div className={styles.detailPanel}>
        <SysEmpty>Select a menu in the tree, or add a new one.</SysEmpty>
      </div>
    );
  }

  const isAdmin = menuSeCd === 'A';
  const readOnly = !canWrite;

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>{title}</h2>
        <p className={styles.detailLocation}>Location : {location || '-'}</p>
      </div>

      <SysFieldGrid columns={2}>
        <SysField
          label="Menu Code"
          required
          error={errors.menuCd}
          hint={isNew ? `${menuSeCd} followed by 8 digits, cannot be changed after saving.` : undefined}
        >
          <Input
            value={form.menuCd}
            maxLength={9}
            disabled={!isNew || readOnly}
            placeholder={`e.g. ${menuSeCd}01020000`}
            onChange={(e) => onChange({ menuCd: e.target.value.trim().toUpperCase() })}
          />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <Radio.Group
            options={USE_YN_RADIO_OPTIONS}
            value={form.useYn}
            disabled={readOnly}
            onChange={(e) => onChange({ useYn: e.target.value as YesNo })}
          />
        </SysField>

        <SysField label="Menu Name (VN)" required error={errors.menuNmVn}>
          <Input
            value={form.menuNmVn}
            maxLength={1000}
            disabled={readOnly}
            onChange={(e) => onChange({ menuNmVn: e.target.value })}
          />
        </SysField>
        <SysField label="Menu Name (EN)" required error={errors.menuNmEn}>
          <Input
            value={form.menuNmEn}
            maxLength={1000}
            disabled={readOnly}
            onChange={(e) => onChange({ menuNmEn: e.target.value })}
          />
        </SysField>

        <SysField
          label="Label Key"
          required
          span={2}
          error={errors.lblCd}
          hint="Label key from i18n Label Management."
        >
          <Input
            value={form.lblCd}
            maxLength={100}
            disabled={readOnly}
            placeholder={`e.g. lbl.menu.${menuSeCd}01020000`}
            onChange={(e) => onChange({ lblCd: e.target.value.trim() })}
          />
        </SysField>

        {isAdmin ? (
          <SysField
            label="Screen ID"
            span={2}
            error={errors.menuUrlAddr}
            hint="Screen registered in Screen Management; leave empty for group menus with only submenus."
          >
            <Input
              value={form.menuUrlAddr}
              maxLength={2000}
              disabled={readOnly}
              placeholder="e.g. SYS020101SC"
              onChange={(e) => onChange({ menuUrlAddr: e.target.value.trim() })}
            />
          </SysField>
        ) : (
          <SysField label="Web Path" span={2} error={errors.menuUrlAddr}>
            <Input
              value={form.menuUrlAddr}
              maxLength={2000}
              disabled={readOnly}
              placeholder="e.g. /service"
              onChange={(e) => onChange({ menuUrlAddr: e.target.value.trim() })}
            />
          </SysField>
        )}
        {isAdmin && (
          <SysField
            label="Show in Menu"
            required
            span={2}
            hint={
              <SysNotAvailable variant="inline">
                Waits for a database change. Every menu is shown in the LNB for now.
              </SysNotAvailable>
            }
          >
            {/* TODO(schema): MENU_EXPSR_YN — enable and send once the column exists. */}
            <Radio.Group options={SHOW_IN_MENU_OPTIONS} value={form.showInMenu} disabled />
          </SysField>
        )}

      </SysFieldGrid>

      {canWrite && (
        <div className={styles.detailFooter}>
          <SysButton look="outline" disabled={saving} onClick={onCancel}>
            Cancel
          </SysButton>
          <SysButton look="primary" loading={saving} onClick={onSave}>
            Save
          </SysButton>
        </div>
      )}
    </div>
  );
}
