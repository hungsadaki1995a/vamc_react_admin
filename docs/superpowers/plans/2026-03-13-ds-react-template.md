# ds_react_template Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ds_pms_client를 복사해 서버 연동 없이 mock 데이터만으로 동작하는 ds_react_template 프로젝트 생성

**Architecture:** 프로젝트를 복사 후 5개 서버 연동 지점을 Mock Service Layer(src/mock/services/)로 교체. 컴포넌트/store 구조 변경 없음.

**Tech Stack:** React 19, TypeScript, Vite 7, Ant Design 6, Zustand 5

---

## Chunk 1: 프로젝트 복사 및 초기 설정

**Files:**
- Create: `ds_react_template/` (복사)
- Modify: `ds_react_template/package.json`
- Modify: `ds_react_template/index.html`
- Create: `ds_react_template/.env.local`

- [ ] **Step 1: 프로젝트 복사**

```bash
cd /d/sdtdevtool-shinhanDs/workspace/ds_pms
rsync -av --progress ds_pms_client/ ds_react_template/ \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env.local' \
  --exclude='sessions' \
  --exclude='events.jsonl' \
  --exclude='statuses' \
  --exclude='views.json'
```

- [ ] **Step 2: package.json name 변경**

`ds_react_template/package.json`에서:
```json
"name": "ds-react-template",
```

- [ ] **Step 3: index.html title 변경**

`ds_react_template/index.html`에서:
```html
<title>DS React Template</title>
```

- [ ] **Step 4: .env.local 생성**

`ds_react_template/.env.local` 내용:
```
VITE_API_BASE_URL=http://localhost:__mock__
```

- [ ] **Step 5: npm install**

```bash
cd /d/sdtdevtool-shinhanDs/workspace/ds_pms/ds_react_template
npm install
```

---

## Chunk 2: Mock Service 파일 생성

**Files:**
- Create: `src/mock/labels.ts`
- Create: `src/mock/services/authService.ts`
- Create: `src/mock/services/labelService.ts`
- Create: `src/mock/services/menuService.ts`
- Create: `src/mock/services/projectService.ts`
- Create: `src/mock/services/comcdService.ts`
- Create: `src/mock/services/usrService.ts`

- [ ] **Step 1: labels.ts 생성**

`src/mock/labels.ts`:
```ts
export const mockLabels: Record<string, string> = {};
```

- [ ] **Step 2: authService.ts 생성**

`src/mock/services/authService.ts`:
```ts
import type { LoginResponse, MeResponse } from '@/lib/api/types';

export function mockLogin(_username: string, _password: string): LoginResponse {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 7200,
  };
}

export function mockGetMe(): MeResponse {
  return {
    usrId: 'admin',
    usrNm: '관리자',
    email: 'admin@mock.local',
    dpCd: 'DEPT001',
    usrCCd: 'USR001',
    phnNo: '',
    roles: ['ROLE_ADMIN'],
  };
}
```

- [ ] **Step 3: labelService.ts 생성**

`src/mock/services/labelService.ts`:
```ts
import { mockLabels } from '@/mock/labels';

export async function mockLoadLabels(): Promise<Record<string, string>> {
  return mockLabels;
}
```

- [ ] **Step 4: menuService.ts 생성**

`src/mock/services/menuService.ts`:
```ts
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

function withPermType(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    permType: 'M' as const,
    children: item.children ? withPermType(item.children) : undefined,
  }));
}

export async function mockLoadMenus(): Promise<MenuItem[]> {
  return withPermType(menuConfig);
}
```

- [ ] **Step 5: projectService.ts 생성**

`src/mock/services/projectService.ts`:
```ts
import type { MyProjectResponseDto } from '@/lib/api/types';

export async function mockLoadProjects(): Promise<MyProjectResponseDto[]> {
  return [
    {
      projId: 'PJ001',
      projNm: '샘플 프로젝트',
      projType: 'DEV',
      clnNm: null,
      bzDpNm: null,
      pmId: 'admin',
      adminId: 'admin',
      pnSrDt: null,
      pnEdDt: null,
      rltSrDt: null,
      rltEdDt: null,
      bigo: null,
      rgDttm: '',
      roles: [],
    },
  ];
}
```

- [ ] **Step 6: comcdService.ts 생성**

`src/mock/services/comcdService.ts`:
```ts
import type { CodeDetail } from '@/api/common';

export async function mockLoadCodes(): Promise<CodeDetail[]> {
  return [];
}
```

- [ ] **Step 7: usrService.ts 생성**

CCO101001SC에서 사용하는 User 타입에 맞는 mock 사용자 목록.

