// Screen fallback for server menus whose MENU_MNG.MENU_URL_ADDR is still empty.
// 'ScreenPending' is an empty state for menus that have no screen yet; without an entry a menu does nothing on click.
//
// These screens exist in the frontend but their menu rows
// carry no component path yet, so the menu would render and do nothing on click.
// The DB value always wins — drop an entry once MENU_MNG is updated.
const MENU_COMPONENT_FALLBACK: Record<string, string> = {
  // Home (IA v1.03)
  A01000000: 'Dashboard',
  // Approval Management (IA v1.04, VPA10000001): inbox of the signed-in employee (no screen design, Q-U1)
  A10000000: 'ApprovalManagement',
  // Member Management
  A03010000: 'MemberList',
  // Trade Management
  A05010100: 'PurchaseApplicationManagement',
  A05010200: 'SaleApplicationManagement',
  A05010300: 'ConsultingApplicationManagement',
  A05020100: 'PurchaseContractManagement',
  A05020200: 'SaleContractManagement',
  A05020300: 'ConsultingContractManagement',
  // NPL Info Management
  A04020000: 'NplManagement',
  A04030000: 'CollateralAssetManagement',
  A04040000: 'DebtorManagement',
  A04050000: 'NplLotManagement',
  A04010000: 'ScreenPending', // CIC Data Management: no backend API yet
  // Statistics: no screen design and no backend API yet
  A08010000: 'ScreenPending',
  A08020000: 'ScreenPending',
  A08030000: 'ScreenPending',
  A08040000: 'ScreenPending',
  // Content Management
  A07010000: 'NoticeManagement',
  A07020100: 'NewsManagement',
  A07020200: 'MediaManagement',
  A07020300: 'ResourcesManagement',
  A07020400: 'DisclosureManagement',
  A07030100: 'AppraisalNoticeManagement',
  A07030200: 'SaleNoticeManagement',
  A07030300: 'AuctionNoticeManagement',
  A07040000: 'InquiryManagement', // Direct (1:1) Inquiry Management
  A07050000: 'FaqManagement',
  A07060100: 'BannerManagement',
  A07070000: 'LegalDocumentsManagement',
  A07100100: 'OrganizationChartManagement', // Organization Chart Management (IA v1.03)
  A07100200: 'HistoryManagement', // History Management (IA v1.03)
  A07100300: 'DirectionsManagement', // Directions Management (IA v1.03)
  A07100400: 'OverviewManagement', // Overview Management (IA v1.03)
  A07100500: 'LeadershipManagement',
  A07100600: 'PartnersManagement',
  A07080000: 'CareersManagement',
  A07110000: 'ServiceGuideManagement',
  A07060200: 'LogoManagement',
  A07060300: 'SloganManagement',
  A07090000: 'AuctionGuideManagement',
  // System Operation Management
  A09010100: 'SYS020101SC', // Platform Menu Management
  A09010200: 'SYS020102SC', // Form Management
  A09010300: 'SYS020103SC', // Fee Management
  A09010500: 'SYS020104SC', // Web Menu Permission Management
  A09010400: 'ExchangeRateManagement',
  A09010600: 'ScreenPending', // Prohibited Words Management: no backend API yet
  A09010700: 'TermsManagement',
  A09020100: 'SYS030101SC', // Admin Menu Management
  A09020200: 'SYS030102SC', // User Management
  A09020300: 'SYS030103SC', // User Group Management
  A09020400: 'SYS030104SC', // Admin Menu Permission Management
  A09030100: 'CommonCodeManagement',
  A09030200: 'RegionCodeManagement',
  A09030300: 'FinanceCodeManagement',
  A09040100: 'ProgramManagement',
  A09040200: 'ScreenManagement',
  A09040300: 'LabelManagement', // i18n Label Management (DB path SYS050301SC wins when set)
  A09040400: 'BatchManagement',
  A09040500: 'ApprovalProcessManagement',
  A09050100: 'NotificationMessageManagement',
  A09050200: 'NotificationHistoryManagement',
  A09050300: 'ZaloUserManagement',
  A09050400: 'ZaloTemplateManagement',
  A09050500: 'ZaloLimitManagement',
  A09050600: 'ZaloConnection',
  // Auction Management
  A06010000: 'AuctionManagement',
  A06020000: 'BidderManagement',
  A06030000: 'LiveAuctionManagement',
};

/** Component key (screen ID) a server menu opens — DB path first, then the fallback. */
export function resolveMenuComponent(menuCd?: string, menuUrlAddr?: string | null): string | undefined {
  return menuUrlAddr || (menuCd ? MENU_COMPONENT_FALLBACK[menuCd] : undefined) || undefined;
}
