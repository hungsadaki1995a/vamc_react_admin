export type MenuItem = {
  key: string;           // mnuId
  label: string;         // labelNm || mnuNm (display name)
  icon?: string;
  componentPath?: string; // sceId — page component filename
  sceId?: string;        // screen ID (e.g. "SYS030101SC")
  labelKey?: string;     // i18n label key (e.g. "CONFIG.MNU.TITLE_101001")
  children?: MenuItem[];
  hidden?: boolean;
  permissions?: string[];
  permType?: string;     // RD(Read) | WT(Write) | AL(All) | '' | undefined
};

export type MenuTreeItem = {
  menuCd?: string;
  upMenuCd?: string;
  lblCd?: string;
  menuSeq?: number;
  menuDpth?: number;
  menuNmDisplay?: string;
  sortPath?: string;
  menuLblVal?: string;
  menuUrlAddr?: string;
  menuAuthrt?: string;
  children?: MenuTreeItem[];
};