`src/mock/services/usrService.ts`:
```ts
import type { ApiResponse } from '@/lib/api/types';
import type { User } from '@/features/cco/CCO101001SC/types';

const MOCK_USR_LIST: User[] = [
  { usrId: 'admin',  usrNm: '관리자', cpNm: '', email: 'admin@mock.local', dpCd: 'DEPT001', dpNm: '개발1팀', jbtCd: '', jbcCd: '', gdCd: '', stdCost: '0', phnNo: '', usrIp: '', mrCont: '', grpNm: '' },
  { usrId: 'user01', usrNm: '김영수', cpNm: '', email: 'kim@mock.local',   dpCd: 'DEPT001', dpNm: '개발1팀', jbtCd: '', jbcCd: '', gdCd: '', stdCost: '0', phnNo: '', usrIp: '', mrCont: '', grpNm: '' },
  { usrId: 'user02', usrNm: '이미영', cpNm: '', email: 'lee@mock.local',   dpCd: 'DEPT002', dpNm: '개발2팀', jbtCd: '', jbcCd: '', gdCd: '', stdCost: '0', phnNo: '', usrIp: '', mrCont: '', grpNm: '' },
];

export async function mockGetUsrList(
  params: { usrId?: string; usrNm?: string },
): Promise<ApiResponse<User[]>> {
  let list = MOCK_USR_LIST;
  if (params.usrId) list = list.filter((u) => u.usrId.includes(params.usrId!));
  if (params.usrNm) list = list.filter((u) => u.usrNm.includes(params.usrNm!));
  return { success: true, message: 'success', data: list };
}

export async function mockSaveUsr(_req: User): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockDeleteUsr(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockResetPwdErrCnt(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockResetPwd(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}

export async function mockUnlockUsr(_usrId: string): Promise<ApiResponse<void>> {
  return { success: true, message: 'success', data: undefined };
}
```

---

## Chunk 3: Store 및 API 파일 교체

**Files:**
- Modify: `src/features/auth/LoginPage/api.ts`
- Modify: `src/api/user.ts`
- Modify: `src/stores/labelStore.ts`
- Modify: `src/stores/comcdStore.ts`
- Modify: `src/stores/projectStore.ts`
- Modify: `src/stores/menuStore.ts`
- Modify: `src/api/usr.ts`

- [ ] **Step 1: LoginPage/api.ts 교체**

`login()` 함수를 mock으로 교체. `logout()`, `refreshToken()`은 no-op으로 처리.

```ts
import { mockLogin } from '@/mock/services/authService';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return { success: true, message: 'success', data: mockLogin(req.username, req.password) };
}

export async function logout(): Promise<ApiResponse<null>> {
  return { success: true, message: 'success', data: null };
}

export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  return { success: true, message: 'success', data: { accessToken: 'mock-access-token' } };
}
```

- [ ] **Step 2: api/user.ts 교체 (getMe)**

```ts
import { mockGetMe } from '@/mock/services/authService';
import type { ApiResponse, MeResponse } from '@/lib/api/types';

export async function getMe(_usrId: string): Promise<ApiResponse<MeResponse>> {
  return { success: true, message: 'success', data: mockGetMe() };
}
```

- [ ] **Step 3: labelStore.ts 교체**

`loadLabels()` 내부의 IDB 캐시 + `fetchBulkLabels()` 블록을 `mockLoadLabels()` 단일 호출로 교체.

```ts
import { create } from 'zustand';
import { mockLoadLabels } from '@/mock/services/labelService';

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  loading: boolean;
  loadLabels: () => Promise<void>;
  t: (key: string) => string;
}

export const useLabelStore = create<LabelStore>()((set, get) => ({
  labels: {},
  labelsVersion: 0,
  loading: false,

  loadLabels: async () => {
    const labels = await mockLoadLabels();
    set((s) => ({ labels, labelsVersion: s.labelsVersion + 1 }));
  },

  t: (key) => get().labels[key] ?? key,
}));
```

- [ ] **Step 4: comcdStore.ts 교체**

`loadCodes()` 내부의 IDB 캐시 + `getAllCodeList()` 블록을 `mockLoadCodes()`로 교체.

```ts
import { create } from 'zustand';
import { mockLoadCodes } from '@/mock/services/comcdService';
import type { CodeDetail } from '@/api/common';

interface SelectOption { label: string; value: string; }

interface ComcdStore {
  codes: Record<string, CodeDetail[]>;
  loading: boolean;
  loadCodes: () => Promise<void>;
  getOptions: (cdDmnId: string) => SelectOption[];
  getCodeName: (cdDmnId: string, cd: string) => string;
}

function groupByMain(list: CodeDetail[]): Record<string, CodeDetail[]> {
  const grouped: Record<string, CodeDetail[]> = {};
  for (const item of list) {
    if (!grouped[item.cdDmnId]) grouped[item.cdDmnId] = [];
    grouped[item.cdDmnId].push(item);
  }
  return grouped;
}

export const useComcdStore = create<ComcdStore>()((set, get) => ({
  codes: {},
  loading: false,

  loadCodes: async () => {
    const list = await mockLoadCodes();
    set({ codes: groupByMain(list) });
  },

  getOptions: (cdDmnId) =>
    (get().codes[cdDmnId] ?? []).map((c) => ({ label: c.cdNm, value: c.cd })),

  getCodeName: (cdDmnId, cd) =>
    get().codes[cdDmnId]?.find((c) => c.cd === cd)?.cdNm ?? cd,
}));
```

