// Every leaf menu of the admin menu tree (GET /api/common/menus/my, X-Lang: en) and the screen it opens.
// `path` = English labels from the rail group down to the leaf; `component` = registry key
// (MENU_URL_ADDR or the entry in src/config/menu-component-fallback.ts).
// `menu-manifest.spec.ts` fails when the server tree no longer matches this list — update it then.

export type ScreenKind =
  /** Normal business screen. */
  | 'screen'
  /** Menu without a screen yet — renders the ScreenPending notice. */
  | 'pending'
  /** Show in Menu = No: in the menu tree for permissions, not drawn in the rail / LNB. */
  | 'hidden';

export interface ScreenEntry {
  code: string;
  path: string[];
  component: string;
  kind: ScreenKind;
}

const s = (code: string, path: string, component: string, kind: ScreenKind = 'screen'): ScreenEntry => ({
  code,
  path: path.split(' > '),
  component,
  kind,
});

export const SCREENS: ScreenEntry[] = [
  // Home
  s('A01000000', 'Admin Home', 'Dashboard', 'hidden'), // the fixed Dashboard tab is the home screen
  // Member Management
  s('A03010000', 'Member Management > Member Management', 'MemberList'),
  // NPL Information Management
  s('A04010000', 'NPL Information Management > CIC Data Management', 'ScreenPending', 'pending'),
  s('A04020000', 'NPL Information Management > NPL Management', 'NplManagement'),
  s('A04030000', 'NPL Information Management > Collateral Asset Management', 'CollateralAssetManagement'),
  s('A04040000', 'NPL Information Management > Debtor Management', 'DebtorManagement'),
  s('A04050000', 'NPL Information Management > NPL LOT Change Management', 'NplLotManagement'),
  // Transaction Management
  s('A05010100', 'Transaction Management > Application Management > Purchase Brokerage Application', 'PurchaseApplicationManagement'),
  s('A05010200', 'Transaction Management > Application Management > Sale Brokerage Application', 'SaleApplicationManagement'),
  s('A05010300', 'Transaction Management > Application Management > Consulting Application', 'ConsultingApplicationManagement'),
  s('A05020100', 'Transaction Management > Contract Management > Purchase Brokerage Contract Management', 'PurchaseContractManagement'),
  s('A05020200', 'Transaction Management > Contract Management > Sale Brokerage Contract Management', 'SaleContractManagement'),
  s('A05020300', 'Transaction Management > Contract Management > Consulting Contract Management', 'ConsultingContractManagement'),
  // Online Auction Management
  s('A06010000', 'Online Auction Management > Online Auction Notice Management', 'AuctionManagement'),
  s('A06020000', 'Online Auction Management > Bidder Management', 'BidderManagement'),
  s('A06030000', 'Online Auction Management > Live Online Auction Management', 'LiveAuctionManagement'),
  // Content Management
  s('A07010000', 'Content Management > Notice Management', 'NoticeManagement'),
  s('A07020100', 'Content Management > VAMC News Management > News Management', 'NewsManagement'),
  s('A07020200', 'Content Management > VAMC News Management > Media Management', 'MediaManagement'),
  s('A07020300', 'Content Management > VAMC News Management > Resources Management', 'ResourcesManagement'),
  s('A07020400', 'Content Management > VAMC News Management > Disclosure Management', 'DisclosureManagement'),
  s('A07030100', 'Content Management > NPL Announcement Management > Appraisal Notice Management', 'AppraisalNoticeManagement'),
  s('A07030200', 'Content Management > NPL Announcement Management > Sale Brokerage Notice Management', 'SaleNoticeManagement'),
  s('A07030300', 'Content Management > NPL Announcement Management > Online Auction Notice Management', 'AuctionNoticeManagement'),
  s('A07040000', 'Content Management > Direct Inquiry Management', 'InquiryManagement'),
  s('A07050000', 'Content Management > FAQ Management', 'FaqManagement'),
  s('A07060100', 'Content Management > Site Display Management > Banner Management', 'BannerManagement'),
  s('A07060200', 'Content Management > Site Display Management > Logo Management', 'LogoManagement'),
  s('A07060300', 'Content Management > Site Display Management > Slogan Management', 'SloganManagement'),
  s('A07070000', 'Content Management > Legal Documents Management', 'LegalDocumentsManagement'),
  s('A07080000', 'Content Management > Careers Management', 'CareersManagement'),
  s('A07100100', 'Content Management > About VAMC Management > Organization Chart Management', 'OrganizationChartManagement'),
  s('A07100200', 'Content Management > About VAMC Management > History Management', 'HistoryManagement'),
  s('A07100300', 'Content Management > About VAMC Management > Directions Management', 'DirectionsManagement'),
  s('A07100400', 'Content Management > About VAMC Management > Overview Management', 'OverviewManagement'),
  s('A07100500', 'Content Management > About VAMC Management > Leadership Management', 'LeadershipManagement'),
  s('A07100600', 'Content Management > About VAMC Management > Partners Management', 'PartnersManagement'),
  s('A07110000', 'Content Management > Service Guide Management', 'ServiceGuideManagement'),
  // Statistics
  s('A08010000', 'Statistics > User Statistics', 'ScreenPending', 'pending'),
  s('A08020000', 'Statistics > NPL Info Statistics', 'ScreenPending', 'pending'),
  s('A08030000', 'Statistics > Collateral Statistics', 'ScreenPending', 'pending'),
  s('A08040000', 'Statistics > Value Statistics', 'ScreenPending', 'pending'),
  // System Operation Management
  s('A09010100', 'System Operation Management > NPL Platform Management > Menu Settings', 'SYS020101SC'),
  s('A09010200', 'System Operation Management > NPL Platform Management > Form Management', 'SYS020102SC'),
  s('A09010300', 'System Operation Management > NPL Platform Management > Fee Management', 'SYS020103SC'),
  s('A09010400', 'System Operation Management > NPL Platform Management > Exchange Rate Management', 'ExchangeRateManagement'),
  s('A09010500', 'System Operation Management > NPL Platform Management > Web Menu Permission Management', 'SYS020104SC'),
  s('A09010700', 'System Operation Management > NPL Platform Management > Terms Management', 'TermsManagement'),
  s('A09020100', 'System Operation Management > Admin Management > Admin Menu Settings', 'SYS030101SC'),
  s('A09020200', 'System Operation Management > Admin Management > User Management', 'SYS030102SC'),
  s('A09020300', 'System Operation Management > Admin Management > User Group Management', 'SYS030103SC'),
  s('A09020400', 'System Operation Management > Admin Management > Menu Permission Management', 'SYS030104SC'),
  s('A09030100', 'System Operation Management > Code Management > Common Code Management', 'CommonCodeManagement'),
  s('A09030200', 'System Operation Management > Code Management > Region Code Management', 'RegionCodeManagement'),
  s('A09030300', 'System Operation Management > Code Management > Finance Code Management', 'FinanceCodeManagement'),
  s('A09040100', 'System Operation Management > System Management > Program Management', 'ProgramManagement'),
  s('A09040200', 'System Operation Management > System Management > Screen Management', 'ScreenManagement'),
  s('A09040300', 'System Operation Management > System Management > i18n Label Management', 'SYS050301SC'),
  s('A09040400', 'System Operation Management > System Management > Batch Management', 'BatchManagement'),
  s('A09040500', 'System Operation Management > System Management > Approval Process Management', 'ApprovalProcessManagement'),
  s('A09050100', 'System Operation Management > Notification Management > Notification Message Management', 'NotificationMessageManagement'),
  s('A09050200', 'System Operation Management > Notification Management > Notification Send History', 'NotificationHistoryManagement'),
  s('A09050300', 'System Operation Management > Notification Management > Zalo Users', 'ZaloUserManagement'),
  s('A09050400', 'System Operation Management > Notification Management > Zalo Templates', 'ZaloTemplateManagement'),
  s('A09050500', 'System Operation Management > Notification Management > Zalo Sending Limits', 'ZaloLimitManagement'),
  s('A09050600', 'System Operation Management > Notification Management > Zalo OA Connection', 'ZaloConnection'),
  // Approval Management
  s('A10000000', 'Approval Management', 'ApprovalManagement'),
];
