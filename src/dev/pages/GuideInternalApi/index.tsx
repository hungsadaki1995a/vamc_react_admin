import { Tabs, Tag, Space, Card, Alert, Table, Typography, Button, Divider } from 'antd';
import type { TableColumnsType } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useNotify } from '@/hooks/useNotify';
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
  { key: '2', name: 'tabStore',      persist: '✅',   desc: '탭 목록 + 활성 탭 (localStorage: vamc-tabs)' },
  { key: '3', name: 'menuStore',     persist: '❌',   desc: '레일/플라이아웃 상태 + 서버 메뉴 트리' },
  { key: '4', name: 'projectStore',  persist: '✅',   desc: '활성 프로젝트 + 내 프로젝트 목록' },
  { key: '5', name: 'themeStore',    persist: '✅',   desc: 'light/dark 테마 (localStorage: vamc-theme)' },
  { key: '6', name: 'localeStore',   persist: '✅',   desc: '언어 설정 ko/en/vn (localStorage: vamc-locale)' },
  { key: '7', name: 'labelStore',    persist: '❌',   desc: '다국어 라벨 캐시 (매 마운트 시 재로드)' },
  { key: '8', name: 'comcdStore',    persist: '❌',   desc: '공통코드 캐시 (매 마운트 시 재로드)' },
  { key: '9', name: 'settingsStore', persist: '✅',   desc: '개인 설정 — homeMenuKey 등' },
];

