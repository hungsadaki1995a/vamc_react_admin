import { useScreenLabel } from './useScreenLabel';

/**
 * 공유 컴포넌트 라벨의 화면ID.
 *
 * <p>`useScreenLabel` 은 sceId 를 탭 컨텍스트에서 가져오지만, 공유 컴포넌트
 * (FilterPanel · GridToolbar · 탭 컨텍스트 메뉴 · 엑셀 모달 …)는 어느 화면 안에서
 * 그려지느냐와 무관하게 같은 문구를 써야 한다. 그래서 sceId 를 이 값으로 고정한다.</p>
 *
 * <p>값은 기존 코드가 이미 쓰던 네임스페이스를 그대로 따른다 —
 * `ExcelUploadModal` · `AppModal` · `GridExternalPaginationFooter` 등이
 * `t('COMPONENT.VIEW.TEXT_...')` 형태로 직접 호출하고 있다.
 * DB 적재 시 `LANG_LBL.SCRN_ID` 도 이 값을 쓴다.</p>
 */
export const COMPONENT_SCE_ID = 'COMPONENT';

/**
 * 공유 컴포넌트 라벨 훅 — `useScreenLabel('COMPONENT')` 의 별칭.
 *
 * <p>문장에 값을 끼워야 하면 `formatLabel` 과 함께 쓴다.</p>
 *
 * @example
 * const { tvt, tvb } = useComponentLabel();
 * tvt('filterTitle', '검색 조건')   // → COMPONENT.VIEW.TEXT_filterTitle
 * tvb('search', '검색')             // → COMPONENT.VIEW.BTN_search
 */
export function useComponentLabel() {
  return useScreenLabel(COMPONENT_SCE_ID);
}
