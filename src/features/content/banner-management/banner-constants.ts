// Constants and messages of Banner Management (VPA07060101 / VPA070601P01).

/** Design: at most 5 banners roll on the user home; [New] is disabled at 5. */
export const BANNER_MAX = 5;

/** One call loads every banner (the list has no pager). */
export const BANNER_LIST_SIZE = 50;

/** Position key of the user home banner area; the design has no position field. */
export const BANNER_DEFAULT_POSITION = 'MAIN_TOP';

export const BANNER_TITLE_MAX = 50;

/** Image rule: JPG / PNG, at most 10MB. */
export const BANNER_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
export const BANNER_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const BANNER_MESSAGES = {
  /** I01 */
  empty: 'There are no registered banners.',
  /** E03 */
  invalidImage: 'Only JPG, PNG files of 10MB or less can be uploaded.',
  /** C01 */
  confirmDelete: 'Are you sure you want to delete?',
  imageHint: 'JPG, PNG, max 10MB, recommended 1920 × 540px. It may be cropped from the center on mobile.',
  inUse: 'An active banner cannot be edited. Set Use to Inactive and save, then edit it.',
} as const;
