import { useCallback, useMemo, useState } from 'react';
import { apiErrorCode, apiValidationErrors } from './system-utils';
import { SYS_MESSAGES } from './sys-messages';

// Inline field errors (E0x) of the v0.8 register/edit popups and edit panels.

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** Empty = undefined, null, blank string or empty array. */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * @example
 * const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<'formNo' | 'fileUrl'>();
 * if (!checkRequired(values, ['formNo', 'fileUrl'])) return;          // E01
 * try { await save() } catch (e) {
 *   if (!applyApiError(e, { FRM002: ['formNo', SYS_MESSAGES.duplicate('form no.')] })) toast.error(errorMessage(e));
 * }
 * // 400 COM001 field messages land under the fields too; map request names that differ from form keys:
 * applyApiError(e, {}, { fileUrl: 'fileUrl', formNm: 'formName' });
 */
export function useFieldErrors<K extends string>() {
  const [errors, setErrors] = useState<FieldErrors<K>>({});

  const setError = useCallback((key: K, message: string) => setErrors((prev) => ({ ...prev, [key]: message })), []);

  /** Clear on edit so the red border goes away as soon as the user types. */
  const clearError = useCallback(
    (key: K) =>
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    [],
  );

  const clearAll = useCallback(() => setErrors({}), []);

  /** Marks every empty `keys` field with E01; true when all are filled. Replaces previous errors. */
  const checkRequired = useCallback((values: Partial<Record<K, unknown>>, keys: K[]): boolean => {
    const next: FieldErrors<K> = {};
    keys.forEach((key) => {
      if (isEmpty(values[key])) next[key] = SYS_MESSAGES.required;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }, []);

  /**
   * Shows a rejected save under the fields; true when at least one field message was set
   * (the caller toasts otherwise).
   * - `codeMap`: business error code → [field, message] (E02 duplicates, E03 formats…).
   * - 400 validation map (`ApiError.validation`): each request field goes to `fieldMap[field]`,
   *   or to the same-named form key when `fieldMap` is omitted. Unmapped fields are ignored.
   */
  const applyApiError = useCallback(
    (
      error: unknown,
      codeMap: Partial<Record<string, [K, string]>> = {},
      fieldMap?: Partial<Record<string, K>>,
    ): boolean => {
      const code = apiErrorCode(error);
      const target = code ? codeMap[code] : undefined;
      if (target) {
        setError(target[0], target[1]);
        return true;
      }
      const validation = apiValidationErrors(error);
      if (!validation) return false;
      const next: FieldErrors<K> = {};
      Object.entries(validation).forEach(([field, message]) => {
        const key = fieldMap ? fieldMap[field] : (field as K);
        if (key) next[key] = message;
      });
      if (Object.keys(next).length === 0) return false;
      setErrors((prev) => ({ ...prev, ...next }));
      return true;
    },
    [setError],
  );

  const hasErrors = Object.keys(errors).length > 0;

  return useMemo(
    () => ({ errors, hasErrors, setError, clearError, clearAll, checkRequired, applyApiError }),
    [errors, hasErrors, setError, clearError, clearAll, checkRequired, applyApiError],
  );
}
