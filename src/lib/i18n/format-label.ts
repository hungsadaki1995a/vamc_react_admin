/**
 * Replaces positional placeholders (`{0}`, `{1}`, …) in a label string with values.
 *
 * <p>The label table stores full sentences. Splitting sentences containing numbers like "1 error in 3 rows"
 * into fragments breaks word order in other languages, so keep the sentence whole and interpolate values.</p>
 *
 * <p>Placeholders without a value remain as-is — leaving them visible is better than silently
 * disappearing when a translation omits a placeholder or uses the wrong index.</p>
 *
 * @example
 * formatLabel(t('COMPONENT.VIEW.TEXT_excelErrorSummary', '{1} error(s) in {0} row(s)'), 3, 1)
 * // → '1 error(s) in 3 row(s)'
 */
export function formatLabel(template: string, ...values: Array<string | number>): string {
  return values.reduce<string>(
    (text, value, index) => text.split(`{${index}}`).join(String(value)),
    template,
  );
}
