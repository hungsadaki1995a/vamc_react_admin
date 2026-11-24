// Organization chart image rules (E03): jpg / jpeg / png, max 10MB.

export const CHART_IMAGE_E03 = 'Only PNG, JPG, JPEG files of 10MB or less can be uploaded.';
const EXTENSIONS = ['png', 'jpg', 'jpeg'];
const MAX_BYTES = 10 * 1024 * 1024;

/** True when the file may be uploaded as a chart image. */
export function isValidChartImage(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSIONS.includes(ext) && file.size <= MAX_BYTES;
}
