import type { LocaleKey } from '@/stores/localeStore';
import styles from './index.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// 가이드의 섹션 메타와 머리말 — 데이터만 둔다.
//
// 섹션 번호·앵커·목차 제목은 여기 한 곳에만 둔다. 언어별 본문 파일에 두면
// 번역이 하나 늦을 때 목차와 본문이 어긋난다.
//
// 컴포넌트(Code/Note/DataTable)는 parts.tsx 다 — 한 파일이 둘을 함께 export 하면
// Fast Refresh 가 동작하지 않는다(react-refresh/only-export-components).
// ─────────────────────────────────────────────────────────────────────────────

export interface Section {
  /** 앵커 id. 언어와 무관하게 고정한다 */
  id: string;
  title: Record<LocaleKey, string>;
}

export const SECTIONS: Section[] = [
  { id: 'prepare', title: { ko: '준비하기',        en: 'Getting Ready',        vn: 'Chuẩn bị' } },
  { id: 'sceid',   title: { ko: '화면ID 정하기',   en: 'Choose a Screen ID',   vn: 'Đặt mã màn hình' } },
  { id: 'menu',    title: { ko: '메뉴 등록',       en: 'Register the Menu',    vn: 'Đăng ký menu' } },
  { id: 'empty',   title: { ko: '빈 화면 만들기',  en: 'Create an Empty Page', vn: 'Tạo màn hình rỗng' } },
  { id: 'api',     title: { ko: 'API 파일 만들기', en: 'Create the API File',  vn: 'Tạo tệp API' } },
  { id: 'list',    title: { ko: '목록 조회 화면',  en: 'List Screen',          vn: 'Màn hình danh sách' } },
  { id: 'crud',    title: { ko: '등록·수정·삭제',  en: 'Create / Edit / Delete', vn: 'Thêm · Sửa · Xoá' } },
  { id: 'perm',    title: { ko: '권한 연결',       en: 'Wire Up Permissions',  vn: 'Kết nối phân quyền' } },
  { id: 'label',   title: { ko: '다국어 라벨',     en: 'i18n Labels',          vn: 'Nhãn đa ngôn ngữ' } },
  { id: 'state',   title: { ko: '상태 관리',       en: 'State Management',     vn: 'Quản lý trạng thái' } },
  { id: 'check',   title: { ko: '마무리 체크리스트', en: 'Final Checklist',    vn: 'Danh sách kiểm tra' } },
];

/** 페이지 머리말 — 목차 라벨과 부제 */
export const PAGE_TEXT: Record<LocaleKey, {
  title: string;
  desc: React.ReactNode;
  toc: string;
  copy: string;
  copied: string;
}> = {
  ko: {
    title: '신규 화면 개발 가이드',
    desc: <>메뉴 등록부터 CRUD 화면까지, 위에서부터 순서대로 따라가면 됩니다.
      예시는 <span className={styles.path}>컨텐츠 관리 &gt; 공지사항 관리</span> 화면을 만듭니다.</>,
    toc: '목차', copy: '복사', copied: '복사됨',
  },
  en: {
    title: 'Building a New Screen',
    desc: <>From registering a menu to a working CRUD screen — follow the steps top to bottom.
      The running example builds <span className={styles.path}>Content &gt; Notice Management</span>.</>,
    toc: 'Contents', copy: 'Copy', copied: 'Copied',
  },
  vn: {
    title: 'Hướng dẫn tạo màn hình mới',
    desc: <>Từ đăng ký menu đến màn hình CRUD hoàn chỉnh — làm theo thứ tự từ trên xuống.
      Ví dụ xuyên suốt sẽ tạo màn hình <span className={styles.path}>Quản lý nội dung &gt; Quản lý thông báo</span>.</>,
    toc: 'Mục lục', copy: 'Sao chép', copied: 'Đã sao chép',
  },
};
