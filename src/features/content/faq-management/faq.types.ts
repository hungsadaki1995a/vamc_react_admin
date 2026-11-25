export type FaqPublishStatus = 'Y' | 'N' | string;

export type FaqItem = {
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
  statusLabel: string; // 'Published' | 'Unpublished'
  displayOrder?: number;
  /** 'Y' when the English question is provided. */
  hasEnglish?: string;
  viewCount?: number;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string | null;
  mdfcnBy?: string | null;
  mdfcnByNm?: string | null;
};
