export interface MenuItem {
  key: string;           // mnuId
  label: string;         // labelNm || mnuNm (display name)
  icon?: string;
  componentPath?: string; // sceId — page component filename
  sceId?: string;        // screen ID (e.g. "CCO101001SC")
  labelKey?: string;     // i18n label key (e.g. "CONFIG.MNU.TITLE_101001")
  children?: MenuItem[];
  hidden?: boolean;
  permissions?: string[];
  permType?: string;     // M(읽기+수정) | S(읽기만) | '' | undefined
}
