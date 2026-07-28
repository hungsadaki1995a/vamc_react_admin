export interface Tab {
  key: string;
  menuKey: string;
  title: string;         // fallback display name (menuItem.label)
  componentKey: string;  // page component filename (= sceId)
  sceId?: string;        // screen ID — used by useScreenLabel, PageHeader code
  labelKey?: string;     // i18n label key — used by PageHeader title via t()
  params?: Record<string, unknown>; // navigateTab(key, params)로 전달된 화면 파라미터
  pinned: boolean;
  closable: boolean;
}
