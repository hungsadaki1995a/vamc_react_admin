# VAMC NPL ADMIN — API 연동 가이드

## API 클라이언트 설정

`apiClient` 하나만 사용 (`src/lib/api/client.ts`):

```
baseURL: VITE_API_BASE_URL  (예: http://localhost:8080)
timeout: 30,000ms
withCredentials: true       (RefreshToken 쿠키 전송)
Content-Type: application/json
```

환경 변수 (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## 요청 인터셉터

모든 요청에 자동 주입:

| 헤더 | 값 | 조건 |
|------|----|----|
| `Authorization` | `Bearer {accessToken}` | 로그인 상태 |
| `X-Project-Id` | 활성 프로젝트 ID | 프로젝트 선택 상태 |
| `X-Lang` | `ko` / `en` / `vi` | 항상 |

FormData 전송 시 `Content-Type` 헤더 자동 제거.

---

## 응답 포맷

프론트 타입은 `src/lib/api/types.ts`의 `ApiResponse<T>` 하나뿐입니다.

```typescript
interface ApiResponse<T = unknown> {
  status?: number;   // 서버가 실제로 내려주는 필드 (200 = 성공)
  success: boolean;  // 서버는 내려주지 않음 — API 함수가 status로부터 채운다
  message: string;
  data: T | null | undefined;
}
```

`useApiQuery` / `useApiMutation`은 **`success === true`** 로 성공/실패를 판단합니다.
반면 vamc-npl-backend가 실제로 내려주는 바디는 `{ status, message, data }` 뿐입니다.
따라서 **API 함수에서 `status → success` 변환이 필수**입니다. 빠뜨리면 `success`가
`undefined`(falsy)라 정상 응답도 실패로 처리됩니다.

---

## API 함수 작성

```typescript
// src/api/task.ts
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 서버 DTO 와 1:1 대응하는 타입은 이 파일에 코로케이트 (src/api/common/code.ts 참고)
export interface Task { taskId: string; taskNm: string; }

// baseURL 이 빈 값이므로 경로에 /api 접두를 반드시 포함한다 (Vite 프록시 → :8080)
export async function getTask(id: string): Promise<ApiResponse<Task>> {
  const { data } = await apiClient.get<ApiResponse<Task>>(`/api/task/${id}`);
  return { success: data.status === 200, message: data.message, data: data.data };
}

export async function getTaskList(): Promise<ApiResponse<Task[]>> {
  const { data } = await apiClient.get<ApiResponse<Task[]>>('/api/task/list');
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

export async function saveTask(payload: Partial<Task>): Promise<ApiResponse<Task>> {
  const { data } = await apiClient.post<ApiResponse<Task>>('/api/task', payload);
  return { success: data.status === 200, message: data.message, data: data.data };
}
```

실제 구현은 `src/api/sys/proj.ts`(`getMyProjects`), `src/api/common/menu.ts`(`fetchAuthMenuList`) 참고.
API 파일은 도메인 패키지 아래에 둔다 — `common/`(전역 부트스트랩) · `sys/`(시스템 운영 관리).

---

## useApiQuery — 데이터 조회

```typescript
import { useApiQuery } from '@/hooks/useApiQuery';
import { getTaskList } from '../api/myFeatureApi';

function MyList() {
  const { data: tasks = [], isLoading, error } = useApiQuery(
    ['tasks'],
    getTaskList,
  );
  return <GridTable rowData={tasks} columnDefs={...} loading={isLoading} />;
}
```

- `success === false` 또는 `data === null` → `ApiError` throw
- React Query의 `UseQueryOptions`를 세 번째 인수로 전달 가능

---

## useApiMutation — 데이터 변경

```typescript
import { useApiMutation } from '@/hooks/useApiMutation';
import { saveTask } from '../api/myFeatureApi';

function MyForm() {
  const { mutate, isPending } = useApiMutation(saveTask, {
    successMessage: '저장되었습니다.',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => console.error(err.message),
  });

  const handleSave = () => mutate(formData);
}
```

- `successMessage` 전달 시 성공 토스트 자동 표시 (`App.useApp().message`)
- `success === false` → `ApiError` throw → `onError` 호출

---

## 에러 처리

인터셉터가 HTTP 상태 코드별로 자동 처리:

| 상태 | 동작 |
|------|------|
| 401 | Silent Refresh 시도 → 실패 시 로그아웃 + `/login` 리디렉션 |
| 403 | '접근 권한이 없습니다.' 토스트 |
| 500+ | '서버 오류가 발생했습니다.' 토스트 |
| 네트워크 오류 | '네트워크 연결을 확인해 주세요.' 토스트 |

토스트 알림은 `ApiNotifyBridge` 컴포넌트 (App.tsx에 마운트)를 통해 Ant Design `message` API로 표시.

---

## Silent Refresh (자동 토큰 갱신)

```
요청 → 401 응답
  → isRefreshing 중이면 큐에 추가
  → POST /api/auth/refresh
  → 새 AccessToken 메모리 저장
  → 큐에 쌓인 실패 요청 재시도
  → 재시도도 401이면 → logout() + /login
```

RefreshToken은 httpOnly 쿠키 `refresh_token`으로 관리 (JS에서 접근 불가).

---

## 인증 API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/auth/login` | 로그인 | 불필요 |
| POST | `/api/auth/refresh` | 토큰 갱신 | 쿠키(자동) |
| POST | `/api/auth/logout` | 로그아웃 | Bearer |
| GET | `/api/mnu/auth-list` | 메뉴+권한 목록 | Bearer + X-Project-Id |
| GET | `/api/lbl/bulk` | 다국어 라벨 | 불필요 |
| GET | `/api/comcd/all` | 공통코드 전체 | 불필요 |

### 로그인 응답

```typescript
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;    // 'Bearer'
  expiresIn: number;    // 초 단위
}
```

---

## authStore 상태

| 필드 | 저장 위치 | 설명 |
|------|---------|------|
| `accessToken` | 메모리 (persist 없음) | Bearer 토큰 |
| `refreshToken` | 메모리 | httpOnly 쿠키 보완용 |
| `user` | localStorage | 사용자 정보 (UserInfo) |
| `roles` | localStorage | 역할 목록 |

```typescript
import { useAuthStore } from '@/stores/authStore';

const { user, isAuthenticated } = useAuthStore();
```
