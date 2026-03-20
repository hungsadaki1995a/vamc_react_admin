import type { MenuItem } from '@/types/menu';

// Business menus are loaded from server after login.
// Only dashboard (home) and use menus are hardcoded here.
// componentPath = filename under src/features/*/pages/ (without .tsx)
export const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    icon: 'DashboardOutlined',
    componentPath: 'Dashboard',
  },
  {
    key: 'dev',
    label: '개발 도구',
    icon: 'ToolOutlined',
    children: [
      {
        // 우리가 만든/래핑한 커스텀 예시들의 Props·Events·라이브 데모
        key: 'dev.custom-demo',
        label: '커스텀 예시',
        children: [
          { key: 'dev.custom-demo.layout',  label: '레이아웃 컴포넌트',  componentPath: 'LayoutComponentsDemo' },
          { key: 'dev.custom-demo.input',   label: '입력 컴포넌트',      componentPath: 'InputComponentsDemo' },
          { key: 'dev.custom-demo.icons',   label: '아이콘',            componentPath: 'IconsDemo' },
          { key: 'dev.custom-demo.grid',    label: '그리드 테이블',      componentPath: 'GridEditingDemo' },
          { key: 'dev.custom-demo.editor',  label: '에디터',            componentPath: 'EditorDemo' },
          { key: 'dev.custom-demo.gantt',       label: '간트 차트',          componentPath: 'GanttDemo' },
          { key: 'dev.custom-demo.gantt-sheet', label: '간트 시트 (대용량)',  componentPath: 'GanttSheetDemo' },
          { key: 'dev.custom-demo.notify',      label: 'useNotify',          componentPath: 'NotifyDemo' },
        ],
      },
      {
        // 레이아웃 패턴별로 유사 화면을 통합한 참고용 화면 모음
        key: 'dev.patterns',
        label: '화면 패턴',
        children: [
          { key: 'dev.patterns.grid-list',     label: '목록 패턴',      componentPath: 'PatternGridList' },
          { key: 'dev.patterns.grid-form',     label: '그리드-폼 패턴', componentPath: 'PatternGridForm' },
          { key: 'dev.patterns.master-detail', label: '마스터-디테일',  componentPath: 'PatternMasterDetail' },
          { key: 'dev.patterns.kanban',        label: '칸반 보드',      componentPath: 'KanbanBoard' },
          { key: 'dev.patterns.calendar',      label: '캘린더',         componentPath: 'Calendar' },
          { key: 'dev.patterns.gantt',         label: '간트 차트',      componentPath: 'GanttChart' },
          { key: 'dev.patterns.timeline',      label: '타임라인',       componentPath: 'Milestone' },
          { key: 'dev.patterns.dashboard',     label: '대시보드',       componentPath: 'PatternDashboard' },
          { key: 'dev.patterns.admin',         label: '관리/폼',        componentPath: 'PatternAdmin' },
          { key: 'dev.patterns.i18n-label',    label: '다국어 라벨 관리', componentPath: 'PatternI18nLabel' },
        ],
      },
      {
        // 외부 라이브러리(AG Grid, frappe-gantt, Ant Design 등) 자체 API 학습 자료
        key: 'dev.guide',
        label: '개발 가이드',
        children: [
          { key: 'dev.guide.antd',         label: 'Ant Design',         componentPath: 'GuideAntDesign' },
          { key: 'dev.guide.zustand',       label: 'Zustand',            componentPath: 'GuideZustand' },
          { key: 'dev.guide.router',        label: 'React Router',       componentPath: 'GuideReactRouter' },
          { key: 'dev.guide.react-query',   label: 'React Query',        componentPath: 'GuideReactQuery' },
          { key: 'dev.guide.ag-grid',       label: 'AG Grid',            componentPath: 'GuideAgGrid' },
          { key: 'dev.guide.tiptap',        label: 'TipTap 에디터',      componentPath: 'GuideTipTap' },
          { key: 'dev.guide.gantt',         label: 'Frappe Gantt',       componentPath: 'GuideFrappeGantt' },
          { key: 'dev.guide.datepicker',    label: 'DatePicker/Calendar', componentPath: 'GuideDatePicker' },
          { key: 'dev.guide.dayjs',         label: 'dayjs',              componentPath: 'GuideDayjs' },
          { key: 'dev.guide.lodash',        label: 'Lodash',             componentPath: 'GuideLodash' },
          { key: 'dev.guide.chartjs',       label: 'Chart.js',           componentPath: 'GuideChartJs' },
          { key: 'dev.guide.i18n-perm',    label: '다국어 & 권한',        componentPath: 'GuideI18nPermission' },
          { key: 'dev.guide.internal-api', label: '내부 API 레퍼런스',    componentPath: 'GuideInternalApi' },
          { key: 'dev.guide.excel',        label: '엑셀 업로드/다운로드', componentPath: 'GuideExcel' },
        ],
      },
    ],
  },
];
