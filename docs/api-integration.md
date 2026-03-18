# VAMC NPL ADMIN — API 연동 가이드

## API 클라이언트 설정

`apiClient` 하나만 사용 (`src/lib/api/client.ts`):

```
baseURL: VITE_API_BASE_URL  (예: http://localhost:8180)
timeout: 30,000ms
withCredentials: true       (RefreshToken 쿠키 전송)
Content-Type: application/json
```

환경 변수 (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:8180
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

### ds_pms_new (Spring Boot 레거시)

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

`success === true` → 정상, `false` → 오류.

리스트 응답은 `data` 안에 단일 키로 배열이 감싸짐:
```json
{ "success": true, "data": { "mtxTt": [...] } }
```

### vamc-npl-backend (현재 서버)

```typescript
interface VamcApiResponse<T> {
  status: number;   // 200 = 성공
  message: string;
  data: T | null;
}
```

---

## API 함수 작성

```typescript
// src/features/myFeature/api/myFeatureApi.ts
import { apiClient, fromList } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface Task { id: string; name: string; }

// 단건 조회
export const getTask = async (id: string): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  return data;
};

// 목록 조회 (배열이 data.mtxTt 키로 감싸진 경우)
export const getTaskList = async (): Promise<ApiResponse<Task[]>> => {
  const { data } = await apiClient.get<ApiResponse<{ mtxTt: Task[] }>>('/tasks/list');
  return fromList(data, 'mtxTt');
};

// 저장
export const saveTask = async (payload: Partial<Task>): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return data;
};
```

`fromList(res, key)` — 배열이 키로 감싸진 응답을 `ApiResponse<T[]>` 형태로 변환.

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
