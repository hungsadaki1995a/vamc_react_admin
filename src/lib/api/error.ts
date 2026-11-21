import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';
import { useLabelStore } from '@/stores/label-store';

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Bad request.',
  401: 'Authentication is required.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  408: 'The request timed out.',
  422: 'Please check your input data.',
  429: 'Too many requests. Please try again later.',
  500: 'A server error occurred. Please try again later.',
  502: 'Unable to connect to the server.',
  503: 'The service is temporarily unavailable.',
};

const UNKNOWN_ERROR = 'An unknown error occurred.';

/**
 * Default HTTP status message — label table first, falling back to English constants above if unregistered.
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

/** Keeps only string → string entries of the backend `validation` map. */
function toValidationMap(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
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
  /** Per-field validation messages of a 400 `COM001` response (request field → message). */
  validation?: Record<string, string>;

  constructor(response: ApiErrorResponse) {
    super(response.message || httpMessage(response.statusCode) || unknownMessage());
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.path = response.path || '';
    this.timestamp = response.timestamp || new Date().toISOString();
    this.originalResponse = response;
    this.errorCode = response.errorCode;
    this.errorArgs = response.errorArgs;
    this.validation = response.validation;
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
      const data = response.data as Partial<ApiErrorResponse> & {
        errorCode?: string;
        errorArgs?: string[];
        validation?: unknown;
      };
      return new ApiError({
        code: data.code ?? 'E' + response.status,
        errorCode: data.errorCode,
        errorArgs: data.errorArgs,
        validation: toValidationMap(data.validation),
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
