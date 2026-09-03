export interface MenuItem {
  key: string;           // mnuId
  label: string;         // labelNm || mnuNm (display name)
  icon?: string;
  componentPath?: string; // sceId — page component filename
  sceId?: string;        // screen ID (e.g. "SYS030101SC")
  labelKey?: string;     // i18n label key (e.g. "CONFIG.MNU.TITLE_101001")
  children?: MenuItem[];
  hidden?: boolean;
  permissions?: string[];
  permType?: string;     // RD(읽기) | WT(쓰기) | AL(전체) | '' | undefined
}
