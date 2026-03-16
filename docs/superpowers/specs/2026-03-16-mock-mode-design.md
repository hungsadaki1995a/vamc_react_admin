# Mock Mode Design

**Date:** 2026-03-16
**Status:** Approved (v2 — spec review 반영)
**Scope:** MSW 기반 전체 API mock — 로그인 우회 + 모든 서버 호출 mock 응답

---

## 목표

서버 없이 `npm run dev:mock`으로 앱을 실행하고, 기존 코드를 수정하지 않고 mock 데이터로 모든 화면을 확인할 수 있게 한다.

---

## 기술 선택: MSW (Mock Service Worker)

- 네트워크 레벨에서 가로채므로 기존 axios 코드 전혀 수정 없음
- 브라우저 DevTools Network 탭에서 요청/응답 확인 가능
- 실서버 연동 시 MSW만 끄면 됨 (기존 코드 되돌림 불필요)

---

## 활성화 방식

`npm run dev:mock` → `cross-env`로 `VITE_MOCK=true` 환경변수 주입.
Windows 호환을 위해 `cross-env` 필요.

```json
// package.json scripts 추가
"dev:mock": "cross-env VITE_MOCK=true vite"
```

---

## main.tsx 수정

MSW worker가 시작된 후에만 React를 렌더링해야 앱 초기 API 호출이 가로채진다.
`prepare()` 안에서 IDB 캐시도 초기화한다.

```ts
async function prepare() {
  if (import.meta.env.VITE_MOCK === 'true') {
    // 1. Pre-seed localStorage: restoreSession이 user 없으면 즉시 logout하므로 필수
    initMockSession();
    // 2. IDB 캐시 초기화: 이전 실서버 데이터가 TTL 내에 있으면 mock 응답이 무시됨
    await clearMockCache();
    // 3. MSW worker 시작
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
});
```

### initMockSession()
`App.tsx`의 `restoreSession`이 `authStore.user.usrId` 없으면 즉시 logout 처리하므로,
MSW 시작 전에 `pms-auth` localStorage를 사전 세팅해야 한다.

```ts
// src/mocks/initMockSession.ts
export function initMockSession() {
  const authKey = 'pms-auth';
  const stored = localStorage.getItem(authKey);
  if (!stored) {
    localStorage.setItem(authKey, JSON.stringify({
      state: {
        user: { usrId: 'admin', usrNm: '관리자', email: 'admin@example.com' },
        roles: ['ROLE_ADMIN'],
      },
      version: 0,
    }));
  }
}
```

### clearMockCache()
labelStore/comcdStore는 IndexedDB TTL 캐시를 사용한다.
실서버 연동 후 mock 전환 시 캐시된 실서버 데이터가 5분간 유지되므로 초기화 필요.
`deleteDatabase`는 비동기이므로 완료를 기다린 후 MSW를 시작한다.

```ts
// src/mocks/clearMockCache.ts
export function clearMockCache(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('ds-pms-cache');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();   // 실패해도 계속 진행
    req.onblocked = () => resolve();
  });
}
```

---

## 파일 구조

```
src/mocks/
├── browser.ts              # MSW browser worker 설정
├── index.ts                # 모든 핸들러 통합 export
├── initMockSession.ts      # localStorage pms-auth 사전 세팅
├── clearMockCache.ts       # IDB 캐시 초기화
├── handlers/
│   ├── auth.ts             # /api/auth/public-key, /login, /refresh, /logout
│   ├── user.ts             # /api/usr/:usrId
│   ├── project.ts          # /api/proj/my
│   ├── menu.ts             # /api/mnu/auth-list
│   ├── label.ts            # /api/lbl/bulk
│   └── comcd.ts            # /api/comcd/all
└── data/
    ├── users.ts            # mock 유저 데이터 (UsrResponse shape)
    ├── projects.ts         # mock 프로젝트 2~3개
    ├── menus.ts            # mock 메뉴 트리 (MnuResponse shape)
    ├── labels.ts           # mock 라벨 (빈 객체)
    ├── comcds.ts           # mock 공통코드 (빈 배열)
    └── rsaKey.ts           # 테스트용 RSA-2048 공개키 (SPKI Base64)
```

---

## 실제 API 엔드포인트 (코드 확인)

| API 함수 | 실제 엔드포인트 |
|----------|----------------|
| `getMe(usrId)` | `GET /api/usr/:usrId` |
| `getMyProjects()` | `GET /api/proj/my` |
| `fetchAuthMenuList()` | `GET /api/mnu/auth-list` |
| `fetchBulkLabels()` | `GET /api/lbl/bulk` |
| `getAllCodeList()` | `GET /api/comcd/all` |
| `login()` | `POST /api/auth/login` |
| `fetchPublicKey()` | `GET /api/auth/public-key` |
| `refreshToken()` | `POST /api/auth/refresh` |

