import { Tabs, Tag, Space, Card, Alert, Table, Typography, Button, Divider } from 'antd';
import type { TableColumnsType } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useNotify } from '@/hooks/useNotify';
import { useAuthStore } from '@/stores/authStore';
import { useTabStore } from '@/stores/tabStore';
import { useProjectStore } from '@/stores/projectStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

// ─── Store list ──────────────────────────────────────────────────────────────
type StoreRow = { name: string; persist: string; desc: string; key: string };
const storeCols: TableColumnsType<StoreRow> = [
  { title: 'Store', dataIndex: 'name', width: 160, render: (v) => <Text code>{v}</Text> },
  { title: 'persist', dataIndex: 'persist', width: 80, render: (v) => <Tag color={v === '✅' ? 'green' : 'default'}>{v}</Tag> },
  { title: 'Role', dataIndex: 'desc' },
];
const storeRows: StoreRow[] = [
  { key: '1', name: 'authStore',     persist: 'partial', desc: 'Access token in memory, user/roles in localStorage' },
  { key: '2', name: 'tabStore',      persist: '✅',   desc: 'Open tabs and the active tab (localStorage: vamc-tabs)' },
  { key: '3', name: 'menuStore',     persist: '❌',   desc: 'Rail / flyout state and the server menu tree' },
  { key: '4', name: 'projectStore',  persist: '✅',   desc: 'Active project and the list of my projects' },
  { key: '5', name: 'themeStore',    persist: '✅',   desc: 'Light / dark theme (localStorage: vamc-theme)' },
  { key: '6', name: 'localeStore',   persist: '✅',   desc: 'Language setting ko/en/vn (localStorage: vamc-locale)' },
  { key: '7', name: 'labelStore',    persist: '❌',   desc: 'i18n label cache (reloaded on every mount)' },
  { key: '8', name: 'comcdStore',    persist: '❌',   desc: 'Common code cache (reloaded on every mount)' },
  { key: '9', name: 'settingsStore', persist: '✅',   desc: 'Personal settings — homeMenuKey and friends' },
];

