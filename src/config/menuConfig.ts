import type { MenuItem } from '@/types/menu';

// Business menus are loaded from server after login.
// Only dashboard (home) and use menus are hardcoded here.
// componentPath = 화면 폴더명 — 업무 화면은 src/features/{도메인}/{폴더}/index.tsx,
//                  데모·가이드는 src/dev/pages/{폴더}/index.tsx

// 개발 도구 노출 여부.
// - `pnpm dev` (import.meta.env.DEV) → 항상 노출
// - 빌드 산출물 → VITE_ENABLE_DEV_TOOLS=true 로 빌드한 경우에만 노출
//
// Vite 가 두 상수를 모두 빌드 시점에 리터럴로 치환하므로 false 로 접히면
// devMenu 객체와 dev 화면 import(componentRegistry.tsx 의 glob)가 통째로 트리셰이킹된다.
//
// 운영 이미지에는 절대 켜지 말 것 — GuideInternalApi 가 내부 API/스토어 구조를 노출한다.
// componentRegistry.tsx 에 동일한 플래그가 있으니 값을 바꿀 땐 함께 수정한다.
export const DEV_TOOLS_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

// Dev-only menu tree.
// Member management menu tree
export const memberMenu: MenuItem = {
  key: 'member',
  label: 'Member Management',
  icon: 'UserOutlined',
  children: [
    {
      key: 'member.list',
      label: 'Member Management',
      componentPath: 'MemberList',
    },
  ],
};

const devMenu: MenuItem = {
  key: 'dev',
  label: '개발 도구',
  icon: 'ToolOutlined',
  children: [
    // 개발 도구 전체 안내 — 1단 leaf (폴더 없음)
    { key: 'dev.overview', label: '개발가이드', componentPath: 'DevGuideHome' },
    {
      // 우리가 만든/래핑한 공통 컴포넌트의 Props·Events·라이브 데모
      key: 'dev.components',
      label: '공통 컴포넌트 데모',
      children: [
        { key: 'dev.components.layout',       label: '레이아웃 컴포넌트',   componentPath: 'LayoutComponentsDemo' },
        { key: 'dev.components.input',        label: '입력 컴포넌트',       componentPath: 'InputComponentsDemo' },
        { key: 'dev.components.action-button', label: 'ActionButton',       componentPath: 'ActionButtonDemo' },
        { key: 'dev.components.icons',        label: '아이콘',              componentPath: 'IconsDemo' },
        { key: 'dev.components.grid',         label: '그리드 테이블',       componentPath: 'GridEditingDemo' },
        { key: 'dev.components.editor',       label: '에디터',              componentPath: 'EditorDemo' },
        { key: 'dev.components.gantt',        label: '간트 차트',           componentPath: 'GanttSheetDemo' },
        { key: 'dev.components.notify',       label: 'useNotify',           componentPath: 'NotifyDemo' },
      ],
    },
    {
      // 메뉴/화면 스캐폴딩 도구
      key: 'dev.builder',
      label: '화면 빌더',
      children: [
        { key: 'dev.builder.screen', label: '화면 생성기',   componentPath: 'ScreenBuilder' },
        { key: 'dev.builder.code',   label: '코드 템플릿',   componentPath: 'CodeTemplateBuilder' },
      ],
    },
    {
      // 레이아웃 패턴별로 유사 화면을 통합한 참고용 화면 모음
      key: 'dev.patterns',
      label: '화면/조합 패턴',
      children: [
        { key: 'dev.patterns.grid-list',     label: '목록 패턴',       componentPath: 'PatternGridList' },
        { key: 'dev.patterns.grid-form',     label: '그리드-폼 패턴',  componentPath: 'PatternGridForm' },
        { key: 'dev.patterns.master-detail', label: '마스터-디테일',   componentPath: 'PatternMasterDetail' },
        { key: 'dev.patterns.filter-grid',   label: '필터-그리드',     componentPath: 'SampleFilterGrid' },
        { key: 'dev.patterns.kanban',        label: '칸반 보드',       componentPath: 'KanbanBoard' },
        { key: 'dev.patterns.calendar',      label: '캘린더',          componentPath: 'Calendar' },
        { key: 'dev.patterns.gantt',         label: '간트 차트',       componentPath: 'GanttChart' },
        { key: 'dev.patterns.timeline',      label: '타임라인',        componentPath: 'Milestone' },
        { key: 'dev.patterns.dashboard',     label: '대시보드',        componentPath: 'PatternDashboard' },
        { key: 'dev.patterns.admin',         label: '관리/폼',         componentPath: 'PatternAdmin' },
      ],
    },
    {
      // 외부 라이브러리 자체 API + 내부 공통 기능 레퍼런스
      key: 'dev.lib',
      label: '라이브러리/내부 가이드',
      children: [
        { key: 'dev.lib.antd',         label: 'Ant Design',          componentPath: 'GuideAntDesign' },
        { key: 'dev.lib.zustand',      label: 'Zustand',             componentPath: 'GuideZustand' },
        { key: 'dev.lib.router',       label: 'React Router',        componentPath: 'GuideReactRouter' },
        { key: 'dev.lib.react-query',  label: 'React Query',         componentPath: 'GuideReactQuery' },
        { key: 'dev.lib.ag-grid',      label: 'AG Grid',             componentPath: 'GuideAgGrid' },
        { key: 'dev.lib.tiptap',       label: 'TipTap 에디터',        componentPath: 'GuideTipTap' },
        { key: 'dev.lib.datepicker',   label: 'DatePicker/Calendar', componentPath: 'GuideDatePicker' },
        { key: 'dev.lib.dayjs',        label: 'dayjs',               componentPath: 'GuideDayjs' },
        { key: 'dev.lib.chartjs',      label: 'Chart.js',            componentPath: 'GuideChartJs' },
        { key: 'dev.lib.i18n-perm',    label: '다국어 & 권한',        componentPath: 'GuideI18nPermission' },
        { key: 'dev.lib.internal-api', label: '내부 API 레퍼런스',    componentPath: 'GuideInternalApi' },
        { key: 'dev.lib.excel',        label: '엑셀 업로드/다운로드', componentPath: 'GuideExcel' },
        { key: 'dev.lib.reporting',    label: '리포팅 서버 호출',     componentPath: 'GuideReportingServer' },
      ],
    },
  ],
};

// 정적 메뉴의 labelKey 는 서버 메뉴와 같은 네임스페이스(`lbl.menu.*`)를 쓴다 —
// DB 에서도 같은 SCRN_ID('AD_MN_00000') / LBL_SE_CD('MENU') 로 관리된다.
// labelKey 가 있는 항목만 useAllMenus() 가 로케일 라벨로 치환하고,
// 없으면 아래 label 이 그대로 쓰인다 (개발 도구 트리는 번역 대상이 아니라 두지 않는다).
export const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    labelKey: 'lbl.menu.dashboard',
    icon: 'DashboardOutlined',
    componentPath: 'Dashboard',
  },
  // 업무 메뉴는 여기 두지 않는다 — 서버(MENU_MNG)가 IA 기준 트리를 내려준다.
  // 정적으로 중복 정의하면 같은 화면이 좌측 레일에 두 번 나온다.
  // 개발 도구 — DEV_TOOLS_ENABLED 가 false 인 빌드에서는 트리셰이킹으로 사라진다.
  memberMenu,
  ...(DEV_TOOLS_ENABLED ? [devMenu] : []),
];
