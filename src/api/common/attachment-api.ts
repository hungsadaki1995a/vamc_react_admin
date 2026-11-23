import { apiClient } from '@/lib/api/client';

/**
 * Opens an attachment URL of the backend (`previewUrl` / `downloadUrl`) in a new tab.
 * The attachment API needs the bearer token, so a plain link or `window.open(url)` is answered 401:
 * the file is loaded through the authenticated client and shown from an object URL.
 * The tab is opened before the request so the browser still treats it as a user action (no pop-up block).
 */
export async function openAttachment(url: string): Promise<void> {
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  try {
    const response = await apiClient.get(url, { responseType: 'blob' });
    const objectUrl = window.URL.createObjectURL(response.data as Blob);
    if (tab) tab.location.href = objectUrl;
    else window.open(objectUrl, '_blank', 'noopener,noreferrer');
    // The tab needs the URL while it loads; release it afterwards
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}
