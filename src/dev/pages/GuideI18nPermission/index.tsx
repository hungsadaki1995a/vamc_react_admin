import { Tabs, Tag, Space, Card, Alert, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useMenuPermission } from '@/hooks/useMenuPermission';
import { useLocaleStore } from '@/stores/localeStore';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

// ─── useScreenLabel function list ────────────────────────────────────────────
const helperCols: TableColumnsType<{ fn: string; context: string; pattern: string; desc: string }> = [
  { title: 'Function', dataIndex: 'fn', key: 'fn', width: 150, render: (v) => <Text code>{v}</Text> },
  { title: 'Context', dataIndex: 'context', key: 'context', width: 90 },
  { title: 'Key pattern', dataIndex: 'pattern', key: 'pattern', width: 300, render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
  { title: 'Purpose', dataIndex: 'desc', key: 'desc' },
];
const helperRows = [
  { fn: 'tvt(field)', context: 'VIEW', pattern: '{sceId}.VIEW.TEXT_{field}', desc: 'Form and field labels' },
  { fn: 'tvb(field)', context: 'VIEW', pattern: '{sceId}.VIEW.BTN_{field}', desc: 'Button text' },
  { fn: 'tvh(field)', context: 'VIEW', pattern: '{sceId}.VIEW.TITLE_{field}', desc: 'Titles and section headings' },
  { fn: 'tvp(field)', context: 'VIEW', pattern: '{sceId}.VIEW.PHOLDER_{field}', desc: 'Input placeholders' },
  { fn: 'tvo(field)', context: 'VIEW', pattern: '{sceId}.VIEW.OPT_{field}', desc: 'Select option labels' },
  { fn: 'tsg(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.GRID_{field}', desc: 'Grid column headers' },
  { fn: 'tsm(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.MSG_{field}', desc: 'Success, error and confirmation messages' },
  { fn: 'tss(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.STATUS_{field}', desc: 'Status labels (grid tags, badges)' },
  { fn: 'tsr(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.RULE_{field}', desc: 'Validation error messages' },
  { fn: 'tmc(code)', context: 'MESSAGE', pattern: 'MESSAGE.CONFIRM.TEXT_{code}', desc: 'Global confirmation messages (screen-independent)' },
  { fn: 'tmi(code)', context: 'MESSAGE', pattern: 'MESSAGE.INFO.TEXT_{code}', desc: 'Global info messages (screen-independent)' },
  { fn: 'tme(code)', context: 'MESSAGE', pattern: 'MESSAGE.ERROR.TEXT_{code}', desc: 'Global error messages (screen-independent)' },
  { fn: 't(key)', context: '—', pattern: '(full key)', desc: 'Look up a full key directly (falls back to returning the key itself)' },
  { fn: 'labels', context: '—', pattern: '—', desc: 'For useMemo deps only — triggers recalculation when the language changes' },
];

// ─── Label key examples ──────────────────────────────────────────────────────
const exampleCols: TableColumnsType<{ key: string; ko: string; en: string }> = [
  { title: 'LABEL_KEY', dataIndex: 'key', key: 'key', render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Korean', dataIndex: 'ko', key: 'ko' },
  { title: 'English', dataIndex: 'en', key: 'en' },
];
const exampleRows = [
  { key: 'SYS030101SC.VIEW.TEXT_usrId', ko: '사용자ID', en: 'User ID' },
  { key: 'SYS030101SC.VIEW.BTN_save', ko: '저장', en: 'Save' },
  { key: 'SYS030101SC.VIEW.TITLE_inputPanel', ko: '입력 패널', en: 'Input Panel' },
  { key: 'SYS030101SC.SCRIPT.GRID_usrId', ko: '사용자ID', en: 'User ID' },
  { key: 'SYS030101SC.SCRIPT.MSG_updateSuccess', ko: '수정되었습니다.', en: 'Updated successfully.' },
  { key: 'SYS030101SC.VIEW.BTN_delete', ko: '삭제', en: 'Delete' },
];

export default function GuideI18nPermission() {
  const { t } = useScreenLabel();
  const { permType, canRead, canWrite } = useMenuPermission();
  const { locale } = useLocaleStore();

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideI18nPermission" />

      <Tabs
        items={[
          {
            key: 'useScreenLabel',
            label: 'useScreenLabel',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>The useScreenLabel hook</h3>
                  <p>
                    A set of shorthand helpers that build label keys from the screen ID (sceId).
                    <code>sceId</code> is read automatically from <code>TabContext</code>, so you never pass it in.
                    <strong> Always use these instead of hardcoded strings.</strong>
                  </p>
                </div>

                <Table
                  columns={helperCols}
                  dataSource={helperRows.map((r, i) => ({ ...r, key: i }))}
                  size="small"
                  pagination={false}
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet
                  title="Basic usage"
                  code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

export default function SYS030101SC() {
  // Every label helper comes from a single hook call
  const { t, tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme, labels } = useScreenLabel();
  // sceId is derived automatically from TabContext -> 'SYS030101SC'

  // JSX labels
  return (
    <Form.Item label={tvt('usrId')}>   {/* SYS030101SC.VIEW.TEXT_usrId */}
      <Input />
    </Form.Item>
    <Button>{tvb('save')}</Button>      {/* SYS030101SC.VIEW.BTN_save */}
  );
}`}
                />

                <CodeSnippet
                  title="Grid column headers (SCRIPT context)"
                  code={`const { tsg, labels } = useScreenLabel();

// Include labels in deps -> headers refresh automatically on a language change
const columnDefs = useMemo<ColDef<Employee>[]>(() => [
  { field: 'empNo', headerName: tsg('usrId'),  width: 130 },
  { field: 'empNm', headerName: tsg('usrNm'),  width: 140 },
  { field: 'orgNm', headerName: tsg('orgNm'),  width: 130 },
  { field: 'gdCd',  headerName: tsg('gdCd'),   width: 90  },
], [labels]); // <- labels is required`}
                />

                <CodeSnippet
                  title="Messages and dialogs (event handlers)"
                  code={`const { tsm, tvb, tmc, tme } = useScreenLabel();
const { message, modal } = App.useApp();

const handleSave = useCallback(() => {
  form.validateFields().then(() => {
    message.success(tsm('updateSuccess'));  // SCRIPT.MSG_updateSuccess
  }).catch(() => {
    message.error(tsm('requiredCheck'));
  });
}, [form, tsm]);

const handleDelete = useCallback(() => {
  modal.confirm({
    title: tsm('deleteConfirmTitle'),
    content: tmc('C100007'),               // MESSAGE.CONFIRM.TEXT_C100007 (global)
    okText: tvb('delete'),                 // VIEW.BTN_delete
    cancelText: tvb('cancel'),
    onOk: () => { /* ... */ },
  });
}, [modal, tsm, tvb, tmc]);

// Global message examples
message.info(tmi('I100008'));    // MESSAGE.INFO.TEXT_I100008
message.error(tme('E100001'));   // MESSAGE.ERROR.TEXT_E100001`}
                />

                <CodeSnippet
                  title="Outside a TabPanel (sceId passed explicitly)"
                  code={`// Without a TabContext, pass sceId yourself
const { tvt } = useScreenLabel('SYS030101SC');`}
                />
              </div>
            ),
          },
          {
            key: 'labelStore',
            label: 'labelStore',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>labelStore</h3>
                  <p>
                    Labels are bulk-loaded from the server and kept in memory. Components reach every helper, including
                    <code>t</code>, through <code>useScreenLabel()</code>. A missing key returns the key itself, so nothing renders blank.
                  </p>
                </div>

                <Alert
                  type="info"
                  title="API details"
                  description="GET /api/lbl/bulk — no authentication required (permitAll). The X-Project-Id and X-Lang headers are injected automatically."
                  style={{ marginBottom: 16 }}
                />

                <Card title="Current state" size="small" style={{ marginBottom: 16 }}>
                  <Space>
                    <Text>Current language: <Tag color="blue">{locale}</Tag></Text>
                    <Text><Text code>t('SAVE')</Text> → <Text strong>{t('SAVE') || '(none)'}</Text></Text>
                    <Text><Text code>t('CANCEL')</Text> → <Text strong>{t('CANCEL') || '(none)'}</Text></Text>
                    <Text><Text code>t('SEARCH')</Text> → <Text strong>{t('SEARCH') || '(none)'}</Text></Text>
                  </Space>
                </Card>

                <CodeSnippet
                  title="useScreenLabel — every label through one hook"
                  code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

function MyComponent() {
  // t, tmc/tmi/tme, tvt/tvb/tsg/tsm — all of them come from here
  const { t, tmc, tmi, tme, tvt, tsm } = useScreenLabel();

  return <Button>{t('SAVE')}</Button>;
}

// Fallback when a key is missing: the key itself is returned (never an empty string)
t('NON_EXISTENT') // → 'NON_EXISTENT'

// Outside React (axios interceptors, utility functions, …)
import { useLabelStore } from '@/stores/labelStore';
useLabelStore.getState().tme('E100001')`}
                />

                <CodeSnippet
                  title="When it loads (called automatically from App.tsx)"
                  code={`// App.tsx — triggers the labelStore load (reference only, nothing to edit)
useEffect(() => {
  labelStore.loadLabels();
}, [activeProjectId, locale]); // reloads automatically when the project or language changes

// Inside fetchBulkLabels (src/api/lbl.ts)
export async function fetchBulkLabels(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/api/lbl/bulk');
  if (data.status !== 200 || !data.data) return {};
  return data.data;
}`}
                />
              </div>
            ),
          },
          {
            key: 'keyPattern',
            label: 'Key naming',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>Label key naming pattern</h3>
                  <p>
                    Every per-screen label key follows the structure <code>{`{sceId}.{CONTEXT}.{TYPE}_{field}`}</code>.
                  </p>
                </div>

                <CodeSnippet
                  title="Key structure"
                  code={`{sceId}.{CONTEXT}.{TYPE}_{field}

sceId   : screen ID        e.g. SYS030101SC
CONTEXT : VIEW | SCRIPT
  VIEW   -> inside the JSX template (label, button text, title)
  SCRIPT -> event handlers and grid headers (inside JS code)
TYPE    : TEXT | BTN | TITLE | GRID | MSG
field   : camelCase field name  e.g. usrId, save`}
                />

                <Table
                  columns={exampleCols}
                  dataSource={exampleRows}
                  size="small"
                  pagination={false}
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet
                  title="Choosing the CONTEXT"
                  code={`// VIEW — inside the JSX return block
<Form.Item label={tvt('usrId')}>    // ← VIEW.TEXT_usrId
<Button>{tvb('save')}</Button>       // ← VIEW.BTN_save
<h3>{tvh('inputPanel')}</h3>         // ← VIEW.TITLE_inputPanel

// SCRIPT — in JS code (headers, handlers)
headerName: tsg('usrId'),            // ← SCRIPT.GRID_usrId
message.success(tsm('saved')),       // ← SCRIPT.MSG_saved
okText: tvb('confirm'),              // ← VIEW.BTN_confirm`}
                />

                <CodeSnippet
                  title="Registering a label in the database (t_cco_lbl_m + t_cco_lbl_trn)"
                  code={`-- Register the master row
INSERT INTO t_cco_lbl_m (LABEL_KEY, SCREEN_ID, SECTION, TYPE, DETAIL, DEFAULT_TEXT)
VALUES ('SYS030101SC.VIEW.TEXT_usrId', 'SYS030101SC', 'VIEW', 'TEXT', 'usrId', 'User ID');

-- Korean translation
INSERT INTO t_cco_lbl_trn (LABEL_KEY, LANG_CODE, TRANSLATED_TEXT)
VALUES ('SYS030101SC.VIEW.TEXT_usrId', 'ko', '사용자ID');  -- Korean text stays as data

-- English translation
INSERT INTO t_cco_lbl_trn (LABEL_KEY, LANG_CODE, TRANSLATED_TEXT)
VALUES ('SYS030101SC.VIEW.TEXT_usrId', 'en', 'User ID');

-- Project override (a different translation for one project only)
INSERT INTO t_cco_lbl_prj_trn (LABEL_KEY, PROJECT_ID, LANG_CODE, TRANSLATED_TEXT)
VALUES ('SYS030101SC.VIEW.TEXT_usrId', 'PJ001', 'en', 'Employee ID');`}
                />
              </div>
            ),
          },
          {
            key: 'permission',
            label: 'Permissions',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>useMenuPermission</h3>
                  <p>Returns the menu permission of the active tab. canRead / canWrite are derived from the server's <code>permType</code>.</p>
                </div>

                <Card title="Permission of the current tab" size="small" style={{ marginBottom: 16 }}>
                  <Space>
                    <Text>permType: <Tag color={permType === 'AL' ? 'green' : permType === 'WT' ? 'cyan' : permType === 'RD' ? 'blue' : 'default'}>{permType || 'none'}</Tag></Text>
                    <Text>canRead: <Tag color={canRead ? 'green' : 'red'}>{String(canRead)}</Tag></Text>
                    <Text>canWrite: <Tag color={canWrite ? 'green' : 'red'}>{String(canWrite)}</Tag></Text>
                  </Space>
                </Card>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <table className="demo-props-table">
                    <thead>
                      <tr><th>permType</th><th>Meaning</th><th>canRead</th><th>canWrite</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><Tag color="green">AL</Tag></td><td>Full (read + write)</td><td>✅</td><td>✅</td></tr>
                      <tr><td><Tag color="cyan">WT</Tag></td><td>Write (includes read)</td><td>✅</td><td>✅</td></tr>
                      <tr><td><Tag color="blue">RD</Tag></td><td>Read only</td><td>✅</td><td>❌</td></tr>
                      <tr><td><Tag>none</Tag></td><td>No permission</td><td>❌</td><td>❌</td></tr>
                    </tbody>
                  </table>
                </Card>

                <CodeSnippet
                  title="Showing and hiding buttons"
                  code={`import { useMenuPermission } from '@/hooks/useMenuPermission';

function MyPage() {
  const { canWrite } = useMenuPermission();

  return (
    <GridToolbar
      totalCount={data.length}
      actions={
        <>
          <Button icon={<DownloadOutlined />}>Excel</Button>
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />}>New</Button>
          )}
        </>
      }
    />
  );
}`}
                />

                <CodeSnippet
                  title="Making an input form read-only"
                  code={`function MyPage() {
  const { canWrite } = useMenuPermission();
  const { tvt, tvb } = useScreenLabel(); // destructure only what you need

  return (
    <Form>
      <Form.Item label={tvt('usrId')} name="empNo">
        <Input readOnly={!canWrite} />
      </Form.Item>
      {canWrite && (
        <Button type="primary" onClick={handleSave}>{tvb('save')}</Button>
      )}
    </Form>
  );
}`}
                />

                <CodeSnippet
                  title="How it works"
                  code={`// Server response (GET /api/common/menus/all)
//   └─ MnuResponse.permType ('M' | 'S' | '')
//        └─ buildServerMenuTree() -> preserves MenuItem.permType
//             └─ stored in menuStore.serverMenus

// What useMenuPermission does internally
const activeTabKey = useTabStore((s) => s.activeTabKey);
const serverMenus  = useMenuStore((s) => s.serverMenus);
const menu         = findMenuByKey(serverMenus, activeTabKey);
const permType     = menu?.permType ?? '';

return {
  permType,
  canRead:  ['RD', 'WT', 'AL'].includes(permType),
  canWrite: ['WT', 'AL'].includes(permType),
};`}
                />
              </div>
            ),
          },
          {
            key: 'tabContext',
            label: 'TabContext',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>TabContext & PageHeader</h3>
                  <p>
                    <code>TabPanel</code> in <code>TabContent.tsx</code> injects the current tab data through context.
                    <code>PageHeader</code> renders automatically, so <strong>never add it inside a page component.</strong>
                  </p>
                </div>

                <Alert
                  type="warning"
                  title="Do not duplicate PageHeader"
                  description="TabContent already renders PageHeader. Adding it again inside a page component duplicates it."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet
                  title="Using TabContext (inside the component tree)"
                  code={`import { useTabContext } from '@/contexts/TabContext';

function MyComponent() {
  const ctx = useTabContext(); // null if rendered outside TabPanel
  const sceId = ctx?.tab.sceId;        // e.g. 'SYS030101SC'
  const title = ctx?.tab.title;        // tab title
  const labelKey = ctx?.tab.labelKey;  // i18n key
}`}
                />

                <CodeSnippet
                  title="How PageHeader renders automatically (reference)"
                  code={`// Inside TabContent.tsx (reference only, nothing to edit)
function TabPanel({ tab, visible }) {
  return (
    <TabContext.Provider value={{ tab }}>
      <PageHeader />         {/* <- rendered automatically */}
      <Component {...tab} /> {/* <- the actual page */}
    </TabContext.Provider>
  );
}

// What PageHeader shows
// [SYS030101SC] User management
//  └─ tab.sceId -> tab.componentKey  : [code]
//  └─ t(tab.labelKey) -> tab.title   : title`}
                />

                <CodeSnippet
                  title="Development checklist"
                  code={`// Check these when building a new screen
□ Use the page-master or page-container class
□ Never add <PageHeader /> yourself
□ Use useScreenLabel() — no hardcoded strings
□ Grid headerName: use tsg()
□ Messages and confirms: use tsm(); buttons use tvb()
□ Save and delete buttons: render conditionally on canWrite
□ Include [labels] in the useMemo deps of columnDefs`}
                />
              </div>
            ),
          },
          {
            key: 'locale',
            label: 'Switching language',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>Switching language (localeStore)</h3>
                  <p>
                    Calling <code>setLocale</code> triggers the useEffect in <code>App.tsx</code>, which calls <code>loadLabels()</code> again.
                    Supported languages: <code>ko</code> / <code>en</code> / <code>vi</code>
                  </p>
                </div>

                <Card title="Current language" size="small" style={{ marginBottom: 16 }}>
                  <Tag color="blue">{locale}</Tag>
                </Card>

                <CodeSnippet
                  title="The LocaleSelector component"
                  code={`import { useLocaleStore } from '@/stores/localeStore';
import type { LocaleKey } from '@/stores/localeStore';

function LocaleSelector() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <Select
      value={locale}
      onChange={(v) => setLocale(v as LocaleKey)}
      options={[
        { label: 'Korean', value: 'ko' },
        { label: 'English', value: 'en' },
        { label: 'Tiếng Việt', value: 'vn' },
      ]}
    />
  );
}

// How a change propagates:
// setLocale('en')
//   -> useLocaleStore updates (persist -> localStorage)
//   -> the App.tsx useEffect([locale]) fires
//   -> labelStore.loadLabels() is called
//   -> GET /api/lbl/bulk with the X-Lang: 'en' header
//   -> labels update -> the whole UI refreshes`}
                />

                <CodeSnippet
                  title="Automatic axios header injection (client.ts)"
                  code={`// src/lib/api/client.ts — the interceptor (reference)
apiClient.interceptors.request.use((config) => {
  const locale = useLocaleStore.getState().locale;
  const activeProject = useProjectStore.getState().activeProject;

  config.headers['X-Lang'] = locale;               // language
  if (activeProject) {
    config.headers['X-Project-Id'] = activeProject.id;  // project
  }
  return config;
});

// -> the headers are included automatically on GET /api/lbl/bulk
//   X-Lang: ko
//   X-Project-Id: PJ001`}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
