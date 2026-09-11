// 개발 도구 메뉴의 영어·베트남어 이름.
//
// 🔴 이 사전은 DB 라벨(LANG_LBL)이 아니라 코드에 둔다. 이유가 있다 —
//   ① `/api/lbl/bulk` 는 permitAll 이고 전량 전송이라, 운영 번들에서 트리셰이킹으로
//      사라진 개발 도구의 메뉴 이름이 DB 에 남아 모든 사용자에게 나간다.
//      DEV_TOOLS_ENABLED 게이트를 건 이유(내부 구조 비노출)와 어긋난다.
//   ② DA 가 관리하는 실 DB 에 개발용 데이터 126행(42 × 3언어)이 섞인다.
//   ③ 메뉴를 하나 추가할 때마다 DB 패치가 필요해져 코드와 DB 가 따로 논다.
//
// 판단 기준 — **`DEV_TOOLS_ENABLED=false` 빌드에서 화면에 남는 문구인가.**
// 남으면 DB 라벨, 사라지면 이 사전.
//
// 한국어는 여기 두지 않는다. `menuConfig.ts` 의 `label` 이 정본이고,
// 이 파일에 키가 없으면 그 값으로 폴백한다 — 번역을 빠뜨려도 화면은 정상 동작한다.
//
// menuConfig.ts 와 함께 DEV_TOOLS_ENABLED 로 트리셰이킹된다.

export interface DevMenuLabel {
  en: string;
  vn: string;
}

export const DEV_MENU_LABELS: Record<string, DevMenuLabel> = {
  'dev':                          { en: 'Dev Tools',            vn: 'Công cụ phát triển' },
  'dev.overview':                 { en: 'Dev Guide',            vn: 'Hướng dẫn phát triển' },

  // 공통 컴포넌트 데모
  'dev.components':               { en: 'Component Demos',      vn: 'Demo thành phần chung' },
  'dev.components.layout':        { en: 'Layout',               vn: 'Bố cục' },
  'dev.components.input':         { en: 'Inputs',               vn: 'Nhập liệu' },
  'dev.components.action-button': { en: 'ActionButton',         vn: 'ActionButton' },
  'dev.components.icons':         { en: 'Icons',                vn: 'Biểu tượng' },
  'dev.components.grid':          { en: 'Data Grid',            vn: 'Lưới dữ liệu' },
  'dev.components.editor':        { en: 'Editors',              vn: 'Trình soạn thảo' },
  'dev.components.gantt':         { en: 'Gantt Chart',          vn: 'Biểu đồ Gantt' },
  'dev.components.gantt-sheet':   { en: 'Gantt Sheet (large)',  vn: 'Bảng Gantt (dữ liệu lớn)' },
  'dev.components.notify':        { en: 'useNotify',            vn: 'useNotify' },

  // 화면 빌더
  'dev.builder':                  { en: 'Screen Builder',       vn: 'Trình tạo màn hình' },
  'dev.builder.screen':           { en: 'Screen Generator',     vn: 'Tạo màn hình' },
  'dev.builder.code':             { en: 'Code Templates',       vn: 'Mẫu mã nguồn' },

  // 화면/조합 패턴
  'dev.patterns':                 { en: 'Screen Patterns',      vn: 'Mẫu màn hình' },
  'dev.patterns.grid-list':       { en: 'List',                 vn: 'Danh sách' },
  'dev.patterns.grid-form':       { en: 'Grid + Form',          vn: 'Lưới + Biểu mẫu' },
  'dev.patterns.master-detail':   { en: 'Master-Detail',        vn: 'Chính - Chi tiết' },
  'dev.patterns.filter-grid':     { en: 'Filter + Grid',        vn: 'Bộ lọc + Lưới' },
  'dev.patterns.kanban':          { en: 'Kanban Board',         vn: 'Bảng Kanban' },
  'dev.patterns.calendar':        { en: 'Calendar',             vn: 'Lịch' },
  'dev.patterns.gantt':           { en: 'Gantt Chart',          vn: 'Biểu đồ Gantt' },
  'dev.patterns.timeline':        { en: 'Timeline',             vn: 'Dòng thời gian' },
  'dev.patterns.dashboard':       { en: 'Dashboard',            vn: 'Bảng điều khiển' },
  'dev.patterns.admin':           { en: 'Admin / Form',         vn: 'Quản trị / Biểu mẫu' },

  // 라이브러리/내부 가이드
  'dev.lib':                      { en: 'Libraries & Internals', vn: 'Thư viện & Nội bộ' },
  'dev.lib.antd':                 { en: 'Ant Design',           vn: 'Ant Design' },
  'dev.lib.zustand':              { en: 'Zustand',              vn: 'Zustand' },
  'dev.lib.router':               { en: 'React Router',         vn: 'React Router' },
  'dev.lib.react-query':          { en: 'React Query',          vn: 'React Query' },
  'dev.lib.ag-grid':              { en: 'AG Grid',              vn: 'AG Grid' },
  'dev.lib.tiptap':               { en: 'TipTap Editor',        vn: 'Trình soạn thảo TipTap' },
  'dev.lib.gantt':                { en: 'Frappe Gantt',         vn: 'Frappe Gantt' },
  'dev.lib.datepicker':           { en: 'DatePicker/Calendar',  vn: 'DatePicker/Lịch' },
  'dev.lib.dayjs':                { en: 'dayjs',                vn: 'dayjs' },
  'dev.lib.chartjs':              { en: 'Chart.js',             vn: 'Chart.js' },
  'dev.lib.i18n-perm':            { en: 'i18n & Permissions',   vn: 'Đa ngôn ngữ & Phân quyền' },
  'dev.lib.internal-api':         { en: 'Internal API Reference', vn: 'Tham chiếu API nội bộ' },
  'dev.lib.excel':                { en: 'Excel Up/Download',    vn: 'Tải lên/xuống Excel' },
};
