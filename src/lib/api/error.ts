import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';
import { useLabelStore } from '@/stores/label-store';

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

const UNKNOWN_ERROR = '알 수 없는 오류가 발생했습니다.';

/**
 * Default HTTP status message — label table first, falling back to Korean constants above if unregistered.
 *
 * <p>Called outside React (axios interceptor), so read via `getState()` instead of a hook.
 * Labels are replaced wholesale on locale change, so reading each time always reflects the current language.</p>
 */
function httpMessage(statusCode: number | undefined): string | undefined {
  if (statusCode === undefined) return undefined;
  const fallback = DEFAULT_MESSAGES[statusCode];
  const key = `MESSAGE.ERROR.TEXT_HTTP${statusCode}`;
  const msg = useLabelStore.getState().t(key, fallback);
  // If neither label nor fallback exists for the status code, the key string is returned — that is not a message.
  return msg === key ? fallback : msg;
}

/** Final fallback when no message is found anywhere */
function unknownMessage(): string {
  return useLabelStore.getState().t('MESSAGE.ERROR.TEXT_UNKNOWN', UNKNOWN_ERROR);
}

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
    super(response.message || httpMessage(response.statusCode) || unknownMessage());
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.path = response.path || '';
    this.timestamp = response.timestamp || new Date().toISOString();
    this.originalResponse = response;
    this.errorCode = response.errorCode;
    this.errorArgs = response.errorArgs;
  }

  get userMessage(): string {
    // Priority 1: look up by errorCode in DB labels
    if (this.errorCode) {
      const { t } = useLabelStore.getState();
      const key = `MESSAGE.ERROR.TEXT_${this.errorCode}`;
      let msg = t(key);
      // If key is returned as-is, unregistered in DB → fallback
      if (msg !== key) {
        if (this.errorArgs?.length) {
          this.errorArgs.forEach((arg, i) => {
            msg = msg.replace(`$${i + 1}`, arg);
          });
        }
        return msg;
      }
    }
    // Priority 2: server message → HTTP default message → fallback
    return this.originalResponse.message
      || httpMessage(this.statusCode)
      || unknownMessage();
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
        message: data.message || httpMessage(response.status) || unknownMessage(),
        statusCode: data.statusCode ?? response.status,
        timestamp: data.timestamp || new Date().toISOString(),
        path: data.path || error.config?.url || '',
      });
    }

    return new ApiError({
      code: 'E' + (response?.status ?? '000'),
      data: null,
      message: httpMessage(response?.status) || unknownMessage(),
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
      message: error instanceof Error ? error.message : unknownMessage(),
      statusCode: 0,
      timestamp: new Date().toISOString(),
      path: '',
    });
  }
}
