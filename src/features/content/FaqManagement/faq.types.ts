export type FaqPublishStatus = 'Y' | 'N' | string;

export interface FaqItem {
  no: number;
  id: string;
  pstNo?: string;
  category?: string;
  categoryNm?: string;
  title: string;       // Question (Vietnamese / Default)
  content?: string;    // Answer (Vietnamese / Default)
  titleEn?: string;    // Question (English)
  contentEn?: string;  // Answer (English)
  published: FaqPublishStatus; // 'Y' | 'N'
  statusLabel: string; // 'Posted' | 'Not Posted'
  displayOrder?: number;
  viewCount?: number;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string | null;
  mdfcnBy?: string | null;
  mdfcnByNm?: string | null;
}

export interface FaqFilterState {
  published: string;   // '' for All, 'Y' for Posted, 'N' for Not Posted
  category: string;    // Default 'FAQS'
  fromDate: string;    // Default '01/10/2026'
  toDate: string;      // Default current day 'DD/MM/YYYY'
  keyword: string;
}