// ─── Hooks 목록 ──────────────────────────────────────────────────────────────
type HookRow = { hook: string; returns: string; desc: string; src: string; key: string };
const hookCols: TableColumnsType<HookRow> = [
  { title: '훅',     dataIndex: 'hook',    width: 220, render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
  { title: '반환값', dataIndex: 'returns', width: 200, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '설명',   dataIndex: 'desc' },
  { title: '위치',   dataIndex: 'src',     width: 190, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
];
const hookRows: HookRow[] = [
  { key: '1', hook: 'useApiQuery(key, fn, opts?)',   returns: 'UseQueryResult<T>',                    desc: 'ApiResponse<T> 자동 언래핑 useQuery 래퍼. enabled/staleTime 등 옵션 전달 가능',                              src: 'hooks/useApiQuery.ts' },
  { key: '2', hook: 'useApiMutation(fn, opts?)',      returns: 'UseMutationResult<T>',                 desc: 'ApiResponse<T> 언래핑 + 성공 토스트 useMutation 래퍼. successMessage / onSuccess / onError 옵션 지원',       src: 'hooks/useApiMutation.ts' },
  { key: '3', hook: 'useMenuPermission()',             returns: '{ canRead, canWrite }',                desc: '현재 활성 탭의 permType → canRead(S|M) / canWrite(M만). 버튼 노출 제어에 사용',                              src: 'hooks/useMenuPermission.ts' },
  { key: '4', hook: 'useScreenLabel(sceIdOverride?)', returns: '{ t, tvt, tvb, tvh, tsg, tsm, tsb, tmc, tmi, tme, labels, sceId }', desc: 'sceId 기반 라벨 단축 함수. TabContext에서 sceId 자동 추출. 명시적 override 가능', src: 'hooks/useScreenLabel.ts' },
  { key: '5', hook: 'useLogout()',                     returns: '() => void',                           desc: '로그아웃 확인 모달 → 전체 스토어 초기화 → /login 리다이렉트',                                               src: 'hooks/useLogout.ts' },
  { key: '6', hook: 'useNotify()',                     returns: '{ toast, notify, dialog }',            desc: 'antd message / notification / modal 통합 훅. dialog는 타입별 i18n 기본값 자동 적용',                         src: 'hooks/useNotify.ts' },
  { key: '7', hook: 'useTabRouteSync()',               returns: 'void',                                 desc: '탭 ↔ URL 양방향 동기화. AppLayout 전용 — 페이지 컴포넌트에서 직접 호출 금지',                               src: 'hooks/useTabRouteSync.ts' },
];

// ─── Utils 목록 ──────────────────────────────────────────────────────────────
type UtilCategory = '메뉴' | 'API' | '에러';
const UTIL_CATEGORY_COLOR: Record<UtilCategory, string> = { '메뉴': 'blue', 'API': 'green', '에러': 'red' };

type UtilRow = { fn: string; params: string; sig: string; desc: string; src: string; category: UtilCategory; key: string };
const utilCols: TableColumnsType<UtilRow> = [
  { title: '분류',   dataIndex: 'category', width: 60,  render: (v: UtilCategory) => <Tag color={UTIL_CATEGORY_COLOR[v]}>{v}</Tag> },
  { title: '함수',   dataIndex: 'fn',       width: 210, render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
  { title: '파라미터', dataIndex: 'params', width: 200, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '반환',   dataIndex: 'sig',      width: 150, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '설명',   dataIndex: 'desc' },
  { title: '위치',   dataIndex: 'src',      width: 175, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
];
const utilRows: UtilRow[] = [
  { key: '1',  category: '메뉴', fn: 'findMenuByKey',       params: '(items: MenuItem[], key: string)',          sig: 'MenuItem | null',   desc: '메뉴 트리 재귀 탐색. key 일치 시 해당 MenuItem 반환, 없으면 null',                                    src: 'utils/menuUtils.ts' },
  { key: '2',  category: '메뉴', fn: 'getMenuParentKeys',   params: '(items: MenuItem[], key: string)',          sig: 'string[] | null',   desc: '대상 key의 모든 상위 key 배열 반환. Flyout openKeys(펼침 유지)에 사용',                               src: 'utils/menuUtils.ts' },
  { key: '3',  category: '메뉴', fn: 'getMenuBreadcrumb',   params: '(menus: MenuItem[], key: string)',          sig: '{ key, label }[]',  desc: '루트 → 대상까지 이어지는 브레드크럼 경로 배열. ContentHeader 브레드크럼에 사용',                      src: 'utils/menuUtils.ts' },
  { key: '4',  category: '메뉴', fn: 'buildAntMenuItems',   params: '(items: MenuItem[])',                       sig: 'AntMenuItem[]',     desc: 'MenuItem[] → Ant Design Menu items 변환. 아이콘 문자열을 React 컴포넌트로 교체, hidden 항목 제거',     src: 'utils/menuUtils.ts' },
  { key: '6',  category: '에러', fn: 'ApiError.from',       params: '(err: unknown)',                            sig: 'ApiError',          desc: 'unknown 에러를 ApiError로 변환. ApiError면 그대로, AxiosError면 fromAxiosError 위임',                 src: 'lib/api/error.ts' },
  { key: '7',  category: '에러', fn: 'ApiError.fromAxiosError', params: '(err: AxiosError)',                     sig: 'ApiError',          desc: 'AxiosError → ApiError 변환. response.data가 있으면 서버 메시지 추출, 없으면 상태코드 기반 기본 메시지', src: 'lib/api/error.ts' },
  { key: '8',  category: '에러', fn: 'err.userMessage',     params: '(getter)',                                  sig: 'string',            desc: '서버 메시지 → 상태코드 기본 메시지 → 알 수 없는 오류 순으로 폴백',                                    src: 'lib/api/error.ts' },
  { key: '9',  category: '에러', fn: 'err.isUnauthorized',  params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode === 401',                                                                                  src: 'lib/api/error.ts' },
  { key: '10', category: '에러', fn: 'err.isForbidden',     params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode === 403',                                                                                  src: 'lib/api/error.ts' },
  { key: '11', category: '에러', fn: 'err.isNotFound',      params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode === 404',                                                                                  src: 'lib/api/error.ts' },
  { key: '12', category: '에러', fn: 'err.isServerError',   params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode >= 500',                                                                                   src: 'lib/api/error.ts' },
];

export default function GuideInternalApi() {
  const { toast, notify, dialog } = useNotify();
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
          VAMC NPL ADMIN에서 제공하는 Hooks, Stores, Utils, Contexts, Config, lib/api 사용법 정리
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

                <CodeSnippet title="useScreenLabel — 단일 훅으로 모든 라벨 접근" code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

function MyPage() {
  // t, tmc/tmi/tme(전역 메시지), tvt/tvb/tsg/tsm 등 모두 여기서
  const { t, tvt, tvb, tvh, tsg, tsm, tsb, tmc, tmi, tme, labels } = useScreenLabel();
  // sceId는 TabContext에서 자동 추출

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

                <Divider />

                {/* ── useNotify 데모 ── */}
                <div className="demo-desc">
                  <h3>useNotify — 통합 알림 훅</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    antd <Text code>message</Text> / <Text code>notification</Text> / <Text code>modal</Text> 을 하나의 훅으로 제공합니다.
                    dialog는 타입별 i18n 기본값(title / okText / cancelText / danger)이 자동 적용됩니다.
                  </p>
                </div>

                <Card size="small" title="toast — 자동 사라지는 메시지" style={{ marginBottom: 12 }}>
                  <Space wrap>
                    <Button size="small" type="primary"  onClick={() => toast.success('저장됐습니다.')}>success</Button>
                    <Button size="small" danger          onClick={() => toast.error('오류가 발생했습니다.')}>error</Button>
                    <Button size="small"                 onClick={() => toast.warning('주의가 필요합니다.')}>warning</Button>
                    <Button size="small"                 onClick={() => toast.info('참고 안내입니다.')}>info</Button>
                    <Button size="small"                 onClick={() => toast.loading('처리 중...')}>loading</Button>
                  </Space>
                </Card>

                <Card size="small" title="notify — 우측 알림 패널" style={{ marginBottom: 12 }}>
                  <Space wrap>
                    <Button size="small" type="primary"
                      onClick={() => notify.success('변경 사항이 저장됐습니다.')}>
                      string 단축형
                    </Button>
                    <Button size="small" danger
                      onClick={() => notify.error({ title: '커스텀 제목', description: '서버 오류가 발생했습니다.', placement: 'topRight' })}>
                      객체 형식
                    </Button>
                    <Button size="small" onClick={() => notify.warning('권한이 곧 만료됩니다.')}>warning</Button>
                    <Button size="small" onClick={() => notify.info('새 공지사항이 등록됐습니다.')}>info</Button>
                  </Space>
                </Card>

                <Card size="small" title="dialog — 모달 (i18n 기본값 자동 적용)" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Button size="small"
                      onClick={() => dialog.confirm({ content: '저장하시겠습니까?', onOk: () => toast.success('저장됐습니다.') })}>
                      confirm
                    </Button>
                    <Button size="small"
                      onClick={() => dialog.info({ content: '이것은 정보 다이얼로그입니다.' })}>
                      info
                    </Button>
                    <Button size="small"
                      onClick={() => dialog.warning({ content: '이 작업은 되돌릴 수 없습니다.', onOk: () => toast.warning('계속 진행합니다.') })}>
                      warning
                    </Button>
                    <Button size="small" danger
                      onClick={() => dialog.error({ content: '서버 오류가 발생했습니다.' })}>
                      error
                    </Button>
                    <Button size="small"
                      onClick={() => dialog.warning({ title: '데이터 삭제', content: '삭제 후 복구할 수 없습니다.', okText: '삭제', onOk: () => toast.success('삭제됐습니다.') })}>
                      title/okText 오버라이드
                    </Button>
                  </Space>
                </Card>

                <CodeSnippet title="useNotify — 기본 사용법" code={`import { useNotify } from '@/hooks/useNotify';

function MyPage() {
  const { toast, notify, dialog } = useNotify();

  const handleSave = () => {
    saveMutation.mutate(payload, {
      onSuccess: () => toast.success('저장됐습니다.'),
      onError:   () => toast.error('저장에 실패했습니다.'),
    });
  };

  const handleDelete = () => {
    dialog.warning({
      title:   '데이터 삭제',           // 기본값: i18n DIALOG.WARNING.TITLE
      content: '삭제 후 복구 불가',
      okText:  '삭제',                  // 기본값: i18n DIALOG.OK_TEXT
      onOk: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => notify.success('삭제됐습니다.'), // title 자동(i18n)
        });
      },
    });
  };

  const handleNotify = () => {
    // 문자열 → description 자동 매핑 (title은 i18n 기본값)
    notify.success('변경 사항이 저장됐습니다.');

    // 객체 형식 → 그대로 전달
    notify.error({ title: '커스텀 제목', description: '상세 내용', placement: 'topRight' });
  };
}`} />

                <CodeSnippet title="useNotify — dialog 타입별 기본값" code={`// dialog 타입별 i18n 기본값 (DB에 라벨 키 등록 시 자동 다국어)
// confirm  → title: MESSAGE.SCRIPT.TEXT_confirm  | danger: false
// info     → title: MESSAGE.SCRIPT.TEXT_info     | danger: false
// warning  → title: MESSAGE.SCRIPT.TEXT_warning  | danger: true
// error    → title: MESSAGE.SCRIPT.TEXT_error    | danger: true
// okText   → MESSAGE.SCRIPT.BTN_confirm
// cancelText → MESSAGE.SCRIPT.BTN_cancel

// 모든 기본값은 per-call 오버라이드 가능
dialog.confirm({
  title:         '커스텀 제목',          // DIALOG 기본값 override
  content:       '진행하시겠습니까?',
  okText:        '진행',                 // DIALOG.OK_TEXT override
  cancelText:    '돌아가기',             // DIALOG.CANCEL_TEXT override
  okButtonProps: { danger: true },       // confirm 기본 danger:false → override
  onOk: handleAction,
});`} />
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
  ctx?.tab.sceId         // 서버 화면 ID (예: 'SYS030101SC')
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
                  description="src/features/*/*/index.tsx (업무 화면) · src/dev/pages/*/index.tsx (데모·샘플) 의 폴더명이 componentPath 가 됩니다. 수동 등록 불필요."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="componentRegistry 동작 원리" code={`// src/config/componentRegistry.tsx
// import.meta.glob으로 자동 발견 (수정 불필요)
const baseModules = import.meta.glob('../features/*/*/index.tsx');   // 업무 화면
const devModules  = import.meta.glob('../dev/pages/*/index.tsx');    // 데모/가이드/샘플 (DEV_TOOLS_ENABLED 일 때만)

// 결과: { '../features/sys/SYS050301SC/index.tsx': () => import(...) }
// 키에서 **바로 위 폴더명** 추출 → 레지스트리 키(= 화면ID = sceId)로 사용

// 원칙은 DB 의 MENU_URL_ADDR 을 폴더명(화면ID)에 맞추는 것이고, overrides 는 예외 수단이다`} />

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
  key: 'dev.lib.my-guide',
  label: '내 가이드',
  componentPath: 'MyGuidePage',  // src/dev/pages/MyGuidePage/index.tsx
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
                  <h3>apiClient</h3>
                  <p><Text code>src/lib/api/client.ts</Text></p>
                </div>

                <CodeSnippet title="API 함수 작성 패턴" code={`import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 서버 DTO 와 1:1 대응하는 타입은 이 파일에 코로케이트한다 (src/api/common/comCdApi.ts 참고)
export interface Task { taskId: string; taskNm: string; }

// 서버 응답은 { status, message, data } — useApiQuery 는 success 로 성공을 판정하므로
// API 함수에서 status → success 로 변환해 준다. baseURL 이 빈 값이라 경로에 /api 를 포함한다.
export async function getTask(id: string): Promise<ApiResponse<Task>> {
  const { data } = await apiClient.get<ApiResponse<Task>>(\`/api/task/\${id}\`);
  return { success: data.status === 200, message: data.message, data: data.data };
}

export async function getTaskList(): Promise<ApiResponse<Task[]>> {
  const { data } = await apiClient.get<ApiResponse<Task[]>>('/api/task/list');
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

export async function saveTask(payload: Partial<Task>): Promise<ApiResponse<Task>> {
  const { data } = await apiClient.post<ApiResponse<Task>>('/api/task', payload);
  return { success: data.status === 200, message: data.message, data: data.data };
}`} />

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
  ApiResponse,       // { status?, success, message, data } — status 는 서버가, success 는 API 함수가 채운다
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
