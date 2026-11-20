import { useMemo, useState } from 'react';
import { Alert } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useMenuStore } from '@/stores/menu-store';
import type { MenuSeCd, MenuSetting, SaveMenuSettingRequest } from '@/api/system/menu-setting-api';
import { SysPage, SysSplit, SysTitleBar } from './SysListUi';
import { SYS_MESSAGES } from './sys-messages';
import { useSysDialogs } from './use-sys-dialogs';
import { useFieldErrors } from './use-field-errors';
import { apiErrorCode, errorMessage } from './system-utils';
import { buildMenuTree, menuName, parentCodes, visibleNodes } from './menu-tree';
import type { MenuMove, MenuNode } from './menu-tree';
import {
  REQUIRED_MENU_FIELDS,
  defaultLabelKey,
  emptyMenuForm,
  menuCodePattern,
  sameMenuForm,
  suggestMenuCode,
  toMenuForm,
} from './menu-settings-form';
import type { MenuForm, MenuFormKey } from './menu-settings-form';
import MenuSettingsTree from './MenuSettingsTree';
import MenuSettingsDetail from './MenuSettingsDetail';
import { useMenuSettings, useMoveMenuSetting, useSaveMenuSetting } from './use-menu-settings';

// Menu Settings (VPA09010101, menuSeCd=W) and Admin Menu Settings (VPA09020101, menuSeCd=A):
// tree on the left (drag & drop saved on drop), details of the selected menu on the right. No delete.

interface Props {
  menuSeCd: MenuSeCd;
}

/** Selected menu: `menuCd` null = unsaved draft under `upMenuCd`. */
interface Selection {
  menuCd: string | null;
  upMenuCd: string;
}

const WEB_MAX_DEPTH = 3;
const ADMIN_MAX_DEPTH = 9;

const SCREEN = {
  W: {
    title: 'Menu Settings',
    breadcrumb: ['System Operation Management', 'NPL Platform Management', 'Menu Settings'],
  },
  A: {
    title: 'Admin Menu Settings',
    breadcrumb: ['System Operation Management', 'Admin Management', 'Admin Menu Settings'],
  },
} as const;

const EMPTY_FORM = emptyMenuForm('');

