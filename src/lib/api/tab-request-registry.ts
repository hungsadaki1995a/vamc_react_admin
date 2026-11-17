/**
 * 탭별 진행 중(in-flight) API 요청 레지스트리.
 *
 * 각 요청은 발생 시점의 활성 탭(key)에 귀속되어 등록되고, 응답/에러 시 해제된다.
 * 탭을 닫을 때 {@link abortTabRequests} 로 그 탭의 미완료 요청을 일괄 취소한다 →
 * 닫힌 탭의 조회가 서버 응답까지 대기하며 전역 로딩바가 계속 도는 문제를 해소.
 *
 * 주의: 클라이언트 취소는 브라우저 대기/로딩바만 해제한다. 서버측 쿼리는 계속 수행된다
 * (서버 작업까지 중단하려면 별도의 협조적 취소가 필요).
 */
const registry = new Map<string, Set<AbortController>>();

/** 요청을 해당 탭에 귀속 등록. */
export function registerTabRequest(tabKey: string, ctrl: AbortController): void {
  let set = registry.get(tabKey);
  if (!set) {
    set = new Set();
    registry.set(tabKey, set);
  }
  set.add(ctrl);
}

/** 요청 완료(응답/에러/취소) 시 등록 해제. */
export function unregisterTabRequest(tabKey: string, ctrl: AbortController): void {
  const set = registry.get(tabKey);
  if (!set) return;
  set.delete(ctrl);
  if (set.size === 0) registry.delete(tabKey);
}

/** 탭 닫힘 시 그 탭에 귀속된 모든 미완료 요청을 취소. */
export function abortTabRequests(tabKey: string): void {
  const set = registry.get(tabKey);
  if (!set) return;
  // abort 핸들러(axios)가 unregister 를 호출할 수 있으므로 사본을 순회한다.
  for (const ctrl of [...set]) ctrl.abort();
  registry.delete(tabKey);
}