- [ ] **Step 5: projectStore.ts 교체**

`fetchMyProjects()` 내부 `getMyProjects()` → `mockLoadProjects()` 교체.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockLoadProjects } from '@/mock/services/projectService';
import type { MyProjectResponseDto } from '@/lib/api/types';

export interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectStore {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  myProjects: MyProjectResponseDto[];
  myProjectsLoading: boolean;
  fetchMyProjects: () => Promise<void>;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      activeProject: null,
      myProjects: [],
      myProjectsLoading: false,

      setActiveProject: (project) => set({ activeProject: project }),

      fetchMyProjects: async () => {
        set({ myProjectsLoading: true });
        try {
          const projects = await mockLoadProjects();
          set({ myProjects: projects });
          const prev = get().activeProject;
          const stillExists = prev && projects.some((p) => p.projId === prev.id);
          if (!stillExists && projects.length > 0) {
            const first = projects[0];
            set({ activeProject: { id: first.projId, name: first.projNm ?? first.projId, status: 'active' } });
          } else if (projects.length === 0) {
            set({ activeProject: null });
          }
        } catch {
          // silent
        } finally {
          set({ myProjectsLoading: false });
        }
      },

      clearProjects: () => set({ myProjects: [], activeProject: null }),
    }),
    {
      name: 'pms-project',
      partialize: (state) => ({
        activeProject: state.activeProject,
        myProjects: state.myProjects,
      }),
    },
  ),
);
```

- [ ] **Step 6: menuStore.ts 교체**

`loadMenuForProject()` 내부의 IDB 캐시 + `fetchAuthMenuList()` → `mockLoadMenus()` 교체.

`loadMenuForProject` 함수만 교체 (나머지 store 로직 동일):

```ts
  loadMenuForProject: async () => {
    if (get().menuLoading) return;
    set({ menuLoading: true });
    try {
      const menus = await mockLoadMenus();
      set({ serverMenus: menus, menuLoading: false });
    } catch {
      set({ menuLoading: false });
    }
  },
```

상단 import 교체:
```ts
// 제거: import { fetchAuthMenuList } from '@/api/menu';
// 제거: import { idbGet, idbSet } from '@/lib/cache/idbCache';
// 추가:
import { mockLoadMenus } from '@/mock/services/menuService';
```

- [ ] **Step 7: api/usr.ts 교체 (CCO101001SC API)**

```ts
import { mockGetUsrList, mockSaveUsr, mockDeleteUsr, mockResetPwdErrCnt, mockResetPwd, mockUnlockUsr } from '@/mock/services/usrService';
import type { ApiResponse } from '@/lib/api/types';
import type { User } from '@/features/cco/CCO101001SC/types';

export async function getUsrList(params: { usrId?: string; usrNm?: string; dpCd?: string }): Promise<ApiResponse<User[]>> {
  return mockGetUsrList(params);
}

export async function saveUsr(req: User): Promise<ApiResponse<void>> {
  return mockSaveUsr(req);
}

export async function deleteUsr(usrId: string): Promise<ApiResponse<void>> {
  return mockDeleteUsr(usrId);
}

export async function resetPwdErrCnt(usrId: string): Promise<ApiResponse<void>> {
  return mockResetPwdErrCnt(usrId);
}

export async function resetPwd(usrId: string): Promise<ApiResponse<void>> {
  return mockResetPwd(usrId);
}

export async function unlockUsr(usrId: string): Promise<ApiResponse<void>> {
  return mockUnlockUsr(usrId);
}
```

- [ ] **Step 8: LoginPage/index.tsx — fetchAuthMenuList 교체**

`import { fetchAuthMenuList } from '@/api/menu';` 제거,
`import { mockLoadMenus } from '@/mock/services/menuService';` 추가.

64번째 줄 부근:
```ts
// 변경 전:
useProjectStore.getState().fetchMyProjects().then(() => {
  fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });
});

// 변경 후:
useProjectStore.getState().fetchMyProjects().then(() => {
  mockLoadMenus().then(setServerMenus).catch(() => { /* silent */ });
});
```

---

## Chunk 4: 빌드 검증

- [ ] **Step 1: TypeScript 타입 체크**

```bash
cd /d/sdtdevtool-shinhanDs/workspace/ds_pms/ds_react_template
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 2: 빌드**

```bash
npm run build
```

Expected: `dist/` 생성, 오류 없음

- [ ] **Step 3: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: http://localhost:5173 (또는 다음 포트)에서 로그인 화면 표시