export default function MenuSettings({ menuSeCd }: Props) {
  const screen = SCREEN[menuSeCd];
  const maxDepth = menuSeCd === 'W' ? WEB_MAX_DEPTH : ADMIN_MAX_DEPTH;
  const { toast } = useNotify();
  const { guardDiscard } = useSysDialogs();
  const { canWrite } = useMenuPermission();

  const { data, isLoading, error } = useMenuSettings(menuSeCd);
  const saveMenu = useSaveMenuSetting();
  const moveMenu = useMoveMenuSetting();
  const { errors, setError, clearError, clearAll, checkRequired, applyApiError } = useFieldErrors<MenuFormKey>();

  const [selection, setSelection] = useState<Selection | null>(null);
  const [baseline, setBaseline] = useState<MenuForm>(EMPTY_FORM);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const tree = useMemo(() => buildMenuTree(data ?? []), [data]);
  const visible = useMemo(() => visibleNodes(tree, collapsed), [tree, collapsed]);
  const expandable = useMemo(() => parentCodes(tree), [tree]);
  const allExpanded = expandable.every((cd) => !collapsed.has(cd));

  const isNew = selection !== null && selection.menuCd === null;
  const selectedNode = selection?.menuCd ? tree.byCd.get(selection.menuCd) : undefined;
  const dirty = selection !== null && !sameMenuForm(form, baseline);

  const load = (next: Selection, values: MenuForm) => {
    setSelection(next);
    setBaseline(values);
    setForm(values);
    clearAll();
  };

  const handleSelect = (node: MenuNode<MenuSetting>) => {
    if (selection?.menuCd === node.menu.menuCd) return;
    guardDiscard(dirty, () => load({ menuCd: node.menu.menuCd, upMenuCd: node.menu.upMenuCd }, toMenuForm(node.menu)));
  };

  const startDraft = (upMenuCd: string) => {
    guardDiscard(dirty, () => {
      load({ menuCd: null, upMenuCd }, emptyMenuForm(suggestMenuCode(menuSeCd, tree, upMenuCd)));
      setCollapsed((prev) => {
        if (!prev.has(upMenuCd)) return prev;
        const next = new Set(prev);
        next.delete(upMenuCd);
        return next;
      });
    });
  };

  const handleChange = (patch: Partial<MenuForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      // Keep the conventional label key in step with a new menu code.
      if (patch.menuCd !== undefined && prev.lblCd === defaultLabelKey(prev.menuCd)) {
        next.lblCd = defaultLabelKey(patch.menuCd);
      }
      return next;
    });
    (Object.keys(patch) as MenuFormKey[]).forEach(clearError);
  };

  const toggleNode = (menuCd: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(menuCd)) next.delete(menuCd);
      else next.add(menuCd);
      return next;
    });

  const toggleAll = () => setCollapsed(allExpanded ? new Set(expandable) : new Set());

  const handleMove = async (menuCd: string, move: MenuMove) => {
    try {
      await moveMenu.mutateAsync({ menuCd, request: move });
      toast.success('The menu position was saved.');
      void useMenuStore.getState().invalidateMenuCache();
    } catch (e) {
      if (apiErrorCode(e) === 'MNU006') toast.error(`A menu cannot be placed below ${maxDepth}Depth.`);
      else toast.error(errorMessage(e));
    }
  };

  const handleSave = async () => {
    if (!selection) return;
    if (!checkRequired(form, REQUIRED_MENU_FIELDS)) return;
    if (isNew) {
      if (!menuCodePattern(menuSeCd).test(form.menuCd)) {
        setError('menuCd', `Enter ${menuSeCd} followed by 8 digits.`);
        return;
      }
      if (tree.byCd.has(form.menuCd) || form.menuCd === tree.rootCd) {
        setError('menuCd', SYS_MESSAGES.duplicate('menu code'));
        return;
      }
    }

    const stored = selectedNode?.menu;
    const request: SaveMenuSettingRequest = {
      menuSeCd,
      menuCd: form.menuCd,
      // Parent from the current tree: a drag & drop may have moved the menu since it was selected.
      upMenuCd: stored?.upMenuCd ?? selection.upMenuCd,
      menuNmVn: form.menuNmVn.trim(),
      menuNmEn: form.menuNmEn.trim(),
      menuUrlAddr: form.menuUrlAddr || undefined,
      lblCd: form.lblCd,
      menuExpln: stored?.menuExpln,
      useYn: form.useYn,
    };

    try {
      await saveMenu.mutateAsync({ isEdit: !isNew, request });
      toast.success(isNew ? SYS_MESSAGES.registered : SYS_MESSAGES.saved);
      load({ menuCd: form.menuCd, upMenuCd: request.upMenuCd }, form);
      void useMenuStore.getState().invalidateMenuCache();
    } catch (e) {
      const handled = applyApiError(e, {
        MNU002: ['menuCd', SYS_MESSAGES.duplicate('menu code')],
        MNU012: ['lblCd', 'This label key is already used by another menu.'],
        MNU014: ['lblCd', 'This label key is not registered in i18n Label Management.'],
      });
      if (handled) return;
      if (apiErrorCode(e) === 'MNU006') toast.error(`A menu cannot be added below ${maxDepth}Depth.`);
      else toast.error(errorMessage(e));
    }
  };

  // Title / Location of the detail panel.
  const parentNode = selection ? tree.byCd.get(selectedNode?.menu.upMenuCd ?? selection.upMenuCd) : undefined;
  const parentPath = parentNode ? [...parentNode.path, parentNode.menu].map(menuName) : [];
  const title = selectedNode ? menuName(selectedNode.menu) : form.menuNmEn || form.menuNmVn || 'New Menu';
  const location = [...parentPath, title].join(' > ');

  const addSubDisabled = !selectedNode || (menuSeCd === 'W' && selectedNode.level >= WEB_MAX_DEPTH);

  return (
    <SysPage fill>
      <SysTitleBar title={screen.title} breadcrumb={[...screen.breadcrumb]} />
      {error && <Alert type="error" showIcon title="The menu list could not be loaded." description={error.message} />}
      <SysSplit
        ratio="minmax(360px, 2fr) 3fr"
        left={
          <MenuSettingsTree
            tree={tree}
            visible={visible}
            collapsed={collapsed}
            allExpanded={allExpanded}
            selectedCd={selection?.menuCd}
            draft={isNew && selection ? { upMenuCd: selection.upMenuCd, name: form.menuNmEn, useYn: form.useYn } : null}
            maxDepth={maxDepth}
            canWrite={canWrite}
            addSubDisabled={addSubDisabled}
            loading={isLoading}
            moving={moveMenu.isPending}
            onToggle={toggleNode}
            onToggleAll={toggleAll}
            onSelect={handleSelect}
            onAddSub={() => selectedNode && startDraft(selectedNode.menu.menuCd)}
            onAddTop={() => tree.rootCd && startDraft(tree.rootCd)}
            onMove={(menuCd, move) => void handleMove(menuCd, move)}
          />
        }
        right={
          <MenuSettingsDetail
            menuSeCd={menuSeCd}
            active={selection !== null}
            isNew={isNew}
            title={title}
            location={location}
            form={form}
            errors={errors}
            canWrite={canWrite}
            saving={saveMenu.isPending}
            onChange={handleChange}
            onCancel={() => {
              setForm(baseline);
              clearAll();
            }}
            onSave={() => void handleSave()}
          />
        }
      />
    </SysPage>
  );
}
