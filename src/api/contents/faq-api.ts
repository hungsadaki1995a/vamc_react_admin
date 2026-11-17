import {
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  updateFaqStatus,
  deleteFaqs,
  publishFaqs,
  reorderFaqs,
} from '@/api/generated/sdk.gen';

export type {
  PageRequest,
  PostSearchRequest,
  PostResponse,
  PostDetailResponse,
  PageResponsePostResponse,
  ApiResponsePageResponsePostResponse,
  ApiResponsePostDetailResponse,
  CreateFaqRequest,
  UpdateFaqRequest,
  UpdatePostStatusRequest,
  DeletePostsRequest,
  PublishPostsRequest,
  ReorderFaqRequest,
} from '@/api/generated/types.gen';

export {
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  updateFaqStatus,
  deleteFaqs,
  publishFaqs,
  reorderFaqs,
};

