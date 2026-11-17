import { client } from '@/api/generated/client.gen';

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
  inquirerNm?: string;
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

export interface ContentFileResponse {
  fileUnqId?: string;
  fileNm?: string;
  fileSize?: number;
  fileExtn?: string;
  fileUrl?: string;
}

export interface InquiryDetailResponse {
  pstNo?: string;
  answerStatus?: string;
  category?: string;
  categoryNm?: string;
  title?: string;
  content?: string;
  mbrNo?: string;
  inquirerNm?: string;
  inquirerEmail?: string;
  inquirerPhone?: string;
  answer?: string;
  ansEmpNo?: string;
  ansEmpNm?: string;
  crtDt?: string;
  answeredAt?: string;
  attachments?: Array<ContentFileResponse>;
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
   * Answer text / Nội dung trả lời
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
