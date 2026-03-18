import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';
import { useLabelStore } from '@/stores/labelStore';

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
  /** DB label key code (e.g. "E100040") */
  errorCode?: string;
  /** Label substitution args for $1, $2, ... */
  errorArgs?: string[];

  constructor(response: ApiErrorResponse) {
    super(response.message || DEFAULT_MESSAGES[response.statusCode] || '알 수 없는 오류가 발생했습니다.');
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.path = response.path || '';
    this.timestamp = response.timestamp || new Date().toISOString();
    this.originalResponse = response;
    this.errorCode = response.errorCode;
    this.errorArgs = response.errorArgs;
  }

  get userMessage(): string {
    // 1순위: DB 라벨에서 errorCode로 조회
    if (this.errorCode) {
      const { t } = useLabelStore.getState();
      const key = `MESSAGE.ERROR.TEXT_${this.errorCode}`;
      let msg = t(key);
      // 키 그대로 반환되면 DB 미등록 → fallback
      if (msg !== key) {
        if (this.errorArgs?.length) {
          this.errorArgs.forEach((arg, i) => {
            msg = msg.replace(`$${i + 1}`, arg);
          });
        }
        return msg;
      }
    }
    // 2순위: 서버 메시지 → HTTP 기본 메시지 → 폴백
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
      const data = response.data as Partial<ApiErrorResponse> & { errorCode?: string; errorArgs?: string[] };
      return new ApiError({
        code: data.code ?? 'E' + response.status,
        errorCode: data.errorCode,
        errorArgs: data.errorArgs,
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
