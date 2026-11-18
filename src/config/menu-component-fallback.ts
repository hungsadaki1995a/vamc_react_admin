// Screen fallback for server menus whose MENU_MNG.MENU_URL_ADDR is still empty.
//
// These screens exist in the frontend but their menu rows
// carry no component path yet, so the menu would render and do nothing on click.
// The DB value always wins — drop an entry once MENU_MNG is updated.
const MENU_COMPONENT_FALLBACK: Record<string, string> = {
  // Member Management
  A01010000: 'MemberList',
  A01020000: 'MemberList',
  A01030000: 'MemberList',
  // Trade Management
  A02010100: 'PurchaseApplicationManagement',
  A02010200: 'SaleApplicationManagement',
  A02010300: 'ConsultingApplicationManagement',
  A02020100: 'PurchaseContractManagement',
  A02020200: 'SaleContractManagement',
  A02020300: 'ConsultingContractManagement',
  // NPL Info Management
  A03010100: 'NplManagement',
  A03010200: 'CollateralAssetManagement',
  A03010300: 'DebtorManagement',
  A03010400: 'NplLotManagement',
  // Content Management
  A04010000: 'NoticeManagement',
  A04020100: 'NewsManagement',
  A04020200: 'MediaManagement',
  A04020300: 'ResourcesManagement',
  A04020400: 'DisclosureManagement',
  A04030100: 'AppraisalNoticeManagement',
  A04030200: 'SaleNoticeManagement',
  A04030300: 'AuctionNoticeManagement',
  A04040000: 'InquiryManagement', // Direct (1:1) Inquiry Management
  A04050000: 'FaqManagement',
  A04060000: 'BannerManagement',
  A04070000: 'LegalDocumentsManagement',
  A04080100: 'LeadershipManagement',
  A04080200: 'PartnersManagement',
  A04090000: 'CareersManagement',
  A04100000: 'ServiceGuideManagement',
  A04110200: 'LogoManagement',
  A04110300: 'SloganManagement',
  A04120000: 'AuctionGuideManagement',
  // System Operation Management
  A06010100: 'SYS020101SC', // Platform Menu Management
  A06010200: 'SYS020102SC', // Form Management
  A06010300: 'SYS020103SC', // Fee Management
  A06010400: 'SYS020104SC', // Web Menu Permission Management
  A06010500: 'ExchangeRateManagement',
  A06010700: 'TermsManagement',
  A06020100: 'SYS030101SC', // Admin Menu Management
  A06020200: 'SYS030102SC', // User Management
  A06020300: 'SYS030103SC', // User Group Management
  A06020400: 'SYS030104SC', // Admin Menu Permission Management
  A06030100: 'CommonCodeManagement',
  A06030200: 'RegionCodeManagement',
  A06030300: 'FinanceCodeManagement',
  A06040100: 'ProgramManagement',
  A06040200: 'ScreenManagement',
  A06040400: 'BatchManagement',
  A06060100: 'NotificationMessageManagement',
  A06060200: 'NotificationHistoryManagement',
  // Auction Management
  A07010000: 'AuctionManagement',
  A07020000: 'BidderManagement',
  A07030000: 'LiveAuctionManagement',
};

/** Component key (screen ID) a server menu opens — DB path first, then the fallback. */
export function resolveMenuComponent(menuCd?: string, menuUrlAddr?: string | null): string | undefined {
  return menuUrlAddr || (menuCd ? MENU_COMPONENT_FALLBACK[menuCd] : undefined) || undefined;
}
