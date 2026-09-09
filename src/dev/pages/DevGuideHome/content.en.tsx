import { Code, Note, DataTable } from './parts';
import styles from './index.module.css';
import {
  TERMINAL, SQL_ROLE, CODE_EMPTY, CODE_API, CODE_LIST, CODE_CRUD,
  CODE_PERM, CODE_LABEL, CODE_STATE,
} from './snippets.en';

const L = 'en' as const;

// 코드 예시의 주석은 한국어다 — 저장소에 그대로 붙여 넣는 코드이고,
// 이 저장소의 주석 규약이 한국어이기 때문이다(snippets.ts 참조).

export const CONTENT_EN: Record<string, React.ReactNode> = {

  prepare: (
    <>
      <p className={styles.lead}>
        To build a screen, <b>the backend and Redis must be running.</b>
        Starting the frontend alone fails at login.
      </p>

      <Code file="Terminal" locale={L}>{TERMINAL}</Code>

      <p>
        Open <span className={styles.path}>http://localhost:3000</span> and sign in with
        <b> user01 / user123$</b>.
      </p>

      <Note type="warn" title="Always use the local Redis.">
        If you point at the dev-server Redis, a few failed logins on your machine will
        <b> lock the real dev-server account for 30 minutes.</b>
      </Note>

      <Note title="Backend API address">
        Leave <code>VITE_API_BASE_URL</code> empty in <span className={styles.path}>.env.local</span> and the
        Vite proxy forwards <code>/api</code> requests to <code>http://127.0.0.1:8080</code>.
        That is the default, so you rarely need to touch it.
      </Note>
    </>
  ),

  sceid: (
    <>
      <p className={styles.lead}>
        One screen ID is used as <b>the folder name, MENU_URL_ADDR in the DB, and the label-key prefix</b>
        all at once. So decide it before writing any code.
      </p>

      <p>
        The format is <code>{'{domain3}{group2}{sub2}{seq2}{type2}'}</code> — 11 characters,
        derived directly from the menu code.
      </p>

      <Code locale={L}>{`Menu code   A04  01  00  00     Content > Notice Management
             │    │   │
Domain (3) ──┘    │   │        A04 → CNT
Group  (2) ───────┘   │
Sub    (2) ───────────┘
Seq (2) = 01, Type (2) = SC

→ Screen ID = CNT010001SC`}</Code>

      <DataTable
        head={['Top-level menu', 'Menu code', 'Domain']}
        rows={[
          ['Member Management', <code>A01</code>, <code>MBR</code>],
          ['Trade Management', <code>A02</code>, <code>TRD</code>],
          ['NPL Information', <code>A03</code>, <code>NPL</code>],
          ['Content Management', <code>A04</code>, <code>CNT</code>],
          ['Statistics', <code>A05</code>, <code>STT</code>],
          ['System Operations', <code>A06</code>, <code>SYS</code>],
          ['Auction Management', <code>A07</code>, <code>AUC</code>],
        ]}
      />

      <p>
        The type is <code>SC</code> (a screen attached to a menu) or
        <code> 1P</code>·<code>2P</code> (a popup — parent screen ID plus a sequence number).
      </p>

      <Note type="danger" title="Once assigned, it never changes.">
        Even if the menu moves to another group, keep the screen ID.
        Changing it <b>shifts every label key of that screen</b> and breaks all translations.
      </Note>
    </>
  ),

  menu: (
    <>
      <p className={styles.lead}>
        Menus live in the <b>database, not in code</b>. But you do not have to write SQL —
        register, edit and delete them in
        <span className={styles.path}>System Operations &gt; Admin Menu Management</span>.
      </p>

      <h4>First check whether the menu already exists</h4>
      <p>
        56 menus from the planning IA are already loaded. Most have <b>an empty component path</b>,
        so clicking them shows a &quot;not implemented&quot; notice.
        If the menu for your screen already exists, you only fill in that one field.
      </p>
      <p>
        Search for menu code <code>A04010000</code>, click the <b>Notice Management</b> row, and the form below
        fills in. Put the screen ID you chose — <code>CNT010001SC</code> — into
        <b> Component Path</b> and save.
      </p>

      <h4>If the menu does not exist — create one</h4>
      <p>Clear the form (Reset), enter the values below, and save.</p>

      <DataTable
        head={['Field', 'Value', 'Notes']}
        rows={[
          ['Menu code', <code>A04070000</code>, 'Cannot be changed after creation'],
          ['Menu name (KR)', 'Sample Management', 'Fallback for languages without a translation'],
          ['Localized name', 'Sample Mgmt', <>Saved as the name for <b>the language you searched with</b></>],
          ['Parent menu code', <code>A04000000</code>, 'Required'],
          ['Menu order', '7', 'Ordering among siblings'],
          ['Menu level', '—', <><b>Computed by the server</b> from the parent menu</>],
          ['Component path', <code>CNT070001SC</code>, 'Screen ID. Empty means "not implemented"'],
          ['Label code', '—', <>Empty is filled with <code>lbl.menu.{'{'}menuCode{'}'}</code></>],
        ]}
      />

      <Note title="One save writes both the menu and its name.">
        The server handles the menu row (<code>MENU_MNG</code>) and the menu-name label
        (<code>LANG_LBL</code> + <code>LANG_LBL_TRSL</code>) in a single transaction.
        Without the label the menu name shows up as <code>lbl.menu.…</code>, so the two are never split.
      </Note>

      <h4>Entering names in other languages</h4>
      <p>
        <b>The localized name is saved for the language in the search condition.</b> To enter the English
        name, switch <b>Language</b> in the search area to <code>EN</code>, search, click the row,
        edit the localized name and save. Vietnamese works the same way.
      </p>

      <h4>Deleting</h4>
      <p>
        Selecting a row and deleting removes the menu, its role mappings and its convention label.
        <b> It is rejected when child menus exist</b> — a child that loses its parent becomes a row that
        appears on no screen at all. Delete the children first.
      </p>

      <h4>One more step for a new menu — granting permission (SQL)</h4>
      <p>
        <b>Saving does not make the menu visible yet.</b> The menu tree is fetched by joining role
        permissions (<code>MENU_ROLE_MPNG</code>), and a new menu has no mapping yet.
      </p>
      <p>
        Granting permissions belongs to
        <span className={styles.path}>System Operations &gt; Admin Management &gt; Admin Menu Permissions</span>
        (<code>A06030400</code>), but <b>that screen is not implemented yet.</b> Until it is, use SQL.
      </p>

      <Code file="SQL — grant role permission" locale={L}>{SQL_ROLE}</Code>

      <Note type="warn" title="Not needed when you only attach a screen to an existing menu.">
        The 56 menus that came from the IA already have ADMIN permission.
        This step applies <b>only when you create a new menu</b>.
      </Note>

      <Note title="Once the Admin Menu Permissions screen exists">
        This SQL belongs there. The menu-registration screen does not touch permissions — if permissions
        could be granted in two places, <b>nobody could explain who granted what</b>.
        (Building that screen is, incidentally, a good exercise for this guide.)
      </Note>

      <Note type="warn" title="If it does not show up right away, it is the cache.">
        Saving clears the server-side menu cache, but the left rail is also cached in the browser.
        <b> Log out and back in</b> to be sure.
      </Note>

      <Note type="danger" title="The developer DB account can only run DML.">
        <code>CREATE / ALTER / DROP</code> are blocked on the server.
        <code> CREATE command denied</code> is expected behaviour, not a fault.
        Ask the DA when you need a table.
      </Note>
    </>
  ),

  empty: (
    <>
      <p className={styles.lead}>
        <b>Name the folder after the screen ID and you are done.</b> There is nothing to register —
        <code> componentRegistry</code> discovers <code>src/features/*/*/index.tsx</code> automatically.
      </p>

      <Code file="src/features/cnt/CNT010001SC/index.tsx" locale={L}>{CODE_EMPTY}</Code>

      <p>Save, click the menu, and a tab opens with this screen. That confirms the wiring.</p>

      <DataTable
        head={['Rule', 'Why']}
        rows={[
          [<>Folders are two levels: <code>features/{'{domain}'}/{'{screenId}'}/</code></>,
           'The glob is fixed at two levels; anything deeper is not discovered'],
          [<>Popups go in a child folder <code>{'{screenId}'}/{'{screenId}'}1P/</code></>,
           'Three levels, so excluded automatically — intentional, they must not open from a menu'],
          [<>Demos and samples go in <code>src/dev/pages/</code></>,
           'They are dropped entirely from the production build'],
        ]}
      />

      <Note type="warn" title='If you get "not implemented" instead of your screen'>
        Check that the folder name and <code>MENU_URL_ADDR</code> match <b>character for character</b>.
        Case matters too.
      </Note>
    </>
  ),

  api: (
    <>
      <p className={styles.lead}>
        API call code goes in <code>src/api/{'{domain}'}/{'{feature}'}Api.ts</code>, <b>with no exceptions</b>.
        Never create an <code>api.ts</code> inside a screen folder — as soon as another screen needs the same
        API it starts importing from a screen, and from then on nobody can tell which one is the original.
      </p>

      <Code file="src/api/cnt/noticeApi.ts" locale={L}>{CODE_API}</Code>

      <Note type="danger" title="Do not forget the status → success conversion.">
        The server returns only <code>{'{ status, message, data }'}</code> — there is no <code>success</code> field.
        <code> useApiQuery / useApiMutation</code> decide success by <code>success === true</code>, so if you skip
        the conversion <b>even a successful response is treated as a failure.</b>
      </Note>

      <Note title="Always prefix the path with /api.">
        <code>baseURL</code> is empty, so the Vite proxy only forwards requests that start with <code>/api</code>.
      </Note>

      <h4>File naming rules</h4>
      <ul>
        <li>Add the <code>Api</code> suffix so <b>the filename alone tells you it is an API file</b>.</li>
        <li>The first part is the <b>feature name</b>, not the screen ID — <code>noticeApi.ts</code>, <code>lblMngApi.ts</code>.</li>
        <li><b>One-word abbreviations are banned</b> (<code>usr.ts</code>, <code>lbl.ts</code>). The moment a read
          file and a management file exist for the same resource, they become indistinguishable.</li>
      </ul>

      <h4>If the server endpoint does not exist yet</h4>
      <p>
        The screen renders an empty list and a 404 toast appears. Add the endpoint to the admin API
        (<code>vamc-npl-admin-backend</code>) in this order. The detailed rules are in that
        repository&apos;s <code>README.md</code>.
      </p>
      <Code locale={L}>{`1. dto/        Request/response DTOs (with validation annotations)
2. domain/     Entity
3. mapper/     Mapper interface + XML
4. service/    Service (@Transactional)
5. controller/ Controller (Swagger annotations + @Valid)
   → Successful responses must be wrapped in ApiResponse<T>
   → Write APIs call permissionGuard.assertMenuWrite(authentication, "A04010000")`}</Code>
    </>
  ),

  list: (
    <>
      <p className={styles.lead}>
        A screen has three blocks, top to bottom: <b>search → grid → form</b>.
        Layout is handled by shared components, so never write flex rules inside a screen.
      </p>

      <Code file="src/features/cnt/CNT010001SC/index.tsx" locale={L}>{CODE_LIST}</Code>

      <DataTable
        head={['Component', 'Role']}
        rows={[
          [<code>FilterPanel</code>, 'Search area. Provides the Search and Reset buttons itself'],
          [<code>{'<div className="page-body">'}</code>, 'Standard class that passes the remaining height to the body'],
          [<code>GridPanel</code>, 'Toolbar (count, buttons) + AG Grid'],
          [<code>useApiQuery</code>, <>Unwraps <code>ApiResponse</code> and returns only <code>data</code></>],
        ]}
      />

      <Note title="Filtering happens on the server.">
        Do not fetch everything and <code>filter()</code> on the screen. It works today because the data is
        small, but it becomes an incident as rows grow. Put the conditions in the <code>queryKey</code> —
        React Query refetches on its own when they change.
      </Note>

      <Note title="To split the grid left and right">
        Use <code>SplitPanel</code>. It comes with a drag handle, and section titles go into
        <code> GridPanel</code>&apos;s <code>title</code> prop.
      </Note>
    </>
  ),

  crud: (
    <>
      <p className={styles.lead}>
        Attach a <code>FormPanel</code> below the grid and fill it when a row is clicked.
        <b> Create and edit share one form</b>; which one it is depends on whether a row is selected.
      </p>

      <Code file="src/features/cnt/CNT010001SC/index.tsx (continued)" locale={L}>{CODE_CRUD}</Code>

      <h4>Three things you must get right</h4>
      <DataTable
        head={['Item', 'Why']}
        rows={[
          [<>Prefix <code>invalidateQueries</code> after saving</>,
           <><code>refetch()</code> only refreshes the current condition&apos;s cache; searching with a different condition returns stale rows</>],
          [<>Do not attach <code>onError</code></>,
           <>The <code>apiClient</code> interceptor already shows the error toast. Attaching one shows it twice</>],
          [<>Use <code>ActionButtonGroup</code> for buttons</>,
           'Button order, icons and permission wiring stay consistent through the preset'],
        ]}
      />

      <Note title="If you need a screen-specific error message">
        Pass <code>{'{ skipErrorToast: true }'}</code> on the request and handle it in <code>onError</code>.
      </Note>
    </>
  ),

  perm: (
    <>
      <p className={styles.lead}>
        Permissions are defined by <code>MENU_ROLE_MPNG.MENU_AUTHRT</code>.
        <b> A read-only user must never be able to press Save.</b>
      </p>

      <DataTable
        head={['Value', 'Meaning', 'canRead', 'canWrite']}
        rows={[
          [<code>RD</code>, 'Read', 'O', 'X'],
          [<code>WT</code>, 'Write (includes read)', 'O', 'O'],
          [<code>AL</code>, 'All', 'O', 'O'],
        ]}
      />

      <Code locale={L}>{CODE_PERM}</Code>

      <Note title="Disable, do not hide.">
        A button that disappears leaves the user guessing. A greyed-out button makes the permission
        problem visible.
      </Note>

      <Note type="danger" title="Guarding the screen is not a permission check.">
        It is trivially bypassed from the browser. <b>Server write APIs must also call</b>
        <code> permissionGuard.assertMenuWrite(authentication, &quot;menuCode&quot;)</code>.
      </Note>
    </>
  ),

  label: (
    <>
      <p className={styles.lead}>
        Screen text comes from <b>DB labels</b>, never hardcoded. Leave Korean in the code and it stays
        Korean no matter which language is selected.
      </p>

      <Code locale={L}>{CODE_LABEL}</Code>

      <DataTable
        head={['Function', 'Key shape', 'Used for']}
        rows={[
          [<code>tvt</code>, <code>VIEW.TEXT_</code>, 'Field and item labels'],
          [<code>tvb</code>, <code>VIEW.BTN_</code>, 'Buttons'],
          [<code>tvh</code>, <code>VIEW.TITLE_</code>, 'Section and panel titles'],
          [<code>tsg</code>, <code>SCRIPT.GRID_</code>, 'Grid headers'],
          [<code>tsm</code>, <code>SCRIPT.MSG_</code>, 'Messages specific to this screen'],
          [<code>tmc / tmi / tme</code>, <code>MESSAGE.*</code>, 'Global confirm / info / error'],
        ]}
      />

      <h4>Registering labels</h4>
      <p>
        Register them in <span className={styles.path}>System Operations &gt; Label Management</span>.
        Enter the screen ID, category and detail code and the label code is assembled for you;
        enter the per-language translations in the grid on the right.
      </p>

      <Note title="The second argument is a fallback.">
        Passing a default like <code>tvt(&apos;ntcTtl&apos;, &apos;제목&apos;)</code> keeps the screen working
        even before the label exists.
        <b> Develop against fallbacks and register all labels at once when the screen is settled</b> —
        that is usually easier. Global messages (<code>tmc/tmi/tme</code>) have no fallback: if they are
        not registered, the raw key is displayed.
      </Note>
    </>
  ),

  state: (
    <>
      <p className={styles.lead}>
        Decide where state lives by <b>splitting it three ways</b>. The first two cover almost everything.
      </p>

      <DataTable
        head={['What', 'Where', 'Examples']}
        rows={[
          ['Data fetched from the server', <b>React Query</b>, 'Lists, details, common codes'],
          ['Values used only by this screen', <b>useState</b>, 'Selected row, search input, form collapse'],
          ['Shared beyond the screen', <b>Zustand</b>, 'Login info, tabs, theme, labels'],
        ]}
      />

      <Code locale={L}>{CODE_STATE}</Code>

      <Note type="danger" title="Never put server data in Zustand.">
        You end up managing caching, refetching and loading state yourself, and one missed refresh after a
        save means <b>different screens show different data.</b> Leave anything from the server to React Query.
      </Note>

      <h4>Stores that already exist</h4>
      <p>Check this list before creating a new one.</p>
      <DataTable
        head={['Store', 'Holds']}
        rows={[
          [<code>authStore</code>, 'Token, user, roles'],
          [<code>tabStore</code>, 'Open tabs'],
          [<code>menuStore</code>, 'Rail/flyout state, server menus'],
          [<code>labelStore</code>, 'i18n label cache'],
          [<code>comcdStore</code>, 'Common-code cache'],
          [<><code>localeStore</code> / <code>themeStore</code></>, 'Language, dark mode'],
        ]}
      />
    </>
  ),

  check: (
    <>
      <p className={styles.lead}>Run through this before committing.</p>

      <ul className={styles.checklist}>
        <li>Clicking the menu opens a tab and renders the screen</li>
        <li>Folder name = <code>MENU_URL_ADDR</code> = label-key prefix, all identical</li>
        <li>API functions live under <code>src/api/</code> and do the <code>status → success</code> conversion</li>
        <li>Search conditions go to the server (no <code>filter()</code> on the screen)</li>
        <li>The list refreshes via <code>invalidateQueries</code> after save and delete</li>
        <li>No duplicate error toast from an <code>onError</code> handler</li>
        <li>Write buttons are bound to <code>canWrite</code> and the server checks permission too</li>
        <li>Screen text goes through <code>useScreenLabel</code> (no hardcoded Korean)</li>
        <li>Layout uses <code>page-body</code> and <code>SplitPanel</code> (no hand-written flex)</li>
        <li><code>npx tsc -b</code> and <code>npm run lint</code> both pass
          <b>(<code>--noEmit</code> checks nothing here)</b></li>
      </ul>

      <Note title="Where to look when you are stuck">
        Two finished screens are the reference —
        <span className={styles.path}>src/features/sys/SYS030101SC</span> (single grid + form) and
        <span className={styles.path}>src/features/sys/SYS050301SC</span> (split view + CRUD).
        Props for the shared components are in the demo screens under <b>Dev Tools</b> on the left.
      </Note>
    </>
  ),
};
