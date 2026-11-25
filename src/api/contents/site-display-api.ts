import i18n from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { apiGet, apiPut } from '@/api/common/api-utils';
import type { ContentFileGroup } from './post-api';

// Site Display Management settings — LogoController (`/api/v1/contents/logos`, menu A07060200, VPA07060201)
// and SloganController (`/api/v1/contents/slogans`, menu A07060300, VPA07060301).
// Each page edits one record: the user header logo (HEADER) and the user home hero slogan (MAIN_HERO).

/** Current header logo; fields are empty when none is registered. */
export interface LogoSetting {
  logoId?: string;
  positionId: string;
  imageFileId?: string;
  imageFileSeq?: number;
  /** Original file name, e.g. logo_vamc.png */
  imageFileName?: string;
  imagePreviewUrl?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

/** Current home hero slogan; fields are empty when none is registered. Lines are separated by `\n`. */
export interface SloganSetting {
  sloganId?: string;
  positionId: string;
  sloganVi?: string;
  sloganEn?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface SloganRequest {
  /** Max 100 characters, 2 lines. */
  sloganVi: string;
  sloganEn: string;
}

/** Business error codes of the two pages. */
export const SITE_DISPLAY_ERRORS = {
  /** E03 — logo not PNG / SVG or over 2MB. */
  logoImageInvalid: 'SDP001',
  /** Slogan with more than 2 lines. */
  sloganTooManyLines: 'SDP002',
} as const;

const LOGO_BASE = '/api/v1/contents/logos';
const SLOGAN_BASE = '/api/v1/contents/slogans';

export const getCurrentLogo = () => apiGet<LogoSetting>(`${LOGO_BASE}/current`);

/** Applies the uploaded image to the user header logo at once. */
export const saveLogo = (imageFileId: string) => apiPut<LogoSetting>(`${LOGO_BASE}/current`, { imageFileId });

/** Uploads one PNG / SVG of 2MB or less (multipart part `files`) → file group id for `saveLogo`. */
export async function uploadLogoImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('files', file);
  const { data } = await apiClient.post<{ data?: ContentFileGroup }>(`${LOGO_BASE}/images`, body);
  const fileUnqId = data.data?.fileUnqId;
  if (!fileUnqId) throw new Error(i18n.t('messages.api.uploadNoImageId'));
  return fileUnqId;
}

export const getCurrentSlogan = () => apiGet<SloganSetting>(`${SLOGAN_BASE}/current`);

/** Applies both slogans to the user home hero at once. */
export const saveSlogan = (request: SloganRequest) => apiPut<SloganSetting>(`${SLOGAN_BASE}/current`, request);
