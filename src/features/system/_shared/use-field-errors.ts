import { useCallback, useMemo, useState } from 'react';
import { apiErrorCode } from './system-utils';
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

  /** Maps a server error code to a field message; true when handled (caller toasts otherwise). */
  const applyApiError = useCallback(
    (error: unknown, map: Partial<Record<string, [K, string]>>): boolean => {
      const code = apiErrorCode(error);
      const target = code ? map[code] : undefined;
      if (!target) return false;
      setError(target[0], target[1]);
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
