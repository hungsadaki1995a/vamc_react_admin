import type { MenuItem } from '@/types/menu';

// Business menus are loaded from server after login.
// Only dashboard (home) and use menus are hardcoded here.
// componentPath = filename under src/features/*/pages/ (without .tsx)

// Dev-only menu tree — must NEVER ship to production (info disclosure: GuideInternalApi 등).
// Excluded from the array below when `import.meta.env.PROD` is true; Vite statically
// replaces that constant, so this whole object (and its component imports via
// componentRegistry.tsx's glob) tree-shakes out of the production bundle.
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
        { key: 'dev.components.gantt',        label: '간트 차트',           componentPath: 'GanttDemo' },
        { key: 'dev.components.gantt-sheet',  label: '간트 시트 (대용량)',   componentPath: 'GanttSheetDemo' },
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
        { key: 'dev.patterns.i18n-label',    label: '다국어 라벨 관리', componentPath: 'PatternI18nLabel' },
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
        { key: 'dev.lib.gantt',        label: 'Frappe Gantt',        componentPath: 'GuideFrappeGantt' },
        { key: 'dev.lib.datepicker',   label: 'DatePicker/Calendar', componentPath: 'GuideDatePicker' },
        { key: 'dev.lib.dayjs',        label: 'dayjs',               componentPath: 'GuideDayjs' },
        { key: 'dev.lib.lodash',       label: 'Lodash',              componentPath: 'GuideLodash' },
        { key: 'dev.lib.chartjs',      label: 'Chart.js',            componentPath: 'GuideChartJs' },
        { key: 'dev.lib.i18n-perm',    label: '다국어 & 권한',        componentPath: 'GuideI18nPermission' },
        { key: 'dev.lib.internal-api', label: '내부 API 레퍼런스',    componentPath: 'GuideInternalApi' },
        { key: 'dev.lib.excel',        label: '엑셀 업로드/다운로드', componentPath: 'GuideExcel' },
      ],
    },
  ],
};

export const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    icon: 'DashboardOutlined',
    componentPath: 'Dashboard',
  },
  {
    key: 'admin',
    label: '어드민',
    icon: 'SettingOutlined',
    children: [
      {
        key: 'admin.system',
        label: '시스템',
        children: [
          {
            key: 'admin.system.menu',
            label: '메뉴 관리',
            componentPath: 'AdminMenuManagement',
          },
        ],
      },
    ],
  },
  // Dev tools menu — local dev only, stripped from production builds.
  ...(import.meta.env.PROD ? [] : [devMenu]),
];
