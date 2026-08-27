/**
 * 라벨 문자열의 위치 자리표시자(`{0}`, `{1}` …)를 값으로 치환한다.
 *
 * <p>라벨 테이블은 문장을 통째로 담는다. "총 3행 중 1행 오류" 처럼 숫자가 낀 문장을
 * 조각으로 쪼개면 어순이 다른 언어에서 문장이 깨지므로, 문장은 하나로 두고 값만 끼운다.</p>
 *
 * <p>값이 없는 자리표시자는 원문 그대로 남는다 — 번역문에 자리표시자가 빠지거나
 * 번호가 틀렸을 때 조용히 사라지는 것보다 눈에 띄는 편이 낫다.</p>
 *
 * @example
 * formatLabel(t('COMPONENT.VIEW.TEXT_excelErrorSummary', '총 {0}행 중 {1}행 오류'), 3, 1)
 * // → '총 3행 중 1행 오류'
 */
export function formatLabel(template: string, ...values: Array<string | number>): string {
  return values.reduce<string>(
    (text, value, index) => text.split(`{${index}}`).join(String(value)),
    template,
  );
}