// ─── Hook list ───────────────────────────────────────────────────────────────
type HookRow = { hook: string; returns: string; desc: string; src: string; key: string };
const hookCols: TableColumnsType<HookRow> = [
  { title: 'Hook',   dataIndex: 'hook',    width: 220, render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
  { title: 'Returns', dataIndex: 'returns', width: 200, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Description', dataIndex: 'desc' },
  { title: 'Location', dataIndex: 'src',     width: 190, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
];
const hookRows: HookRow[] = [
  { key: '1', hook: 'useApiQuery(key, fn, opts?)',   returns: 'UseQueryResult<T>',                    desc: 'useQuery wrapper that unwraps ApiResponse<T> automatically. Options such as enabled and staleTime pass through',                              src: 'hooks/useApiQuery.ts' },
  { key: '2', hook: 'useApiMutation(fn, opts?)',      returns: 'UseMutationResult<T>',                 desc: 'useMutation wrapper that unwraps ApiResponse<T> and shows a success toast. Supports successMessage / onSuccess / onError',       src: 'hooks/useApiMutation.ts' },
  { key: '3', hook: 'useMenuPermission()',             returns: '{ canRead, canWrite }',                desc: 'Turns the active tab permType into canRead / canWrite. Used to show or hide buttons',                              src: 'hooks/useMenuPermission.ts' },
  { key: '4', hook: 'useScreenLabel(sceIdOverride?)', returns: '{ t, tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme, labels, sceId }', desc: 'Label shorthands built on sceId. sceId comes from TabContext automatically and can be overridden', src: 'hooks/useScreenLabel.ts' },
  { key: '5', hook: 'useLogout()',                     returns: '() => void',                           desc: 'Logout confirmation modal, then a full store reset and a redirect to /login',                                               src: 'hooks/useLogout.ts' },
  { key: '6', hook: 'useNotify()',                     returns: '{ toast, notify, dialog }',            desc: 'One hook over antd message / notification / modal. Dialogs get i18n defaults per type',                         src: 'hooks/useNotify.ts' },
  { key: '7', hook: 'useTabRouteSync()',               returns: 'void',                                 desc: 'Two-way sync between tabs and the URL. AppLayout only — never call it from a page component',                               src: 'hooks/useTabRouteSync.ts' },
  { key: '8', hook: 'useComponentLabel()',             returns: 'same as useScreenLabel',                desc: "Label hook for shared components — it pins sceId to 'COMPONENT'. Use it for text that must read the same on every screen", src: 'hooks/useComponentLabel.ts' },
  { key: '9', hook: 'useTotalCountLabel()',            returns: '{ template, format }',                 desc: 'Returns the localized grid row-count phrase ("{0} total"). Keeps the toolbar, pagination and Excel modal wording identical', src: 'hooks/useTotalCountLabel.ts' },
  { key: '10', hook: 'useAllMenus()',                  returns: 'MenuItem[]',                           desc: 'The full tree of server menus plus static menus. Static menu names are resolved in the current locale, so tab titles, breadcrumbs and the rail all read the same list', src: 'hooks/useAllMenus.ts' },
  { key: '11', hook: 'useExcel(options)',              returns: '{ download, upload, ... }',            desc: 'Excel download, upload and template in one hook. See Dev tools > Excel upload/download for details',        src: 'hooks/useExcel.ts' },
  { key: '12', hook: 'useScrollOverflow<T>(step?)',    returns: '{ ref, overflow, scrollLeft, scrollRight }', desc: 'Detects whether horizontal scrolling is possible and drives the left/right arrows. Used by ScrollOverflowWrapper',            src: 'hooks/useScrollOverflow.ts' },
  { key: '13', hook: 'useNavigateTab()',               returns: '(key, params?) => void',               desc: 'Opens another screen as a tab. Takes a menu code or a screen ID; the target screen reads useTabContext()?.tab.params', src: 'hooks/useNavigateTab.ts' },
];

// ─── Util list ───────────────────────────────────────────────────────────────
type UtilCategory = 'Menu' | 'API' | 'Error';
const UTIL_CATEGORY_COLOR: Record<UtilCategory, string> = { 'Menu': 'blue', 'API': 'green', 'Error': 'red' };

type UtilRow = { fn: string; params: string; sig: string; desc: string; src: string; category: UtilCategory; key: string };
const utilCols: TableColumnsType<UtilRow> = [
  { title: 'Group',  dataIndex: 'category', width: 60,  render: (v: UtilCategory) => <Tag color={UTIL_CATEGORY_COLOR[v]}>{v}</Tag> },
  { title: 'Function', dataIndex: 'fn',       width: 210, render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
  { title: 'Parameters', dataIndex: 'params', width: 200, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Returns', dataIndex: 'sig',      width: 150, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Description', dataIndex: 'desc' },
  { title: 'Location', dataIndex: 'src',      width: 175, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
];
const utilRows: UtilRow[] = [
  { key: '1',  category: 'Menu', fn: 'findMenuByKey',       params: '(items: MenuItem[], key: string)',          sig: 'MenuItem | null',   desc: 'Recursively searches the menu tree. Returns the matching MenuItem, or null',                                    src: 'utils/menuUtils.ts' },
  { key: '2',  category: 'Menu', fn: 'getMenuParentKeys',   params: '(items: MenuItem[], key: string)',          sig: 'string[] | null',   desc: 'Returns every ancestor key of the target. Used for the flyout openKeys so branches stay expanded',                               src: 'utils/menuUtils.ts' },
  { key: '3',  category: 'Menu', fn: 'getMenuBreadcrumb',   params: '(menus: MenuItem[], key: string)',          sig: '{ key, label }[]',  desc: 'The breadcrumb path from the root to the target. Used by the ContentHeader breadcrumb',                      src: 'utils/menuUtils.ts' },
  { key: '4',  category: 'Menu', fn: 'buildAntMenuItems',   params: '(items: MenuItem[])',                       sig: 'AntMenuItem[]',     desc: 'Converts MenuItem[] into Ant Design menu items — icon strings become React components and hidden entries are dropped',     src: 'utils/menuUtils.ts' },
  { key: '6',  category: 'Error', fn: 'ApiError.from',       params: '(err: unknown)',                            sig: 'ApiError',          desc: 'Converts an unknown error into an ApiError. An ApiError passes through; an AxiosError is delegated to fromAxiosError',                 src: 'lib/api/error.ts' },
  { key: '7',  category: 'Error', fn: 'ApiError.fromAxiosError', params: '(err: AxiosError)',                     sig: 'ApiError',          desc: 'Converts an AxiosError into an ApiError. Uses the server message from response.data when present, otherwise a status-code default', src: 'lib/api/error.ts' },
  { key: '8',  category: 'Error', fn: 'err.userMessage',     params: '(getter)',                                  sig: 'string',            desc: 'Falls back in order: server message, status-code default, then a generic unknown error',                                    src: 'lib/api/error.ts' },
  { key: '9',  category: 'Error', fn: 'err.isUnauthorized',  params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode === 401',                                                                                  src: 'lib/api/error.ts' },
  { key: '10', category: 'Error', fn: 'err.isForbidden',     params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode === 403',                                                                                  src: 'lib/api/error.ts' },
  { key: '11', category: 'Error', fn: 'err.isNotFound',      params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode === 404',                                                                                  src: 'lib/api/error.ts' },
  { key: '12', category: 'Error', fn: 'err.isServerError',   params: '(getter)',                                  sig: 'boolean',           desc: 'statusCode >= 500',                                                                                   src: 'lib/api/error.ts' },
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
      <DevPageHeader page="GuideInternalApi" />

      <Tabs
        items={[

          /* ── Hooks ── */
          {
            key: 'hooks',
            label: 'Hooks',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>Available hooks</h3>
                </div>
                <Table columns={hookCols} dataSource={hookRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

                <CodeSnippet title="useApiQuery — fetching data" code={`import { useApiQuery } from '@/hooks/useApiQuery';
import { getTaskList } from '../api/myFeatureApi';

function MyList() {
  const { data: tasks = [], isLoading, error } = useApiQuery(
    ['tasks'],          // React Query cache key
    getTaskList,        // () => Promise<ApiResponse<T>>
    { enabled: true },  // UseQueryOptions (optional)
  );
  return <GridTable rowData={tasks} loading={isLoading} />;
}`} />

                <CodeSnippet title="useApiMutation — changing data" code={`import { useApiMutation } from '@/hooks/useApiMutation';
import { saveTask } from '../api/myFeatureApi';

function MyForm() {
  const { mutate, isPending } = useApiMutation(saveTask, {
    successMessage: 'Saved.',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => console.error(err.userMessage),
  });

  return <Button loading={isPending} onClick={() => mutate(formData)}>Save</Button>;
}`} />

                <CodeSnippet title="useMenuPermission — permission control" code={`import { useMenuPermission } from '@/hooks/useMenuPermission';

function MyPage() {
  const { canRead, canWrite } = useMenuPermission();

  if (!canRead) return <div>You do not have access to this screen.</div>;

  return (
    <GridToolbar
      totalCount={data.length}
      actions={canWrite && (
        <>
          <Button type="primary">New</Button>
          <Button danger>Delete</Button>
        </>
      )}
    />
  );
}`} />

                <CodeSnippet title="useScreenLabel — every label through one hook" code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

function MyPage() {
  // t, tmc/tmi/tme (global messages), tvt/tvb/tsg/tsm — all of them come from here
  const { t, tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme, labels } = useScreenLabel();
  // sceId is taken from TabContext automatically

  const columnDefs = useMemo(() => [
    { field: 'usrId', headerName: tsg('usrId') },  // SCRIPT.GRID_usrId
  ], [labels]); // include labels in the deps so a language change refreshes them

  return (
    <Form.Item label={tvt('usrId')}>   {/* VIEW.TEXT_usrId */}
      <Button>{tvb('save')}</Button>     {/* VIEW.BTN_save */}
    </Form.Item>
  );
}`} />

                <CodeSnippet title="useLogout — signing out" code={`import { useLogout } from '@/hooks/useLogout';

function MyComponent() {
  const confirmLogout = useLogout();
  // Click shows a confirmation modal, then resets all state and navigates to /login
  return <Button onClick={confirmLogout}>Sign out</Button>;
}`} />

                <Divider />

                {/* ── useNotify demo ── */}
                <div className="demo-desc">
                  <h3>useNotify — one notification hook</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Wraps antd <Text code>message</Text> / <Text code>notification</Text> / <Text code>modal</Text> in a single hook.
                    Dialogs receive i18n defaults per type (title / okText / cancelText / danger) automatically.
                  </p>
                </div>

                <Card size="small" title="toast — auto-dismissing message" style={{ marginBottom: 12 }}>
                  <Space wrap>
                    <Button size="small" type="primary"  onClick={() => toast.success('Saved.')}>success</Button>
                    <Button size="small" danger          onClick={() => toast.error('An error occurred.')}>error</Button>
                    <Button size="small"                 onClick={() => toast.warning('This needs your attention.')}>warning</Button>
                    <Button size="small"                 onClick={() => toast.info('For your information.')}>info</Button>
                    <Button size="small"                 onClick={() => toast.loading('Processing...')}>loading</Button>
                  </Space>
                </Card>

                <Card size="small" title="notify — notification panel on the right" style={{ marginBottom: 12 }}>
                  <Space wrap>
                    <Button size="small" type="primary"
                      onClick={() => notify.success('Your changes have been saved.')}>
                      string shorthand
                    </Button>
                    <Button size="small" danger
                      onClick={() => notify.error({ title: 'Custom title', description: 'A server error occurred.', placement: 'topRight' })}>
                      object form
                    </Button>
                    <Button size="small" onClick={() => notify.warning('Your permission expires soon.')}>warning</Button>
                    <Button size="small" onClick={() => notify.info('A new notice has been posted.')}>info</Button>
                  </Space>
                </Card>

                <Card size="small" title="dialog — modal (i18n defaults applied automatically)" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Button size="small"
                      onClick={() => dialog.confirm({ content: 'Save the changes?', onOk: () => toast.success('Saved.') })}>
                      confirm
                    </Button>
                    <Button size="small"
                      onClick={() => dialog.info({ content: 'This is an informational dialog.' })}>
                      info
                    </Button>
                    <Button size="small"
                      onClick={() => dialog.warning({ content: 'This action cannot be undone.', onOk: () => toast.warning('Proceeding.') })}>
                      warning
                    </Button>
                    <Button size="small" danger
                      onClick={() => dialog.error({ content: 'A server error occurred.' })}>
                      error
                    </Button>
                    <Button size="small"
                      onClick={() => dialog.warning({ title: 'Delete data', content: 'Deleted data cannot be recovered.', okText: 'Delete', onOk: () => toast.success('Deleted.') })}>
                      title / okText override
                    </Button>
                  </Space>
                </Card>

                <CodeSnippet title="useNotify — basic usage" code={`import { useNotify } from '@/hooks/useNotify';

function MyPage() {
  const { toast, notify, dialog } = useNotify();

  const handleSave = () => {
    saveMutation.mutate(payload, {
      onSuccess: () => toast.success('Saved.'),
      onError:   () => toast.error('Saving failed.'),
    });
  };

  const handleDelete = () => {
    dialog.warning({
      title:   'Delete data',          // default: i18n DIALOG.WARNING.TITLE
      content: 'This cannot be undone',
      okText:  'Delete',                // default: i18n DIALOG.OK_TEXT
      onOk: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => notify.success('Deleted.'), // title supplied by i18n
        });
      },
    });
  };

  const handleNotify = () => {
    // A string maps to description automatically (title comes from i18n)
    notify.success('Your changes have been saved.');

    // An object is passed through as-is
    notify.error({ title: 'Custom title', description: 'Details go here', placement: 'topRight' });
  };
}`} />

                <CodeSnippet title="useNotify — dialog defaults per type" code={`// i18n defaults per dialog type (register the label keys in the DB and they localize automatically)
// confirm  → title: COMPONENT.VIEW.TITLE_confirm  | danger: false
// info     → title: COMPONENT.VIEW.TITLE_info     | danger: false
// warning  → title: COMPONENT.VIEW.TITLE_warning  | danger: true
// error    → title: COMPONENT.VIEW.TITLE_error    | danger: true
// okText   → COMPONENT.VIEW.BTN_ok
// cancelText → COMPONENT.VIEW.BTN_cancel

// Every default can be overridden per call
dialog.confirm({
  title:         'Custom title',        // overrides the DIALOG default
  content:       'Do you want to continue?',
  okText:        'Continue',            // overrides DIALOG.OK_TEXT
  cancelText:    'Go back',             // overrides DIALOG.CANCEL_TEXT
  okButtonProps: { danger: true },       // confirm defaults to danger:false — overridden here
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
                  <h3>Zustand stores</h3>
                  <p>Every store is a singleton. Outside components, reach it with <Text code>useXxxStore.getState()</Text>.</p>
                </div>
                <Table columns={storeCols} dataSource={storeRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

                <Card title="Current store state" size="small" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Text>Auth: <Tag color={isAuthenticated ? 'green' : 'red'}>{isAuthenticated ? 'signed in' : 'signed out'}</Tag></Text>
                    <Text>User: <Tag>{user?.usrNm ?? '-'}</Tag></Text>
                    <Text>Project: <Tag color="blue">{activeProject?.name ?? 'none'}</Tag></Text>
                    <Text>Open tabs: <Tag>{tabs.length}</Tag></Text>
                    <Text>Active tab: <Tag>{activeTabKey ?? '-'}</Tag></Text>
                    <Text>Theme: <Tag>{mode}</Tag></Text>
                    <Text>Language: <Tag>{locale}</Tag></Text>
                  </Space>
                </Card>

                <CodeSnippet title="authStore" code={`import { useAuthStore } from '@/stores/authStore';

// Inside a component
const { user, isAuthenticated, roles } = useAuthStore();
const hasRole = useAuthStore((s) => s.hasRole);
hasRole('ADMIN'); // → boolean

// Actions
const { setAuth, setAccessToken, logout } = useAuthStore();`} />

                <CodeSnippet title="tabStore — controlling tabs" code={`import { useTabStore } from '@/stores/tabStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

const { openTab, closeTab, activeTabKey } = useTabStore();

// Open a tab
const menu = findMenuByKey(menuConfig, 'project.list');
if (menu) openTab(menu);

// Close a tab
closeTab('project.list');`} />

                <CodeSnippet title="projectStore — selecting a project" code={`import { useProjectStore } from '@/stores/projectStore';

const { activeProject, fetchMyProjects, setActiveProject } = useProjectStore();

// Called automatically after login (App.tsx)
await fetchMyProjects();

// activeProject.id is injected into every API request as the X-Project-Id header`} />

                <CodeSnippet title="comcdStore — common codes" code={`import { useComcdStore } from '@/stores/comcdStore';

const getOptions  = useComcdStore((s) => s.getOptions);
const getCodeName = useComcdStore((s) => s.getCodeName);

// Select options
<Select options={getOptions('TASK_STATUS')} />

// Code display name
getCodeName('TASK_STATUS', 'DONE'); // -> 'Done'

// In JSX, prefer the ComcdSelect component
<ComcdSelect cdDmnId="TASK_STATUS" value={v} onChange={set} />`} />

                <CodeSnippet title="settingsStore — personal settings" code={`import { useSettingsStore } from '@/stores/settingsStore';

const { homeMenuKey, setHomeMenuKey } = useSettingsStore();
// homeMenuKey defaults to 'dashboard'`} />
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
                  <h3>Utility functions</h3>
                  <p><Text code>utils/menuUtils.ts</Text> · <Text code>lib/api/client.ts</Text> · <Text code>lib/api/error.ts</Text></p>
                </div>
                <Table columns={utilCols} dataSource={utilRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

                <CodeSnippet title="findMenuByKey" code={`import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';
import { useMenuStore } from '@/stores/menuStore';

// Searching the static menus
const menu = findMenuByKey(menuConfig, 'project.list');
// → MenuItem | null

// Searching the server menus
const serverMenus = useMenuStore.getState().serverMenus;
const menu = findMenuByKey(serverMenus, 'M001-1-1');`} />

                <CodeSnippet title="getMenuBreadcrumb + getMenuParentKeys" code={`import { getMenuBreadcrumb, getMenuParentKeys } from '@/utils/menuUtils';

// Building a breadcrumb
const crumbs = getMenuBreadcrumb(menuConfig, 'project.list');
// -> [{ key: 'project', label: 'Project' }, { key: 'project.list', label: 'List' }]

// Flyout openKeys (keeps ancestors expanded)
const parents = getMenuParentKeys(menuConfig, 'project.list');
// → ['project']`} />

                <CodeSnippet title="buildAntMenuItems" code={`import { buildAntMenuItems } from '@/utils/menuUtils';

// MenuItem[] -> Ant Design menu items (icon strings become React components)
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
                    When <Text code>TabContent</Text> renders a page component it injects the current tab through context.
                    <Text code>useScreenLabel()</Text> uses it internally.
                  </p>
                </div>

                <Alert
                  type="warning"
                  description="TabContext is only valid inside TabContent. Outside it, pass the sceId explicitly, e.g. useScreenLabel('SCE_ID')."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="useTabContext — the current tab" code={`import { useTabContext } from '@/contexts/TabContext';
import type { Tab } from '@/types/tab';

function MyComponent() {
  const ctx = useTabContext(); // null outside TabContent

  // Key fields of the Tab type
  ctx?.tab.key           // tabKey (= menuItem.key)
  ctx?.tab.title         // tab title
  ctx?.tab.componentKey  // folder name of the page component
  ctx?.tab.sceId         // server screen ID (e.g. 'SYS030101SC')
  ctx?.tab.pinned        // whether the tab is pinned
  ctx?.tab.closable      // whether the tab can be closed
}`} />

                <CodeSnippet title="How TabContext is injected (reference)" code={`// Inside TabContent.tsx (nothing to edit)
function TabPanel({ tab, visible }) {
  return (
    <TabContext.Provider value={{ tab }}>
      <LazyComponent /> {/* the actual page component */}
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
                  <h3>componentRegistry — automatic discovery</h3>
                </div>

                <Alert
                  type="info"
                  description="The folder name under src/features/*/*/index.tsx (business screens) and src/dev/pages/*/index.tsx (demos and samples) becomes the componentPath. No manual registration needed."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="How componentRegistry works" code={`// src/config/componentRegistry.tsx
// Discovered automatically with import.meta.glob (nothing to edit)
const baseModules = import.meta.glob('../features/*/*/index.tsx');   // business screens
const devModules  = import.meta.glob('../dev/pages/*/index.tsx');    // demos, guides and samples (only when DEV_TOOLS_ENABLED)

// Result: { '../features/sys/SYS050301SC/index.tsx': () => import(...) }
// The immediate parent folder name is taken from the key and used as the registry key (= screen ID = sceId)

// The rule is to make MENU_URL_ADDR in the DB match the folder name (screen ID); overrides are an escape hatch`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>menuConfig — the static menu tree</h3>
                </div>

                <CodeSnippet title="The MenuItem type and how to add one" code={`// The MenuItem type (src/types/menu.ts)
interface MenuItem {
  key: string;            // tab key (dotted notation: 'project.list')
  label: string;          // display name
  icon?: string;          // 'DownloadOutlined' | 'custom:IconName'
  componentPath?: string; // folder name of the page component (PascalCase)
  sceId?: string;         // server screen ID
  labelKey?: string;      // i18n label key
  permType?: string;      // 'M' | 'S' | ''
  children?: MenuItem[];
  hidden?: boolean;
}

// Adding a new menu (src/config/menuConfig.ts)
{
  key: 'dev.lib.my-guide',
  label: 'My guide',
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

                <CodeSnippet title="How to write an API function" code={`import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Colocate types that map 1:1 to a server DTO in this file (see src/api/common/comCdApi.ts)
export interface Task { taskId: string; taskNm: string; }

// The server responds with { status, message, data }. useApiQuery decides success from the success flag,
// so convert status -> success here. baseURL is empty, so include /api in the path.
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
                  <p><Text code>src/lib/api/error.ts</Text> — an Error subclass for HTTP errors</p>
                </div>

                <CodeSnippet title="Using ApiError" code={`import { ApiError } from '@/lib/api/error';

try {
  await apiClient.get('/protected');
} catch (err) {
  if (err instanceof ApiError) {
    err.statusCode      // 401, 403, 500 ...
    err.userMessage     // a human-readable message, e.g. 'Authentication required.'
    err.isUnauthorized  // statusCode === 401
    err.isForbidden     // statusCode === 403
    err.isNotFound      // statusCode === 404
    err.isServerError   // statusCode >= 500
  }
}

// Converting an unknown error into an ApiError
const e = ApiError.from(unknownError);`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>queryClient</h3>
                </div>

                <CodeSnippet title="Using queryClient" code={`import { queryClient } from '@/lib/api/queryClient';

// Invalidating the cache (after a successful mutation)
queryClient.invalidateQueries({ queryKey: ['tasks'] });

// Writing the cache directly (optimistic update)
queryClient.setQueryData(['tasks'], (old: Task[]) => [...old, newTask]);

// Defaults
// staleTime: 5 minutes
// retry: never for 401/403/404, at most once otherwise
// refetchOnWindowFocus: false`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>Response types</h3>
                </div>

                <CodeSnippet title="Core types (src/lib/api/types.ts)" code={`import type {
  ApiResponse,       // { status?, success, message, data } — status comes from the server, success is filled in by the API function
  PaginatedResponse, // ApiResponse<T[]> + { meta: { page, size, total, totalPages } }
  UserInfo,          // { usrId, usrNm, email, dpCd, usrCCd, phnNo }
  LoginResponse,     // { accessToken, refreshToken, tokenType, expiresIn }
  MeResponse,        // UserInfo + { roles: string[] }
  PaginationParams,  // { page?, size?, sort?, order? }
  MyProjectResponseDto,
} from '@/lib/api/types';`} />

                <div className="demo-desc" style={{ marginTop: 24 }}>
                  <h3>apiNotify — the interceptor toast bridge</h3>
                </div>

                <Alert
                  type="info"
                  description="Inside page components use App.useApp().message directly. apiNotify is only for code outside React, such as axios interceptors."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet title="apiNotify (outside React only)" code={`import { apiNotify } from '@/lib/api/apiNotify';

// Only for places where React hooks are unavailable — axios interceptors, the service layer, …
apiNotify.error('A network error occurred.');
apiNotify.warning('A warning message');

// ─── Inside page components, do this instead ──────────────────
import { App } from 'antd';
const { message, modal, notification } = App.useApp();
message.success('Saved.');
modal.confirm({ title: 'Delete', onOk: handleDelete });`} />
              </div>
            ),
          },

        ]}
      />
    </div>
  );
}
