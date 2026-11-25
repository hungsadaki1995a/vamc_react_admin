import {
  getFaqs,
  getFaq,
  updateFaq,
  updateFaqStatus,
  deleteFaqs,
  publishFaqs,
  reorderFaqs,
} from '@/api/generated/sdk.gen';
import { apiPatch, apiPost } from '@/api/common/api-utils';
import type {
  CreateFaqRequest as GeneratedCreateFaqRequest,
  PostDetailResponse as GeneratedPostDetailResponse,
  PostResponse as GeneratedPostResponse,
} from '@/api/generated/types.gen';

export type {
  PageRequest,
  PostSearchRequest,
  PageResponsePostResponse,
  ApiResponsePageResponsePostResponse,
  ApiResponsePostDetailResponse,
  UpdateFaqRequest,
  UpdatePostStatusRequest,
  DeletePostsRequest,
  PublishPostsRequest,
  ReorderFaqRequest,
} from '@/api/generated/types.gen';

/** FAQ list row: the generated type plus the fields the FAQ list returns. */
export type PostResponse = GeneratedPostResponse & {
  /** Rank among the published FAQs of the category; absent when unpublished. */
  displayOrder?: number;
  /** 'Y' when the English question is provided. */
  hasEnglish?: string;
};

/** FAQ detail: the generated type plus the display order of the popup spin box. */
export type PostDetailResponse = GeneratedPostDetailResponse & {
  /** Current display order; absent when unpublished. */
  displayOrder?: number;
  /** Largest order when published (other published FAQs of the category + 1). */
  displayOrderMax?: number;
};

export type CreateFaqRequest = GeneratedCreateFaqRequest & {
  /** Order among the published FAQs of the category when published (default 1). */
  displayOrder?: number;
};

/** POST /api/v1/contents/faqs — rejects (CNT031) an order outside 1..published + 1. */
export const createFaq = (body: CreateFaqRequest) => apiPost<PostDetailResponse>('/api/v1/contents/faqs', body);

/** PATCH /api/v1/contents/faqs/{pstNo}/display-order — moves a published FAQ; the others shift by one. */
export const updateFaqDisplayOrder = (pstNo: string, displayOrder: number) =>
  apiPatch<PostDetailResponse>(`/api/v1/contents/faqs/${encodeURIComponent(pstNo)}/display-order`, {
    displayOrder,
  });

export { getFaqs, getFaq, updateFaq, updateFaqStatus, deleteFaqs, publishFaqs, reorderFaqs };
