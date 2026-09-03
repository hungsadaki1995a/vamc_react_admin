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

/**
 * GET /api/common/menus/all — 권한과 무관한 전체 메뉴 목록 (평면 배열).
 *
 * langCd 는 DB LANG_CD(KR/EN/VN) 다. 서버가 이 값으로 MENU_LBL_VAL 을 해석하며,
 * X-Lang 헤더가 아니라 쿼리 파라미터를 본다.
 */
export async function getAllMenus(langCd: string): Promise<ApiResponse<MnuResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/common/menus/all', {
    params: { langCd },
  });
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}
