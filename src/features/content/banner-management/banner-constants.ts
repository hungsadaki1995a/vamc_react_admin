// Constants of Banner Management (VPA07060101 / VPA070601P01).

/** Design: at most 5 banners roll on the user home; [New] is disabled at 5. */
export const BANNER_MAX = 5;

/** One call loads every banner (the list has no pager). */
export const BANNER_LIST_SIZE = 50;

/** Banner area of the user home; the server registers new banners there (the design has no position field). */
export const BANNER_HOME_POSITION = 'MAIN_TOP';

export const BANNER_TITLE_MAX = 50;

/** Image rule: JPG / PNG, at most 10MB. */
export const BANNER_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
export const BANNER_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
