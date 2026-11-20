// Constants shared by the System Operation Management screens (Figma v0.8).

/** Fixed list size of every v0.8 list ("Fixed 20 items per page"). */
export const SYS_PAGE_SIZE = 20;

/** Display formats of the v0.8 design. */
export const SYS_DATE_FORMAT = 'DD-MM-YYYY';
export const SYS_DATETIME_FORMAT = 'DD-MM-YYYY HH:mm';
export const SYS_DATETIME_SEC_FORMAT = 'DD-MM-YYYY HH:mm:ss';

/** Date param formats the backend accepts (varies per endpoint — check the DTO). */
export const API_DATE_ISO = 'YYYY-MM-DD';
export const API_DATE_DMY = 'DD/MM/YYYY';

export type YesNo = 'Y' | 'N';

/** Select value for "All": empty string, dropped from the query by `cleanParams`. */
export const ALL = '';

/** Use filter select: All (default) / Active / Inactive. */
export const USE_YN_FILTER_OPTIONS: { value: '' | YesNo; label: string }[] = [
  { value: ALL, label: 'All' },
  { value: 'Y', label: 'Active' },
  { value: 'N', label: 'Inactive' },
];

/** Use radio of the register/edit popups: Active (default) / Inactive. */
export const USE_YN_RADIO_OPTIONS: { value: YesNo; label: string }[] = [
  { value: 'Y', label: 'Active' },
  { value: 'N', label: 'Inactive' },
];
