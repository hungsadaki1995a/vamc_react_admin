import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';

const DEFAULT_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다.',
  401: '인증이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  408: '요청 시간이 초과되었습니다.',
  422: '입력 데이터를 확인해 주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  502: '서버에 연결할 수 없습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',
};

export class ApiError extends Error {
  statusCode: number;
  path: string;
  timestamp: string;
  originalResponse: ApiErrorResponse;

  constructor(response: ApiErrorResponse) {
    super(response.message || DEFAULT_MESSAGES[response.statusCode] || '알 수 없는 오류가 발생했습니다.');
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.path = response.path || '';
    this.timestamp = response.timestamp || new Date().toISOString();
    this.originalResponse = response;
  }

  get userMessage(): string {
    return this.originalResponse.message
      || DEFAULT_MESSAGES[this.statusCode]
      || '알 수 없는 오류가 발생했습니다.';
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const response = error.response;

    if (response?.data && typeof response.data === 'object') {
      const data = response.data as Partial<ApiErrorResponse>;
      return new ApiError({
        code: data.code ?? 'E' + response.status,
        data: null,
        message: data.message || DEFAULT_MESSAGES[response.status] || '오류가 발생했습니다.',
        statusCode: data.statusCode ?? response.status,
        timestamp: data.timestamp || new Date().toISOString(),
        path: data.path || error.config?.url || '',
      });
    }

    return new ApiError({
      code: 'E' + (response?.status ?? '000'),
      data: null,
      message: DEFAULT_MESSAGES[response?.status ?? 0] || '오류가 발생했습니다.',
      statusCode: response?.status ?? 0,
      timestamp: new Date().toISOString(),
      path: error.config?.url || '',
    });
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof Error && 'isAxiosError' in error) {
      return ApiError.fromAxiosError(error as AxiosError);
    }

    return new ApiError({
      code: 'E000',
      data: null,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: '',
    });
  }
}