---

## Mock 응답 형식

### 중요: `status: 200` 필수

실제 API 함수들이 `data.status !== 200`으로 성공 여부를 판단하므로,
**모든 핸들러에 `status: 200` 포함 필수** (menu, label, user, project 모두 해당).

```ts
// 일반 ApiResponse 포맷 (menu, label, user, project, comcd)
HttpResponse.json({
  status: 200,
  success: true,
  message: 'success',
  data: mockData,
})
```

### login 응답: ApiResponse wrapper 없음

`LoginPage/api.ts`는 login을 `apiClient.post<LoginResponse>`로 호출 — raw 응답 기대.
`refreshToken()`도 동일.

```ts
// POST /api/auth/login, POST /api/auth/refresh
HttpResponse.json({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
})
```

### public-key 응답

`crypto.ts`의 `encryptPassword`는 실제 RSA-OAEP SubtleCrypto 암호화를 수행하므로,
유효한 RSA-2048 SPKI Base64 공개키를 반환해야 한다.
`data/rsaKey.ts`에 테스트용 고정 RSA 키쌍을 포함한다.

`fetchPublicKey()`는 두 shape를 모두 처리하므로 ApiResponse 포맷으로 반환한다:
```ts
// GET /api/auth/public-key
HttpResponse.json({ status: 200, data: { publicKey: MOCK_RSA_PUBLIC_KEY } })
```

mock `/api/auth/login` 핸들러는 암호화된 값을 무시하고 mock 토큰만 반환한다.

---

## Mock 인증 흐름

앱 로드 시 `App.tsx`의 `restoreSession` 동작:

1. `initMockSession()` → `pms-auth` localStorage 세팅 (usrId: 'admin')
2. `POST /api/auth/refresh` → MSW: mock accessToken 반환
3. `GET /api/usr/admin` → MSW: mock UsrResponse 반환
4. `GET /api/proj/my` → MSW: mock 프로젝트 목록 반환
5. `GET /api/mnu/auth-list` → MSW: mock 메뉴 트리 반환

---

## Mock 데이터 상세

### 유저 (`data/users.ts`) — UsrResponse shape 준수

```ts
export const mockUsr = {
  usrId: 'admin',
  usrNm: '관리자',
  email: 'admin@example.com',
  dpCd: 'DEV',
  dpNm: '개발팀',
  phnNo: '010-0000-0000',
  usrCCd: 'EMP',
  useYn: 'Y',
  pswdErrCnt: 0,
  lgnLockYn: 'N',
}
```

### 프로젝트 (`data/projects.ts`) — MyProjectResponseDto shape

```ts
export const mockProjects: MyProjectResponseDto[] = [
  { projId: 'PROJ-001', projNm: 'DS PMS 개발', projType: 'DEV', clnNm: '신한DS', ... },
  { projId: 'PROJ-002', projNm: '신한DS 운영', projType: 'OPS', clnNm: '신한DS', ... },
]
```

### 메뉴 (`data/menus.ts`) — MnuResponse shape 준수

`fetchAuthMenuList`가 `buildServerMenuTree(data.data)`로 처리하므로 `MnuResponse[]` 형태 필요.
`upMnuId: 'ROOT'`인 항목이 최상위 메뉴, `mnuXrsYn: 'Y'`이어야 노출됨.
앱 로그인 후 탐색이 가능하려면 최소 1개의 탐색 가능한 메뉴 항목이 있어야 한다.
(`componentPath` = `sceId` 필드가 실제 등록된 컴포넌트 경로와 일치해야 탭이 열린다)
단순 smoke test용으로는 최상위 메뉴 2개 + 리프 메뉴 3~4개면 충분하다.

### 라벨 (`data/labels.ts`)
```ts
export const mockLabels: Record<string, string> = {}
// 빈 객체 — labelStore.t(key)가 key 자체를 fallback으로 반환
```

### 공통코드 (`data/comcds.ts`)
```ts
export const mockComcds: CodeDetail[] = []
// 빈 배열 — 필요 시 점진적으로 추가
```

---

## public/ 설정

```bash
npx msw init public/ --save
```

`public/mockServiceWorker.js` 생성 — git에 커밋.

---

## 비기능 요건

- mock 모드는 개발 전용. `import.meta.env.VITE_MOCK` 체크로 prod 빌드 무관
- `onUnhandledRequest: 'bypass'` — 핸들러 없는 요청은 통과 (점진적 추가 용이)
- MSW 콘솔 로그로 요청 확인 가능

---

## 의존성 추가

```bash
npm install -D msw cross-env
```
