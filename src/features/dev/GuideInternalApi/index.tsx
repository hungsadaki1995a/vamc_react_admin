import { Tabs, Tag, Space, Card, Alert, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useAuthStore } from '@/stores/authStore';
import { useTabStore } from '@/stores/tabStore';
import { useProjectStore } from '@/stores/projectStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';

const { Text } = Typography;

// ─── Stores 목록 ──────────────────────────────────────────────────────────────
type StoreRow = { name: string; persist: string; desc: string; key: string };
const storeCols: TableColumnsType<StoreRow> = [
  { title: '스토어', dataIndex: 'name', width: 160, render: (v) => <Text code>{v}</Text> },
  { title: 'persist', dataIndex: 'persist', width: 80, render: (v) => <Tag color={v === '✅' ? 'green' : 'default'}>{v}</Tag> },
  { title: '역할', dataIndex: 'desc' },
];
const storeRows: StoreRow[] = [
  { key: '1', name: 'authStore',     persist: '일부', desc: 'AccessToken(메모리), user/roles(localStorage)' },
  { key: '2', name: 'tabStore',      persist: '✅',   desc: '탭 목록 + 활성 탭 (localStorage: pms-tabs)' },
  { key: '3', name: 'menuStore',     persist: '❌',   desc: '레일/플라이아웃 상태 + 서버 메뉴 트리' },
  { key: '4', name: 'projectStore',  persist: '✅',   desc: '활성 프로젝트 + 내 프로젝트 목록' },
  { key: '5', name: 'themeStore',    persist: '✅',   desc: 'light/dark 테마 (localStorage: pms-theme)' },
  { key: '6', name: 'localeStore',   persist: '✅',   desc: '언어 설정 ko/en/vi (localStorage: pms-locale)' },
  { key: '7', name: 'labelStore',    persist: '❌',   desc: '다국어 라벨 캐시 (매 마운트 시 재로드)' },
  { key: '8', name: 'comcdStore',    persist: '❌',   desc: '공통코드 캐시 (매 마운트 시 재로드)' },
  { key: '9', name: 'settingsStore', persist: '✅',   desc: '개인 설정 — homeMenuKey 등' },
];

// ─── Hooks 목록 ──────────────────────────────────────────────────────────────
type HookRow = { hook: string; desc: string; key: string };
const hookCols: TableColumnsType<HookRow> = [
  { title: '훅', dataIndex: 'hook', width: 200, render: (v) => <Text code>{v}</Text> },
  { title: '설명', dataIndex: 'desc' },
];
const hookRows: HookRow[] = [
  { key: '1', hook: 'useApiQuery(key, fn, opts?)',        desc: 'ApiResponse<T> 자동 언래핑 useQuery 래퍼' },
  { key: '2', hook: 'useApiMutation(fn, opts?)',           desc: 'ApiResponse<T> 언래핑 + 성공 토스트 useMutation 래퍼' },
  { key: '3', hook: 'useMenuPermission()',                 desc: '현재 활성 탭의 permType → canRead/canWrite' },
  { key: '4', hook: 'useScreenLabel(sceIdOverride?)',      desc: 'sceId 기반 라벨 단축 함수 (tvt/tvb/tsg/tsm ...)' },
  { key: '5', hook: 'useLogout()',                         desc: '로그아웃 확인 모달 + 전체 상태 초기화' },
  { key: '6', hook: 'useTabRouteSync()',                   desc: '탭 ↔ URL 양방향 동기화 (AppLayout 전용)' },
];

