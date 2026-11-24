import { client } from '@/api/generated/client.gen';
import type { ContentFile } from './post-api';

export type { ContentFile };

export interface PageRequest {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface InquirySearchRequest {
  /**
   * Answer status: UNANSWERED (default), ANSWERED, ALL
   */
  answerStatus?: string;
  /**
   * Inquiry type (INQRY_SE_CD: CST consulting, ETC others)
   */
  category?: string;
  /**
   * Registration date from (dd/MM/yyyy)
   */
  fromDate?: string;
  /**
   * Registration date to (dd/MM/yyyy)
   */
  toDate?: string;
  /**
   * Keyword on post number, member number, inquirer name or title
   */
  keyword?: string;
}

export interface InquiryResponse {
  pstNo?: string;
  answerStatus?: string;
  category?: string;
  categoryNm?: string;
  title?: string;
  mbrNo?: string;
  /** Member login ID (masked) for General / Full members; absent for guests and Temporary members. */
  customerLoginId?: string;
  inquirerNm?: string;
  /** Number of attached files. */
  attachmentCount?: number;
  crtDt?: string;
  ansEmpNo?: string;
  ansEmpNm?: string;
  answeredAt?: string;
}

export interface PageResponseInquiryResponse {
  content?: InquiryResponse[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface ApiResponsePageResponseInquiryResponse {
  status?: number;
  message?: string;
  data?: PageResponseInquiryResponse;
}

/** Answer notification channel codes (EMAIL, ZALO). */
export type NotificationChannel = 'EMAIL' | 'ZALO' | string;

export interface InquiryDetailResponse {
  pstNo?: string;
  answerStatus?: string;
  category?: string;
  categoryNm?: string;
  title?: string;
  content?: string;
  mbrNo?: string;
  /** Member login ID (masked) for General / Full members; absent for guests and Temporary members. */
  customerLoginId?: string;
  inquirerNm?: string;
  inquirerEmail?: string;
  inquirerPhone?: string;
  answer?: string;
  ansEmpNo?: string;
  ansEmpNm?: string;
  crtDt?: string;
  answeredAt?: string;
  /** Answer notification channels: the ones used once answered, else the ones the answer will use. */
  notificationChannels?: NotificationChannel[];
  /** True when notificationChannels records a sent answer notification. */
  notificationSent?: boolean;
  /** Attachments of the inquiry (ATCH_FILE rows). */
  attachments?: ContentFile[];
}

export interface ApiResponseInquiryDetailResponse {
  status?: number;
  message?: string;
  data?: InquiryDetailResponse;
}

/**
 * List inquiries / Danh sách câu hỏi
 * GET /api/v1/contents/inquiries
 */
export const getInquiries = <ThrowOnError extends boolean = false>(options: {
  query: {
    pageRequest: PageRequest;
    cond: InquirySearchRequest;
  };
  querySerializer?: (params: unknown) => string;
  throwOnError?: ThrowOnError;
}) =>
  client.get<ApiResponsePageResponseInquiryResponse, unknown, ThrowOnError>({
    security: [{ scheme: 'bearer', type: 'http' }],
    url: '/api/v1/contents/inquiries',
    ...options,
  });

/**
 * Get inquiry detail / Chi tiết câu hỏi
 * GET /api/v1/contents/inquiries/{pstNo}
 */
export const getInquiry = <ThrowOnError extends boolean = false>(options: {
  path: {
    pstNo: string;
  };
  headers?: {
    'Accept-Language'?: 'vi' | 'en';
  };
  throwOnError?: ThrowOnError;
}) =>
  client.get<ApiResponseInquiryDetailResponse, unknown, ThrowOnError>({
    security: [{ scheme: 'bearer', type: 'http' }],
    url: '/api/v1/contents/inquiries/{pstNo}',
    ...options,
  });

export interface AnswerInquiryRequest {
  /**
   * Answer (HTML of the rich-text editor) / Nội dung trả lời (HTML)
   */
  answer: string;
}

/**
 * Answer inquiry / Trả lời câu hỏi
 * PUT /api/v1/contents/inquiries/{pstNo}/answer
 */
export const answerInquiry = <ThrowOnError extends boolean = false>(options: {
  path: {
    pstNo: string;
  };
  body: AnswerInquiryRequest;
  headers?: {
    'Accept-Language'?: 'vi' | 'en';
  };
  throwOnError?: ThrowOnError;
}) =>
  client.put<ApiResponseInquiryDetailResponse, unknown, ThrowOnError>({
    security: [{ scheme: 'bearer', type: 'http' }],
    url: '/api/v1/contents/inquiries/{pstNo}/answer',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
