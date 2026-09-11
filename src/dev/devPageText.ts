import type { LocaleKey } from '@/stores/localeStore';

// 개발 도구 화면의 제목과 한 줄 설명.
//
// 🔴 DB 라벨(LANG_LBL)이 아니라 코드에 둔다 — 개발 도구는 운영 번들에서 통째로 빠지는데
//    `/api/lbl/bulk` 는 permitAll 전량 전송이라 라벨만 남아 모든 사용자에게 나간다.
//    판단 기준과 근거는 `@/config/devMenuLabels` 주석에 있다.
//
// 본문(표·코드 예시·설명 산문)은 번역 대상이 아니다. 개발자만 보고 대부분이 코드와
// API 이름이라, 한 줄 설명만 있으면 "이 화면이 무엇인지"는 알 수 있다.
// 본문까지 옮기면 화면 하나를 고칠 때마다 세 벌을 함께 고쳐야 한다.
//
// 키는 화면 폴더명(= componentPath)이다. 여기 없는 화면은 헤더를 그리지 않는다.

export interface DevPageText {
  title: string;
  /** 비우면 부제를 그리지 않는다 */
  desc?: string;
}

export const DEV_PAGE_TEXT: Record<string, Record<LocaleKey, DevPageText>> = {

  // ── 공통 컴포넌트 데모 ────────────────────────────────────────────────────
  ActionButtonDemo: {
    ko: { title: 'ActionButton', desc: '화면 전반의 액션 버튼 표준. action 프리셋으로 아이콘·스타일을 통일하고, ActionButtonGroup의 preset으로 버튼 정렬 순서를, canWrite로 쓰기 권한 연동을 처리합니다.' },
    en: { title: 'ActionButton', desc: 'The standard action button across screens. The action preset fixes the icon and style, ActionButtonGroup\'s preset fixes the button order, and canWrite wires up write permission.' },
    vn: { title: 'ActionButton', desc: 'Chuẩn nút hành động dùng chung cho mọi màn hình. Preset action thống nhất biểu tượng và kiểu dáng, preset của ActionButtonGroup quyết định thứ tự nút, canWrite kết nối quyền ghi.' },
  },
  LayoutComponentsDemo: {
    ko: { title: '레이아웃 컴포넌트', desc: 'VAMC NPL ADMIN에서 제공하는 레이아웃 공통 컴포넌트의 사용 예시입니다.' },
    en: { title: 'Layout Components', desc: 'Usage examples for the shared layout components provided by VAMC NPL ADMIN.' },
    vn: { title: 'Thành phần bố cục', desc: 'Ví dụ sử dụng các thành phần bố cục dùng chung của VAMC NPL ADMIN.' },
  },
  InputComponentsDemo: {
    ko: { title: '입력 컴포넌트', desc: '커스텀 입력 컴포넌트 및 Ant Design 기본 입력 컴포넌트 사용 예시입니다.' },
    en: { title: 'Input Components', desc: 'Usage examples for the custom input components and the built-in Ant Design inputs.' },
    vn: { title: 'Thành phần nhập liệu', desc: 'Ví dụ sử dụng các thành phần nhập liệu tuỳ chỉnh và thành phần nhập liệu mặc định của Ant Design.' },
  },
  IconsDemo: {
    ko: { title: '아이콘 갤러리', desc: '메뉴와 화면에서 쓸 수 있는 아이콘 목록입니다.' },
    en: { title: 'Icon Gallery', desc: 'Icons available for menus and screens.' },
    vn: { title: 'Thư viện biểu tượng', desc: 'Danh sách biểu tượng có thể dùng cho menu và màn hình.' },
  },
  GridEditingDemo: {
    ko: { title: '그리드 테이블', desc: 'GridTable / GridToolbar / GridPanel 컴포넌트와 셀 편집기(Cell Editor) 사용 예시입니다.' },
    en: { title: 'Data Grid', desc: 'Usage examples for GridTable / GridToolbar / GridPanel and the cell editors.' },
    vn: { title: 'Lưới dữ liệu', desc: 'Ví dụ sử dụng GridTable / GridToolbar / GridPanel và các trình sửa ô (Cell Editor).' },
  },
  EditorDemo: {
    ko: { title: '에디터 데모', desc: '리치텍스트·코드·스프레드시트 에디터 컴포넌트 데모입니다.' },
    en: { title: 'Editor Demo', desc: 'Demos of the rich text, code and spreadsheet editor components.' },
    vn: { title: 'Demo trình soạn thảo', desc: 'Demo các thành phần soạn thảo văn bản, mã nguồn và bảng tính.' },
  },
  GanttDemo: {
    ko: { title: '간트 차트', desc: 'GanttView 컴포넌트의 Props, Events 및 라이브 데모입니다.' },
    en: { title: 'Gantt Chart', desc: 'Props, events and a live demo of the GanttView component.' },
    vn: { title: 'Biểu đồ Gantt', desc: 'Props, sự kiện và demo trực tiếp của thành phần GanttView.' },
  },
  GanttSheetDemo: {
    ko: { title: '간트 시트 (GanttSheet)', desc: 'Virtual Scroll 기반 대용량 간트 컴포넌트 — 5,000행+ 60fps 스크롤. GanttView와 동일한 Props.' },
    en: { title: 'Gantt Sheet (GanttSheet)', desc: 'Large-scale Gantt component built on virtual scrolling — 5,000+ rows at 60fps. Same props as GanttView.' },
    vn: { title: 'Bảng Gantt (GanttSheet)', desc: 'Thành phần Gantt cho dữ liệu lớn dựa trên cuộn ảo — hơn 5.000 dòng ở 60fps. Props giống GanttView.' },
  },
  NotifyDemo: {
    ko: { title: 'useNotify', desc: 'antd message / notification / modal을 하나의 훅으로 제공합니다. dialog는 타입별 i18n 기본값(title · okText · cancelText · danger)이 자동 적용되며, 호출 시 개별 오버라이드 가능합니다.' },
    en: { title: 'useNotify', desc: 'One hook for antd message / notification / modal. Dialogs get i18n defaults per type (title, okText, cancelText, danger) automatically, and each can be overridden at the call site.' },
    vn: { title: 'useNotify', desc: 'Một hook cho message / notification / modal của antd. Hộp thoại tự áp dụng giá trị đa ngôn ngữ mặc định theo loại (title, okText, cancelText, danger) và có thể ghi đè khi gọi.' },
  },

  // ── 화면 빌더 ─────────────────────────────────────────────────────────────
  ScreenBuilder: {
    ko: { title: '화면 생성기', desc: '레이아웃 패턴을 선택해 src/features/{도메인}/{화면ID}/index.tsx 스캐폴드를 생성합니다.' },
    en: { title: 'Screen Generator', desc: 'Pick a layout pattern and scaffold src/features/{domain}/{screenId}/index.tsx.' },
    vn: { title: 'Trình tạo màn hình', desc: 'Chọn mẫu bố cục để tạo khung src/features/{miền}/{mã màn hình}/index.tsx.' },
  },
  CodeTemplateBuilder: {
    ko: { title: '코드 템플릿', desc: '프로젝트 컨벤션에 맞춘 보일러플레이트를 생성합니다. 이름을 입력하면 즉시 반영됩니다.' },
    en: { title: 'Code Templates', desc: 'Generates boilerplate that follows the project conventions. Type a name and it updates instantly.' },
    vn: { title: 'Mẫu mã nguồn', desc: 'Sinh mã khung theo quy ước của dự án. Nhập tên là cập nhật ngay.' },
  },

  // ── 라이브러리 / 내부 가이드 ───────────────────────────────────────────────
  GuideAntDesign: {
    ko: { title: 'Ant Design 가이드', desc: '오프라인 참조용 Ant Design 컴포넌트 튜토리얼' },
    en: { title: 'Ant Design Guide', desc: 'Offline reference tutorial for Ant Design components' },
    vn: { title: 'Hướng dẫn Ant Design', desc: 'Tài liệu tham khảo ngoại tuyến cho các thành phần Ant Design' },
  },
  GuideZustand: {
    ko: { title: 'Zustand 가이드', desc: '오프라인 참조용 Zustand 상태 관리 튜토리얼' },
    en: { title: 'Zustand Guide', desc: 'Offline reference tutorial for Zustand state management' },
    vn: { title: 'Hướng dẫn Zustand', desc: 'Tài liệu tham khảo ngoại tuyến về quản lý trạng thái với Zustand' },
  },
  GuideReactRouter: {
    ko: { title: 'React Router 가이드', desc: '오프라인 참조용 React Router v7 튜토리얼' },
    en: { title: 'React Router Guide', desc: 'Offline reference tutorial for React Router v7' },
    vn: { title: 'Hướng dẫn React Router', desc: 'Tài liệu tham khảo ngoại tuyến cho React Router v7' },
  },
  GuideReactQuery: {
    ko: { title: 'React Query 가이드', desc: '오프라인 참조용 TanStack React Query 튜토리얼' },
    en: { title: 'React Query Guide', desc: 'Offline reference tutorial for TanStack React Query' },
    vn: { title: 'Hướng dẫn React Query', desc: 'Tài liệu tham khảo ngoại tuyến cho TanStack React Query' },
  },
  GuideAgGrid: {
    ko: { title: 'AG Grid 가이드', desc: '오프라인 참조용 AG Grid 튜토리얼' },
    en: { title: 'AG Grid Guide', desc: 'Offline reference tutorial for AG Grid' },
    vn: { title: 'Hướng dẫn AG Grid', desc: 'Tài liệu tham khảo ngoại tuyến cho AG Grid' },
  },
  GuideTipTap: {
    ko: { title: 'TipTap 에디터 가이드', desc: '오프라인 참조용 TipTap 리치텍스트 에디터 튜토리얼' },
    en: { title: 'TipTap Editor Guide', desc: 'Offline reference tutorial for the TipTap rich text editor' },
    vn: { title: 'Hướng dẫn trình soạn thảo TipTap', desc: 'Tài liệu tham khảo ngoại tuyến cho trình soạn thảo TipTap' },
  },
  GuideFrappeGantt: {
    ko: { title: 'Frappe Gantt 가이드', desc: '오프라인 참조용 Frappe Gantt 튜토리얼' },
    en: { title: 'Frappe Gantt Guide', desc: 'Offline reference tutorial for Frappe Gantt' },
    vn: { title: 'Hướng dẫn Frappe Gantt', desc: 'Tài liệu tham khảo ngoại tuyến cho Frappe Gantt' },
  },
  GuideDatePicker: {
    ko: { title: 'DatePicker / Calendar 가이드', desc: '오프라인 참조용 날짜 입력·달력 컴포넌트 튜토리얼' },
    en: { title: 'DatePicker / Calendar Guide', desc: 'Offline reference tutorial for the date input and calendar components' },
    vn: { title: 'Hướng dẫn DatePicker / Lịch', desc: 'Tài liệu tham khảo ngoại tuyến cho thành phần nhập ngày và lịch' },
  },
  GuideDayjs: {
    ko: { title: 'dayjs 가이드', desc: '오프라인 참조용 dayjs 날짜 처리 튜토리얼' },
    en: { title: 'dayjs Guide', desc: 'Offline reference tutorial for date handling with dayjs' },
    vn: { title: 'Hướng dẫn dayjs', desc: 'Tài liệu tham khảo ngoại tuyến về xử lý ngày giờ với dayjs' },
  },
  GuideChartJs: {
    ko: { title: 'Chart.js 가이드', desc: '오프라인 참조용 Chart.js 차트 튜토리얼' },
    en: { title: 'Chart.js Guide', desc: 'Offline reference tutorial for Chart.js charts' },
    vn: { title: 'Hướng dẫn Chart.js', desc: 'Tài liệu tham khảo ngoại tuyến cho biểu đồ Chart.js' },
  },
  GuideI18nPermission: {
    ko: { title: '다국어(i18n) & 권한(Permission) 가이드', desc: '라벨 키 규약, useScreenLabel, useMenuPermission 사용법 정리' },
    en: { title: 'i18n & Permission Guide', desc: 'Label key conventions, useScreenLabel and useMenuPermission' },
    vn: { title: 'Hướng dẫn đa ngôn ngữ & phân quyền', desc: 'Quy ước khoá nhãn, cách dùng useScreenLabel và useMenuPermission' },
  },
  GuideExcel: {
    ko: { title: '엑셀 업로드 / 다운로드', desc: '화면마다 ExcelColumnDef[]를 선언하면 ExcelButton 하나로 다운로드·업로드·템플릿을 모두 처리합니다. 최대 5만건 대응 (SAX 파싱 + MyBatis Cursor 스트리밍).' },
    en: { title: 'Excel Upload / Download', desc: 'Declare ExcelColumnDef[] per screen and a single ExcelButton handles download, upload and templates. Supports up to 50,000 rows (SAX parsing + MyBatis cursor streaming).' },
    vn: { title: 'Tải lên / tải xuống Excel', desc: 'Khai báo ExcelColumnDef[] cho từng màn hình, chỉ một ExcelButton lo cả tải xuống, tải lên và mẫu. Hỗ trợ tối đa 50.000 dòng (phân tích SAX + luồng con trỏ MyBatis).' },
  },
  GuideInternalApi: {
    ko: { title: '내부 API 레퍼런스', desc: 'VAMC NPL ADMIN에서 제공하는 Hooks, Stores, Utils, Contexts, Config, lib/api 사용법 정리' },
    en: { title: 'Internal API Reference', desc: 'Hooks, stores, utils, contexts, config and lib/api provided by VAMC NPL ADMIN' },
    vn: { title: 'Tham chiếu API nội bộ', desc: 'Hooks, store, tiện ích, context, cấu hình và lib/api do VAMC NPL ADMIN cung cấp' },
  },

  // ── 관리 화면 데모 ────────────────────────────────────────────────────────
  MenuManagement: {
    ko: { title: '메뉴 관리', desc: '메뉴 트리 편집 데모입니다.' },
    en: { title: 'Menu Management', desc: 'Demo of editing the menu tree.' },
    vn: { title: 'Quản lý menu', desc: 'Demo chỉnh sửa cây menu.' },
  },
  PermissionManagement: {
    ko: { title: '메뉴 권한 관리', desc: '역할별 메뉴 권한 편집 데모입니다.' },
    en: { title: 'Menu Permissions', desc: 'Demo of editing menu permissions per role.' },
    vn: { title: 'Quản lý quyền menu', desc: 'Demo chỉnh sửa quyền menu theo vai trò.' },
  },
  AuditLog: {
    ko: { title: '감사 로그', desc: '사용자 행위 이력 조회 데모입니다.' },
    en: { title: 'Audit Log', desc: 'Demo of browsing the user activity history.' },
    vn: { title: 'Nhật ký kiểm tra', desc: 'Demo tra cứu lịch sử thao tác của người dùng.' },
  },
  Milestone: {
    ko: { title: '마일스톤', desc: '일정 마일스톤 데모입니다.' },
    en: { title: 'Milestones', desc: 'Demo of schedule milestones.' },
    vn: { title: 'Cột mốc', desc: 'Demo các cột mốc tiến độ.' },
  },
};
