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
// 등록/수정/삭제는 서버가 메뉴 행 + 메뉴 이름 라벨 + ADMIN 역할 매핑을 한 트랜잭션에서 처리한다.
//    셋 중 하나라도 빠지면 "저장은 됐는데 메뉴가 안 보인다" 가 되므로 화면에서 나눠 부르지 않는다.
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

// ── 쓰기 ────────────────────────────────────────────────────────────────────

/**
 * 메뉴 등록·수정 요청.
 *
 * 서버가 채우는 값은 보내지 않는다 —
 *   · `menuDpth` 는 상위 메뉴에서 계산한다 (화면에서도 읽기전용이다)
 *   · `lblCd` 를 비우면 `lbl.menu.{menuCd}` 규약으로 채운다
 */
export interface MenuSaveRequest {
  menuCd:       string;
  upMenuCd:     string;
  menuExpln:    string;   // 메뉴명(원본) — 번역이 없는 언어의 폴백
  menuSeq:      number;
  menuSeCd?:    string;   // 비우면 'A'
  useYn?:       string;   // 비우면 'Y'
  lblCd?:       string;
  menuUrlAddr?: string;   // 화면ID. 비우면 클릭 시 미구현 안내
  langCd?:      string;   // menuLblVal 과 함께 와야 번역이 저장된다
  menuLblVal?:  string;   // 선택 언어의 메뉴명
}

/** POST /api/common/menus — 메뉴 + 이름 라벨 + ADMIN 역할 매핑 등록 */
export async function createMenu(request: MenuSaveRequest): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/common/menus', request);
  return { success: data.status === 200, message: data.message, data: null };
}

/** PUT /api/common/menus/{menuCd} — 메뉴코드는 바꿀 수 없다 */
export async function updateMenu(request: MenuSaveRequest): Promise<ApiResponse<void>> {
  const { data } = await apiClient.put<ApiResponse<void>>(
    `/api/common/menus/${request.menuCd}`, request,
  );
  return { success: data.status === 200, message: data.message, data: null };
}

/** DELETE /api/common/menus/{menuCd} — 하위 메뉴가 있으면 서버가 400 을 낸다 */
export async function deleteMenu(menuCd: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/common/menus/${menuCd}`);
  return { success: data.status === 200, message: data.message, data: null };
}
