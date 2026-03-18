import type { MnuResponse } from '@/api/menu';

// Flat MnuResponse[] matching /api/common/menus/all response format.
// buildServerMenuTree() in src/api/menu.ts builds the tree from this flat list.
// upMenuCd that is not present in the list → treated as root item (gets rail icon).
export const mockMenus: MnuResponse[] = [
  // ── 회원관리 (depth 1) ─────────────────────────────────────────────────────
  { menuCd: 'A01------', upMenuCd: 'A--------', lblCd: 'lbl.menu.member',         menuSeq: 0, menuDpth: 1, menuNmDisplay: '회원관리',           sortPath: '001', children: [] },
  { menuCd: 'A0101----', upMenuCd: 'A01------', lblCd: 'lbl.menu.member.join',    menuSeq: 0, menuDpth: 2, menuNmDisplay: '회원가입 관리',       menuUrlAddr: '/admin/member/join',     sortPath: '001-001', children: [] },
  { menuCd: 'A0102----', upMenuCd: 'A01------', lblCd: 'lbl.menu.member.active',  menuSeq: 0, menuDpth: 2, menuNmDisplay: '활성회원 관리',       menuUrlAddr: '/admin/member/active',   sortPath: '001-002', children: [] },
  { menuCd: 'A0103----', upMenuCd: 'A01------', lblCd: 'lbl.menu.member.dormant', menuSeq: 0, menuDpth: 2, menuNmDisplay: '휴면회원 관리',       menuUrlAddr: '/admin/member/dormant',  sortPath: '001-003', children: [] },

  // ── 거래 관리 (depth 1) ────────────────────────────────────────────────────
  { menuCd: 'A02------', upMenuCd: 'A--------', lblCd: 'lbl.menu.trade',                   menuSeq: 0, menuDpth: 1, menuNmDisplay: '거래 관리',               sortPath: '002', children: [] },
  { menuCd: 'A0201----', upMenuCd: 'A02------', lblCd: 'lbl.menu.trade.apply',             menuSeq: 0, menuDpth: 2, menuNmDisplay: '신청 관리',               sortPath: '002-001', children: [] },
  { menuCd: 'A020101--', upMenuCd: 'A0201----', lblCd: 'lbl.menu.trade.apply.buy',         menuSeq: 0, menuDpth: 3, menuNmDisplay: '매입 신청 관리',           menuUrlAddr: '/admin/trade/apply/buy',      sortPath: '002-001-001', children: [] },
  { menuCd: 'A020102--', upMenuCd: 'A0201----', lblCd: 'lbl.menu.trade.apply.sell',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '매각 신청 관리',           menuUrlAddr: '/admin/trade/apply/sell',     sortPath: '002-001-002', children: [] },
  { menuCd: 'A020103--', upMenuCd: 'A0201----', lblCd: 'lbl.menu.trade.apply.consult',     menuSeq: 0, menuDpth: 3, menuNmDisplay: '컨설팅 신청 관리',         menuUrlAddr: '/admin/trade/apply/consult',  sortPath: '002-001-003', children: [] },
  { menuCd: 'A0202----', upMenuCd: 'A02------', lblCd: 'lbl.menu.trade.contract',          menuSeq: 0, menuDpth: 2, menuNmDisplay: '계약 관리',               sortPath: '002-002', children: [] },
  { menuCd: 'A020201--', upMenuCd: 'A0202----', lblCd: 'lbl.menu.trade.contract.buy',      menuSeq: 0, menuDpth: 3, menuNmDisplay: '매입 관리(승인 포함)',     menuUrlAddr: '/admin/trade/contract/buy',     sortPath: '002-002-001', children: [] },
  { menuCd: 'A020202--', upMenuCd: 'A0202----', lblCd: 'lbl.menu.trade.contract.sell',     menuSeq: 0, menuDpth: 3, menuNmDisplay: '매각 관리(승인 포함)',     menuUrlAddr: '/admin/trade/contract/sell',    sortPath: '002-002-002', children: [] },
  { menuCd: 'A020203--', upMenuCd: 'A0202----', lblCd: 'lbl.menu.trade.contract.consult',  menuSeq: 0, menuDpth: 3, menuNmDisplay: '컨설팅 관리(승인 포함)',   menuUrlAddr: '/admin/trade/contract/consult', sortPath: '002-002-003', children: [] },

  // ── NPL정보 관리 (depth 1) ─────────────────────────────────────────────────
  { menuCd: 'A03------', upMenuCd: 'A--------', lblCd: 'lbl.menu.npl',                        menuSeq: 0, menuDpth: 1, menuNmDisplay: 'NPL정보 관리',           sortPath: '003', children: [] },
  { menuCd: 'A0301----', upMenuCd: 'A03------', lblCd: 'lbl.menu.npl.customer',               menuSeq: 0, menuDpth: 2, menuNmDisplay: '고객 NPL 정보 관리',     sortPath: '003-001', children: [] },
  { menuCd: 'A030101--', upMenuCd: 'A0301----', lblCd: 'lbl.menu.npl.customer.bad',           menuSeq: 0, menuDpth: 3, menuNmDisplay: '부실채권관리',           menuUrlAddr: '/admin/npl/customer/bad-debt',  sortPath: '003-001-001', children: [] },
  { menuCd: 'A030102--', upMenuCd: 'A0301----', lblCd: 'lbl.menu.npl.customer.collateral',    menuSeq: 0, menuDpth: 3, menuNmDisplay: '담보자산 관리',         menuUrlAddr: '/admin/npl/customer/collateral', sortPath: '003-001-002', children: [] },
  { menuCd: 'A030103--', upMenuCd: 'A0301----', lblCd: 'lbl.menu.npl.customer.debtor',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '채무자 관리',           menuUrlAddr: '/admin/npl/customer/debtor',     sortPath: '003-001-003', children: [] },
  { menuCd: 'A030104--', upMenuCd: 'A0301----', lblCd: 'lbl.menu.npl.customer.creditor',      menuSeq: 0, menuDpth: 3, menuNmDisplay: '채권자 관리',           menuUrlAddr: '/admin/npl/customer/creditor',   sortPath: '003-001-004', children: [] },
  { menuCd: 'A0302----', upMenuCd: 'A03------', lblCd: 'lbl.menu.npl.vamc',                   menuSeq: 0, menuDpth: 2, menuNmDisplay: 'VAMC NPL 정보 관리',    sortPath: '003-002', children: [] },
  { menuCd: 'A030201--', upMenuCd: 'A0302----', lblCd: 'lbl.menu.npl.vamc.bad',               menuSeq: 0, menuDpth: 3, menuNmDisplay: '부실채권관리',           menuUrlAddr: '/admin/npl/vamc/bad-debt',      sortPath: '003-002-001', children: [] },
  { menuCd: 'A030202--', upMenuCd: 'A0302----', lblCd: 'lbl.menu.npl.vamc.collateral',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '담보자산 관리',         menuUrlAddr: '/admin/npl/vamc/collateral',    sortPath: '003-002-002', children: [] },
  { menuCd: 'A0303----', upMenuCd: 'A03------', lblCd: 'lbl.menu.npl.eval',                   menuSeq: 0, menuDpth: 2, menuNmDisplay: 'NPL 평가정보 관리',      sortPath: '003-003', children: [] },
  { menuCd: 'A030301--', upMenuCd: 'A0303----', lblCd: 'lbl.menu.npl.eval.bad',               menuSeq: 0, menuDpth: 3, menuNmDisplay: '부실채권관리',           menuUrlAddr: '/admin/npl/eval/bad-debt',      sortPath: '003-003-001', children: [] },
  { menuCd: 'A030302--', upMenuCd: 'A0303----', lblCd: 'lbl.menu.npl.eval.collateral',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '담보자산 관리',         menuUrlAddr: '/admin/npl/eval/collateral',    sortPath: '003-003-002', children: [] },
  { menuCd: 'A0304----', upMenuCd: 'A03------', lblCd: 'lbl.menu.npl.lot',                    menuSeq: 0, menuDpth: 2, menuNmDisplay: '채권 LOT 관리',          sortPath: '003-004', children: [] },
  { menuCd: 'A030401--', upMenuCd: 'A0304----', lblCd: 'lbl.menu.npl.lot.change',             menuSeq: 0, menuDpth: 3, menuNmDisplay: '채권 LOT 변경 관리',     menuUrlAddr: '/admin/npl/lot/change',         sortPath: '003-004-001', children: [] },

  // ── 컨텐츠 관리 (depth 1) ──────────────────────────────────────────────────
  { menuCd: 'A04------', upMenuCd: 'A--------', lblCd: 'lbl.menu.contents',          menuSeq: 0, menuDpth: 1, menuNmDisplay: '컨텐츠 관리',         sortPath: '004', children: [] },
  { menuCd: 'A0401----', upMenuCd: 'A04------', lblCd: 'lbl.menu.contents.notice',   menuSeq: 0, menuDpth: 2, menuNmDisplay: '공지사항 관리',       menuUrlAddr: '/admin/contents/notice',   sortPath: '004-001', children: [] },
  { menuCd: 'A0402----', upMenuCd: 'A04------', lblCd: 'lbl.menu.contents.news',     menuSeq: 0, menuDpth: 2, menuNmDisplay: 'VAMC 뉴스 관리',      menuUrlAddr: '/admin/contents/news',     sortPath: '004-002', children: [] },
  { menuCd: 'A0403----', upMenuCd: 'A04------', lblCd: 'lbl.menu.contents.announce', menuSeq: 0, menuDpth: 2, menuNmDisplay: '부실채권 공고 관리',   menuUrlAddr: '/admin/contents/announce', sortPath: '004-003', children: [] },
  { menuCd: 'A0404----', upMenuCd: 'A04------', lblCd: 'lbl.menu.contents.qna',      menuSeq: 0, menuDpth: 2, menuNmDisplay: '1:1문의 관리',         menuUrlAddr: '/admin/contents/qna',      sortPath: '004-004', children: [] },
  { menuCd: 'A0405----', upMenuCd: 'A04------', lblCd: 'lbl.menu.contents.faq',      menuSeq: 0, menuDpth: 2, menuNmDisplay: 'FAQ 관리',             menuUrlAddr: '/admin/contents/faq',      sortPath: '004-005', children: [] },
  { menuCd: 'A0406----', upMenuCd: 'A04------', lblCd: 'lbl.menu.contents.banner',   menuSeq: 0, menuDpth: 2, menuNmDisplay: '배너 관리',             menuUrlAddr: '/admin/contents/banner',   sortPath: '004-006', children: [] },

  // ── 통계 (depth 1) ─────────────────────────────────────────────────────────
  { menuCd: 'A05------', upMenuCd: 'A--------', lblCd: 'lbl.menu.stats',                         menuSeq: 0, menuDpth: 1, menuNmDisplay: '통계',                       sortPath: '005', children: [] },
  { menuCd: 'A0501----', upMenuCd: 'A05------', lblCd: 'lbl.menu.stats.system',                  menuSeq: 0, menuDpth: 2, menuNmDisplay: '시스템 통계',               sortPath: '005-001', children: [] },
  { menuCd: 'A050101--', upMenuCd: 'A0501----', lblCd: 'lbl.menu.stats.system.customer',         menuSeq: 0, menuDpth: 3, menuNmDisplay: '고객정보 통계',             menuUrlAddr: '/admin/stats/system/customer', sortPath: '005-001-001', children: [] },
  { menuCd: 'A050102--', upMenuCd: 'A0501----', lblCd: 'lbl.menu.stats.system.member',           menuSeq: 0, menuDpth: 3, menuNmDisplay: '회원정보 통계',             menuUrlAddr: '/admin/stats/system/member',   sortPath: '005-001-002', children: [] },
  { menuCd: 'A050103--', upMenuCd: 'A0501----', lblCd: 'lbl.menu.stats.system.visitor',          menuSeq: 0, menuDpth: 3, menuNmDisplay: '웹사이트 방문자 통계',       menuUrlAddr: '/admin/stats/system/visitor',  sortPath: '005-001-003', children: [] },
  { menuCd: 'A0502----', upMenuCd: 'A05------', lblCd: 'lbl.menu.stats.npl',                     menuSeq: 0, menuDpth: 2, menuNmDisplay: 'NPL 정보 통계',             sortPath: '005-002', children: [] },
  { menuCd: 'A050201--', upMenuCd: 'A0502----', lblCd: 'lbl.menu.stats.npl.bad',                 menuSeq: 0, menuDpth: 3, menuNmDisplay: '부실채권(NPL) 통계',         menuUrlAddr: '/admin/stats/npl/bad-debt',    sortPath: '005-002-001', children: [] },
  { menuCd: 'A0503----', upMenuCd: 'A05------', lblCd: 'lbl.menu.stats.collateral',              menuSeq: 0, menuDpth: 2, menuNmDisplay: '담보자산 정보 통계',         sortPath: '005-003', children: [] },
  { menuCd: 'A050301--', upMenuCd: 'A0503----', lblCd: 'lbl.menu.stats.collateral.asset',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '담보자산 통계',             menuUrlAddr: '/admin/stats/collateral/asset',    sortPath: '005-003-001', children: [] },
  { menuCd: 'A050302--', upMenuCd: 'A0503----', lblCd: 'lbl.menu.stats.collateral.register',     menuSeq: 0, menuDpth: 3, menuNmDisplay: 'NPL/담보자산 등록 통계',     menuUrlAddr: '/admin/stats/collateral/register', sortPath: '005-003-002', children: [] },
  { menuCd: 'A050303--', upMenuCd: 'A0503----', lblCd: 'lbl.menu.stats.collateral.upload',       menuSeq: 0, menuDpth: 3, menuNmDisplay: '업로드 파일 통계',           menuUrlAddr: '/admin/stats/collateral/upload',   sortPath: '005-003-003', children: [] },
  { menuCd: 'A0504----', upMenuCd: 'A05------', lblCd: 'lbl.menu.stats.value',                   menuSeq: 0, menuDpth: 2, menuNmDisplay: 'NPL/담보자산 가치 통계',     sortPath: '005-004', children: [] },
  { menuCd: 'A050401--', upMenuCd: 'A0504----', lblCd: 'lbl.menu.stats.value.npl',               menuSeq: 0, menuDpth: 3, menuNmDisplay: 'NPL 가치 통계',             menuUrlAddr: '/admin/stats/value/npl',        sortPath: '005-004-001', children: [] },
  { menuCd: 'A050402--', upMenuCd: 'A0504----', lblCd: 'lbl.menu.stats.value.collateral',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '담보자산 가치 통계',         menuUrlAddr: '/admin/stats/value/collateral', sortPath: '005-004-002', children: [] },
  { menuCd: 'A050403--', upMenuCd: 'A0504----', lblCd: 'lbl.menu.stats.value.disclosure',        menuSeq: 0, menuDpth: 3, menuNmDisplay: 'NPL/담보자산 공시 통계',     menuUrlAddr: '/admin/stats/value/disclosure', sortPath: '005-004-003', children: [] },
  { menuCd: 'A050404--', upMenuCd: 'A0504----', lblCd: 'lbl.menu.stats.value.region',            menuSeq: 0, menuDpth: 3, menuNmDisplay: '지역별 NPL/담보자산 통계',   menuUrlAddr: '/admin/stats/value/region',     sortPath: '005-004-004', children: [] },

  // ── 시스템 운영 관리 (depth 1) ─────────────────────────────────────────────
  { menuCd: 'A06------', upMenuCd: 'A--------', lblCd: 'lbl.menu.system',                   menuSeq: 0, menuDpth: 1, menuNmDisplay: '시스템 운영 관리',       sortPath: '006', children: [] },
  { menuCd: 'A0601----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.website',           menuSeq: 0, menuDpth: 2, menuNmDisplay: 'WEBSITE 관리',           sortPath: '006-001', children: [] },
  { menuCd: 'A060101--', upMenuCd: 'A0601----', lblCd: 'lbl.menu.system.website.menu',      menuSeq: 0, menuDpth: 3, menuNmDisplay: 'WEB 메뉴 설정',          menuUrlAddr: '/admin/system/website/menu', sortPath: '006-001-001', children: [] },
  { menuCd: 'A060102--', upMenuCd: 'A0601----', lblCd: 'lbl.menu.system.website.form',      menuSeq: 0, menuDpth: 3, menuNmDisplay: '양식관리',               menuUrlAddr: '/admin/system/website/form', sortPath: '006-001-002', children: [] },
  { menuCd: 'A060103--', upMenuCd: 'A0601----', lblCd: 'lbl.menu.system.website.fee',       menuSeq: 0, menuDpth: 3, menuNmDisplay: '수수료 관리',             menuUrlAddr: '/admin/system/website/fee',  sortPath: '006-001-003', children: [] },
  { menuCd: 'A0602----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.app',               menuSeq: 0, menuDpth: 2, menuNmDisplay: 'APP 관리',               sortPath: '006-002', children: [] },
  { menuCd: 'A060201--', upMenuCd: 'A0602----', lblCd: 'lbl.menu.system.app.version',       menuSeq: 0, menuDpth: 3, menuNmDisplay: '버전 관리',               menuUrlAddr: '/admin/system/app/version',  sortPath: '006-002-001', children: [] },
  { menuCd: 'A0603----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.admin',             menuSeq: 0, menuDpth: 2, menuNmDisplay: 'ADMIN 관리',             sortPath: '006-003', children: [] },
  { menuCd: 'A060301--', upMenuCd: 'A0603----', lblCd: 'lbl.menu.system.admin.menu',        menuSeq: 0, menuDpth: 3, menuNmDisplay: 'ADMIN 메뉴 설정',        menuUrlAddr: '/admin/system/admin/menu',   sortPath: '006-003-001', children: [] },
  { menuCd: 'A060302--', upMenuCd: 'A0603----', lblCd: 'lbl.menu.system.admin.user',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '사용자 관리',             menuUrlAddr: '/admin/system/admin/user',   sortPath: '006-003-002', children: [] },
  { menuCd: 'A060303--', upMenuCd: 'A0603----', lblCd: 'lbl.menu.system.admin.group',       menuSeq: 0, menuDpth: 3, menuNmDisplay: '그룹사용자 관리',         menuUrlAddr: '/admin/system/admin/group',  sortPath: '006-003-003', children: [] },
  { menuCd: 'A060304--', upMenuCd: 'A0603----', lblCd: 'lbl.menu.system.admin.auth',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '메뉴권한 관리',           menuUrlAddr: '/admin/system/admin/auth',   sortPath: '006-003-004', children: [] },
  { menuCd: 'A0604----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.code',              menuSeq: 0, menuDpth: 2, menuNmDisplay: '코드관리',               sortPath: '006-004', children: [] },
  { menuCd: 'A060401--', upMenuCd: 'A0604----', lblCd: 'lbl.menu.system.code.common',       menuSeq: 0, menuDpth: 3, menuNmDisplay: '공통코드 관리',           menuUrlAddr: '/admin/system/code/common',   sortPath: '006-004-001', children: [] },
  { menuCd: 'A060402--', upMenuCd: 'A0604----', lblCd: 'lbl.menu.system.code.region',       menuSeq: 0, menuDpth: 3, menuNmDisplay: '지역코드 관리',           menuUrlAddr: '/admin/system/code/region',   sortPath: '006-004-002', children: [] },
  { menuCd: 'A060403--', upMenuCd: 'A0604----', lblCd: 'lbl.menu.system.code.finance',      menuSeq: 0, menuDpth: 3, menuNmDisplay: '금융기관코드 관리',       menuUrlAddr: '/admin/system/code/finance',  sortPath: '006-004-003', children: [] },
  { menuCd: 'A060404--', upMenuCd: 'A0604----', lblCd: 'lbl.menu.system.code.label',        menuSeq: 0, menuDpth: 3, menuNmDisplay: '다국어 라벨 관리',       menuUrlAddr: '/admin/system/code/label',    sortPath: '006-004-004', children: [] },
  { menuCd: 'A0605----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.program',           menuSeq: 0, menuDpth: 2, menuNmDisplay: '프로그램 관리',           menuUrlAddr: '/admin/system/program',       sortPath: '006-005', children: [] },
  { menuCd: 'A0606----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.batch',             menuSeq: 0, menuDpth: 2, menuNmDisplay: '배치 관리',               menuUrlAddr: '/admin/system/batch',         sortPath: '006-006', children: [] },
  { menuCd: 'A0607----', upMenuCd: 'A06------', lblCd: 'lbl.menu.system.alarm',             menuSeq: 0, menuDpth: 2, menuNmDisplay: '업무 알림 설정',           sortPath: '006-007', children: [] },
  { menuCd: 'A060701--', upMenuCd: 'A0607----', lblCd: 'lbl.menu.system.alarm.setting',     menuSeq: 0, menuDpth: 3, menuNmDisplay: '업무 알림 설정',           menuUrlAddr: '/admin/system/alarm/setting', sortPath: '006-007-001', children: [] },
];
