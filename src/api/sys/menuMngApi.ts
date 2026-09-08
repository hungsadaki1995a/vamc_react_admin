import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MnuResponse } from '@/api/common/myMenuApi';

// ─────────────────────────────────────────────────────────────────────────────
// Admin 메뉴 관리 API — 시스템 운영 관리 도메인 (메뉴 A06030100 / 화면 SYS030101SC)
//
// ⚠️ 로그인 사용자의 권한 메뉴 트리(`/api/common/menus/my`)는 레일·플라이아웃 부트스트랩용이라
//    `@/api/common/myMenuApi` 에 있다. 여기에는 메뉴 관리 화면 전용 호출만 둔다.
//    응답 DTO(MnuResponse)는 두 호출이 같아 공용 파일의 타입을 그대로 쓴다.
//
// ⚠️ 등록/수정/삭제(`POST|PUT|DELETE /api/common/menus`)는 서버 컨트롤러가 아직 없다.
//    화면의 저장·삭제는 TODO 상태이며, 서버 구현 후 이 파일에 함수를 추가한다.
// ─────────────────────────────────────────────────────────────────────────────

export type { MnuResponse };

/** 메뉴 목록 조회조건 — 비우면(undefined) 조건 없음 */
export interface MenuListParams {
  /** DB LANG_CD(KR/EN/VN). 필수 — 서버가 이 값으로 다국어 메뉴명을 해석한다 */
  langCd: string;
  /** 메뉴코드 부분일치 */
  menuCd?: string;
  /** 메뉴명 부분일치 — 원본 메뉴명과 선택 언어 번역 중 어느 쪽에 걸려도 매치된다 */
  menuNm?: string;
}

/**
 * GET /api/common/menus/all — 권한과 무관한 전체 메뉴 목록 (평면 배열).
 *
 * 검색은 **서버가 한다.** 화면이 전건을 받아 걸러내면 데이터가 늘어날 때 그대로 사고가 된다.
 * langCd 는 DB LANG_CD(KR/EN/VN) 이며, 라벨 API 와 달리 X-Lang 헤더가 아니라 쿼리 파라미터를 본다.
 */
export async function getAllMenus(params: MenuListParams): Promise<ApiResponse<MnuResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/common/menus/all', {
    params,
  });
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}
