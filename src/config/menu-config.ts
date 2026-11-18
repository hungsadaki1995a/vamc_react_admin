import type { MenuItem } from '@/types/menu';

// Business menus are loaded from server after login.
// Only dashboard (home) and use menus are hardcoded here.
// componentPath = screen folder name — business screens: src/features/{domain}/{folder}/index.tsx,
//                  demos & guides: src/dev/pages/{folder}/index.tsx

// Whether to expose dev tools.
// - `pnpm dev` (import.meta.env.DEV) → always exposed
// - Build artifacts → exposed only when built with VITE_ENABLE_DEV_TOOLS=true
//
// Vite replaces both constants with literals at build time, so when folded to false,
// the devMenu object and dev screen imports (glob in componentRegistry.tsx) are completely tree-shaken.
//
// Never enable in production images — GuideInternalApi exposes internal API/store structure.
// An identical flag exists in componentRegistry.tsx; update both together when changing it.

// Dev-only menu tree.
// Member management menu tree
export const memberMenu: MenuItem = {
  key: 'members',
  label: 'Member Management',
  icon: 'UserOutlined',
  componentPath: 'MemberList',
  children: [
    {
      key: 'members',
      label: 'Member Management',
      componentPath: 'MemberList',
    },
  ],
};

// Content management menu tree
export const contentManagementMenu: MenuItem = {
  key: 'content-management',
  label: 'Content Management',
  icon: 'ReadOutlined',
  children: [
    {
      key: 'notice-management',
      label: 'Notice Management',
      componentPath: 'InquiryManagement',
    },
    {
      key: 'vamc-news-management',
      label: 'VAMC News Management',
      componentPath: 'InquiryManagement',
    },
    {
      key: 'npl-announcement-management',
      label: 'NPL Announcement Management',
      componentPath: 'InquiryManagement',
    },
    {
      key: 'inquiry-management',
      label: '1:1 Inquiry Management',
      componentPath: 'InquiryManagement',
    },
    {
      key: 'faq-management',
      label: 'FAQ Management',
      componentPath: 'FaqManagement',
    },
    {
      key: 'banner-management',
      label: 'Banner Management',
      componentPath: 'InquiryManagement',
    },
  ],
};

// Static menu labelKeys use the same namespace (`lbl.menu.*`) as server menus —
// managed in DB under the same SCRN_ID('AD_MN_00000') / LBL_SE_CD('MENU').
// useAllMenus() replaces only items with a labelKey using locale labels;
// items without it use `label` below as-is (dev tools tree is not translated, so omit it).
export const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    labelKey: 'lbl.menu.dashboard',
    icon: 'DashboardOutlined',
    componentPath: 'Dashboard',
  },
  // Do not place business menus here — the server (MENU_MNG) returns the IA-based tree.
  // Defining them statically here would duplicate the screen in the left rail.
  // Dev tools — tree-shaken away in builds where DEV_TOOLS_ENABLED is false.
  memberMenu,
  contentManagementMenu,
];