// ─── Utils 목록 ──────────────────────────────────────────────────────────────
type UtilRow = { fn: string; sig: string; desc: string; src: string; key: string };
const utilCols: TableColumnsType<UtilRow> = [
  { title: '함수', dataIndex: 'fn', width: 220, render: (v) => <Text code>{v}</Text> },
  { title: '반환', dataIndex: 'sig', width: 160, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '설명', dataIndex: 'desc' },
  { title: '위치', dataIndex: 'src', width: 180, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
];
const utilRows: UtilRow[] = [
  { key: '1',  fn: 'findMenuByKey(items, key)',             sig: 'MenuItem | null',         desc: '메뉴 트리 재귀 탐색. key 일치 시 해당 MenuItem 반환, 없으면 null',                               src: 'utils/menuUtils.ts' },
  { key: '2',  fn: 'getMenuParentKeys(items, key)',         sig: 'string[] | null',         desc: '대상 key의 모든 상위 key 배열 반환. Flyout openKeys(펼침 유지)에 사용',                          src: 'utils/menuUtils.ts' },
  { key: '3',  fn: 'getMenuBreadcrumb(menus, key)',         sig: '{ key, label }[]',        desc: '루트 → 대상까지 이어지는 브레드크럼 경로 배열. ContentHeader 브레드크럼에 사용',                 src: 'utils/menuUtils.ts' },
  { key: '4',  fn: 'buildAntMenuItems(items)',              sig: 'AntMenuItem[]',           desc: 'MenuItem[] → Ant Design Menu items 변환. 아이콘 문자열을 React 컴포넌트로 교체, hidden 항목 제거', src: 'utils/menuUtils.ts' },
  { key: '5',  fn: 'fromList(res, key)',                   sig: 'ApiResponse<T[]>',        desc: '배열이 객체 키로 감싸진 응답 언래핑. { data: { mtxTt: T[] } } → { data: T[] }',                 src: 'lib/api/client.ts' },
  { key: '6',  fn: 'ApiError.from(err)',                   sig: 'ApiError',                desc: 'unknown 에러를 ApiError로 변환. ApiError 이미 면 그대로, AxiosError 이면 fromAxiosError 위임',   src: 'lib/api/error.ts' },
  { key: '7',  fn: 'ApiError.fromAxiosError(err)',         sig: 'ApiError',                desc: 'AxiosError → ApiError 변환. response.data가 있으면 서버 메시지 추출, 없으면 상태코드 기반 기본 메시지 사용', src: 'lib/api/error.ts' },
  { key: '8',  fn: 'err.userMessage',                      sig: 'string',                  desc: 'ApiError 인스턴스 게터. 서버 메시지 → 상태코드 기본 메시지 → 알 수 없는 오류 순으로 폴백',        src: 'lib/api/error.ts' },
  { key: '9',  fn: 'err.isUnauthorized',                   sig: 'boolean',                 desc: 'statusCode === 401',                                                                                 src: 'lib/api/error.ts' },
  { key: '10', fn: 'err.isForbidden',                      sig: 'boolean',                 desc: 'statusCode === 403',                                                                                 src: 'lib/api/error.ts' },
  { key: '11', fn: 'err.isNotFound',                       sig: 'boolean',                 desc: 'statusCode === 404',                                                                                 src: 'lib/api/error.ts' },
  { key: '12', fn: 'err.isServerError',                    sig: 'boolean',                 desc: 'statusCode >= 500',                                                                                  src: 'lib/api/error.ts' },
];

export default function GuideInternalApi() {
  const { user, isAuthenticated } = useAuthStore();
  const { tabs, activeTabKey } = useTabStore();
  const { activeProject } = useProjectStore();
  const { mode } = useThemeStore();
  const { locale } = useLocaleStore();

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>내부 API 레퍼런스</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          DS PMS에서 제공하는 Hooks, Stores, Utils, Contexts, Config, lib/api 사용법 정리
        </p>
      </div>

      <Tabs
        items={[

          /* ── Hooks ── */
          {
            key: 'hooks',
            label: 'Hooks',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>제공 훅 목록</h3>
                </div>
                <Table columns={hookCols} dataSource={hookRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

                <CodeSnippet title="useApiQuery — 데이터 조회" code={`import { useApiQuery } from '@/hooks/useApiQuery';
import { getTaskList } from '../api/myFeatureApi';

function MyList() {
  const { data: tasks = [], isLoading, error } = useApiQuery(
    ['tasks'],          // React Query 캐시 키
    getTaskList,        // () => Promise<ApiResponse<T>>
    { enabled: true },  // UseQueryOptions (선택)
  );
  return <GridTable rowData={tasks} loading={isLoading} />;
}`} />

                <CodeSnippet title="useApiMutation — 데이터 변경" code={`import { useApiMutation } from '@/hooks/useApiMutation';
import { saveTask } from '../api/myFeatureApi';

function MyForm() {
  const { mutate, isPending } = useApiMutation(saveTask, {
    successMessage: '저장되었습니다.',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => console.error(err.userMessage),
  });

  return <Button loading={isPending} onClick={() => mutate(formData)}>저장</Button>;
}`} />

                <CodeSnippet title="useMenuPermission — 권한 제어" code={`import { useMenuPermission } from '@/hooks/useMenuPermission';

function MyPage() {
  const { canRead, canWrite } = useMenuPermission();

  if (!canRead) return <div>접근 권한이 없습니다.</div>;

  return (
    <GridToolbar
      totalCount={data.length}
      actions={canWrite && (
        <>
          <Button type="primary">등록</Button>
          <Button danger>삭제</Button>
        </>
      )}
    />
  );
}`} />

                <CodeSnippet title="useScreenLabel — 화면별 i18n" code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

function MyPage() {
  // sceId는 TabContext에서 자동 추출
  const { tvt, tvb, tvh, tsg, tsm, tsb, labels } = useScreenLabel();

  const columnDefs = useMemo(() => [
    { field: 'usrId', headerName: tsg('usrId') },  // SCRIPT.GRID_usrId
  ], [labels]); // labels를 deps에 포함 → 언어 변경 시 자동 갱신

  return (
    <Form.Item label={tvt('usrId')}>   {/* VIEW.TEXT_usrId */}
      <Button>{tvb('save')}</Button>     {/* VIEW.BTN_save */}
    </Form.Item>
  );
}`} />

                <CodeSnippet title="useLogout — 로그아웃" code={`import { useLogout } from '@/hooks/useLogout';

function MyComponent() {
  const confirmLogout = useLogout();
  // 클릭 시 확인 모달 → 전체 상태 초기화 → /login 이동
  return <Button onClick={confirmLogout}>로그아웃</Button>;
}`} />
              </div>
            ),
          },

          /* ── Stores ── */
          {
            key: 'stores',
            label: 'Stores',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>Zustand 스토어 목록</h3>
                  <p>모든 스토어는 싱글턴. 컴포넌트 외부에서는 <Text code>useXxxStore.getState()</Text>로 접근.</p>
                </div>
                <Table columns={storeCols} dataSource={storeRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

                <Card title="현재 스토어 상태" size="small" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Text>인증: <Tag color={isAuthenticated ? 'green' : 'red'}>{isAuthenticated ? '✅ 로그인됨' : '❌ 미로그인'}</Tag></Text>
                    <Text>사용자: <Tag>{user?.usrNm ?? '-'}</Tag></Text>
                    <Text>프로젝트: <Tag color="blue">{activeProject?.name ?? '없음'}</Tag></Text>
                    <Text>탭 수: <Tag>{tabs.length}개</Tag></Text>
                    <Text>활성 탭: <Tag>{activeTabKey ?? '-'}</Tag></Text>
                    <Text>테마: <Tag>{mode}</Tag></Text>
                    <Text>언어: <Tag>{locale}</Tag></Text>
                  </Space>
                </Card>

                <CodeSnippet title="authStore" code={`import { useAuthStore } from '@/stores/authStore';

// 컴포넌트 내부
const { user, isAuthenticated, roles } = useAuthStore();
const hasRole = useAuthStore((s) => s.hasRole);
hasRole('ADMIN'); // → boolean

// 액션
const { setAuth, setAccessToken, logout } = useAuthStore();`} />

                <CodeSnippet title="tabStore — 탭 제어" code={`import { useTabStore } from '@/stores/tabStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

const { openTab, closeTab, activeTabKey } = useTabStore();

// 탭 열기
const menu = findMenuByKey(menuConfig, 'project.list');
if (menu) openTab(menu);

// 탭 닫기
closeTab('project.list');`} />

                <CodeSnippet title="projectStore — 프로젝트 선택" code={`import { useProjectStore } from '@/stores/projectStore';

const { activeProject, fetchMyProjects, setActiveProject } = useProjectStore();

// 로그인 후 자동 호출됨 (App.tsx)
await fetchMyProjects();

// activeProject.id는 모든 API 요청에 X-Project-Id 헤더로 자동 주입`} />

                <CodeSnippet title="comcdStore — 공통코드" code={`import { useComcdStore } from '@/stores/comcdStore';

const getOptions  = useComcdStore((s) => s.getOptions);
const getCodeName = useComcdStore((s) => s.getCodeName);

// Select 옵션
<Select options={getOptions('TASK_STATUS')} />

// 코드명 텍스트
getCodeName('TASK_STATUS', 'DONE'); // → '완료'

// JSX에서는 ComcdSelect 컴포넌트 사용 권장
<ComcdSelect cdDmnId="TASK_STATUS" value={v} onChange={set} />`} />

                <CodeSnippet title="settingsStore — 개인 설정" code={`import { useSettingsStore } from '@/stores/settingsStore';

const { homeMenuKey, setHomeMenuKey } = useSettingsStore();
// homeMenuKey 기본값: 'dashboard'`} />
              </div>
            ),
          },

          /* ── Utils ── */
          {
            key: 'utils',
            label: 'Utils',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>유틸리티 함수 목록</h3>
                  <p><Text code>utils/menuUtils.ts</Text> · <Text code>lib/api/client.ts</Text> · <Text code>lib/api/error.ts</Text></p>
                </div>
                <Table columns={utilCols} dataSource={utilRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

                <CodeSnippet title="findMenuByKey" code={`import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';
import { useMenuStore } from '@/stores/menuStore';

// 정적 메뉴에서 탐색
const menu = findMenuByKey(menuConfig, 'project.list');
// → MenuItem | null

// 서버 메뉴에서 탐색
const serverMenus = useMenuStore.getState().serverMenus;
const menu = findMenuByKey(serverMenus, 'M001-1-1');`} />

                <CodeSnippet title="getMenuBreadcrumb + getMenuParentKeys" code={`import { getMenuBreadcrumb, getMenuParentKeys } from '@/utils/menuUtils';

// 브레드크럼 생성
const crumbs = getMenuBreadcrumb(menuConfig, 'project.list');
// → [{ key: 'project', label: '프로젝트' }, { key: 'project.list', label: '목록' }]

// Flyout openKeys (상위 메뉴 펼치기)
const parents = getMenuParentKeys(menuConfig, 'project.list');
// → ['project']`} />

                <CodeSnippet title="buildAntMenuItems" code={`import { buildAntMenuItems } from '@/utils/menuUtils';

// MenuItem[] → Ant Design Menu items (아이콘 문자열 → React 컴포넌트 변환)
const antItems = buildAntMenuItems(serverMenus);
<Menu items={antItems} />`} />
              </div>
            ),
          },

          /* ── Contexts ── */
          {
            key: 'contexts',
            label: 'Contexts',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>TabContext</h3>
                  <p>
                    <Text code>TabContent</Text>가 각 페이지 컴포넌트를 렌더링할 때 현재 탭 정보를 Context로 주입.
                    <Text code>useScreenLabel()</Text>이 내부적으로 사용.
                  </p>
                </div>

                <Alert
                  type="warning"
                  description="TabContext는 TabContent 내부에서만 유효합니다. 외부 컴포넌트에서는 useScreenLabel('SCE_ID') 처럼 sceId를 명시하세요."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="useTabContext — 현재 탭 정보" code={`import { useTabContext } from '@/contexts/TabContext';
import type { Tab } from '@/types/tab';

function MyComponent() {
  const ctx = useTabContext(); // TabContent 외부면 null

  // Tab 타입 주요 필드
  ctx?.tab.key           // tabKey (= menuItem.key)
  ctx?.tab.title         // 탭 표시 제목
  ctx?.tab.componentKey  // 페이지 컴포넌트 폴더명
  ctx?.tab.sceId         // 서버 화면 ID (예: 'CCO101001SC')
  ctx?.tab.pinned        // 고정 여부
  ctx?.tab.closable      // 닫기 가능 여부
}`} />

                <CodeSnippet title="TabContext 주입 구조 (참고)" code={`// TabContent.tsx 내부 (수정 불필요)
function TabPanel({ tab, visible }) {
  return (
    <TabContext.Provider value={{ tab }}>
      <LazyComponent /> {/* 실제 페이지 컴포넌트 */}
    </TabContext.Provider>
  );
}`} />
              </div>
            ),
          },

          /* ── Config ── */
          {
            key: 'config',
            label: 'Config',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>componentRegistry — 자동 발견</h3>
                </div>

                <Alert
                  type="info"
                  description="src/features/*/pages/*.tsx 파일명(PascalCase)이 componentPath가 됩니다. 수동 등록 불필요."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="componentRegistry 동작 원리" code={`// src/config/componentRegistry.tsx
// import.meta.glob으로 자동 발견 (수정 불필요)
const modules = import.meta.glob('../features/*/pages/*.tsx');

// 결과: { '../features/dev/GuideInternalApi/index.tsx': () => import(...) }
// 키에서 폴더명 추출 → componentPath로 사용

// scrId ≠ 폴더명인 경우만 overrides 맵에 추가
const overrides: Record<string, string> = {
  'MY001001SC': 'MyCustomFolderName', // scrId → 폴더명
};`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>menuConfig — 정적 메뉴 트리</h3>
                </div>

                <CodeSnippet title="MenuItem 타입 & 추가 방법" code={`// MenuItem 타입 (src/types/menu.ts)
interface MenuItem {
  key: string;            // 탭 키 (도트 표기: 'project.list')
  label: string;          // 표시 이름
  icon?: string;          // 'DownloadOutlined' | 'custom:IconName'
  componentPath?: string; // 페이지 컴포넌트 폴더명 (PascalCase)
  sceId?: string;         // 서버 화면 ID
  labelKey?: string;      // i18n 라벨 키
  permType?: string;      // 'M' | 'S' | ''
  children?: MenuItem[];
  hidden?: boolean;
}

// 새 메뉴 추가 예시 (src/config/menuConfig.ts)
{
  key: 'dev.guide.my-guide',
  label: '내 가이드',
  componentPath: 'MyGuidePage',  // src/features/dev/pages/MyGuidePage/index.tsx
}`} />
              </div>
            ),
          },

          /* ── lib/api ── */
          {
            key: 'libapi',
            label: 'lib/api',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>apiClient + fromList</h3>
                  <p><Text code>src/lib/api/client.ts</Text></p>
                </div>

                <CodeSnippet title="API 함수 작성 패턴" code={`import { apiClient, fromList } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface Task { id: string; name: string; }

// 단건 조회
export const getTask = async (id: string): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.get<ApiResponse<Task>>(\`/tasks/\${id}\`);
  return data;
};

// 목록 (배열이 data.mtxTt 키로 감싸진 경우)
export const getTaskList = async (): Promise<ApiResponse<Task[]>> => {
  const { data } = await apiClient.get<ApiResponse<{ mtxTt: Task[] }>>('/tasks/list');
  return fromList(data, 'mtxTt'); // → ApiResponse<Task[]>
};

// 저장
export const saveTask = async (payload: Partial<Task>): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return data;
};`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>ApiError</h3>
                  <p><Text code>src/lib/api/error.ts</Text> — HTTP 에러 처리용 Error 서브클래스</p>
                </div>

                <CodeSnippet title="ApiError 사용" code={`import { ApiError } from '@/lib/api/error';

try {
  await apiClient.get('/protected');
} catch (err) {
  if (err instanceof ApiError) {
    err.statusCode      // 401, 403, 500 ...
    err.userMessage     // '인증이 필요합니다.' 등 한국어 메시지
    err.isUnauthorized  // statusCode === 401
    err.isForbidden     // statusCode === 403
    err.isNotFound      // statusCode === 404
    err.isServerError   // statusCode >= 500
  }
}

// unknown → ApiError 변환
const e = ApiError.from(unknownError);`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>queryClient</h3>
                </div>

                <CodeSnippet title="queryClient 사용" code={`import { queryClient } from '@/lib/api/queryClient';

// 캐시 무효화 (mutation 성공 후)
queryClient.invalidateQueries({ queryKey: ['tasks'] });

// 캐시 직접 업데이트 (낙관적 업데이트)
queryClient.setQueryData(['tasks'], (old: Task[]) => [...old, newTask]);

// 기본 설정
// staleTime: 5분
// retry: 401/403/404 재시도 없음, 그 외 최대 1회
// refetchOnWindowFocus: false`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>응답 타입</h3>
                </div>

                <CodeSnippet title="주요 타입 (src/lib/api/types.ts)" code={`import type {
  ApiResponse,       // { success, message, data } — ds_pms_new
  VamcApiResponse,   // { status, message, data } — vamc-npl-backend
  PaginatedResponse, // ApiResponse<T[]> + { meta: { page, size, total, totalPages } }
  UserInfo,          // { usrId, usrNm, email, dpCd, usrCCd, phnNo }
  LoginResponse,     // { accessToken, refreshToken, tokenType, expiresIn }
  MeResponse,        // UserInfo + { roles: string[] }
  PaginationParams,  // { page?, size?, sort?, order? }
  MyProjectResponseDto,
} from '@/lib/api/types';`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>apiNotify — 인터셉터 토스트 브릿지</h3>
                </div>

                <Alert
                  type="info"
                  description="페이지 컴포넌트에서는 App.useApp().message를 직접 사용하세요. apiNotify는 axios 인터셉터 등 React 외부 전용입니다."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="apiNotify (React 외부 전용)" code={`import { apiNotify } from '@/lib/api/apiNotify';

// axios 인터셉터, 서비스 레이어 등 React 훅 사용 불가 영역에서만 사용
apiNotify.error('네트워크 오류가 발생했습니다.');
apiNotify.warning('주의 메시지');

// ─── 페이지 컴포넌트에서는 이 방법 사용 ─────────────────────────
import { App } from 'antd';
const { message, modal, notification } = App.useApp();
message.success('저장되었습니다.');
modal.confirm({ title: '삭제', onOk: handleDelete });`} />
              </div>
            ),
          },

        ]}
      />
    </div>
  );
}
