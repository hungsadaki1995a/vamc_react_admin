// Every leaf menu of the admin menu tree (GET /api/common/menus/my, X-Lang: en) and the screen it opens.
// `path` = English labels from the rail group down to the leaf; `component` = registry key
// (MENU_URL_ADDR or the entry in src/config/menu-component-fallback.ts).
// `menu-manifest.spec.ts` fails when the server tree no longer matches this list — update it then.

export type ScreenKind =
  /** Normal business screen. */
  | 'screen'
  /** Menu without a screen yet — renders the ScreenPending notice. */
  | 'pending';

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
  // Transaction Management
  s('A02010100', 'Transaction Management > Application Management > Purchase Brokerage Application', 'PurchaseApplicationManagement'),
  s('A02010200', 'Transaction Management > Application Management > Sale Brokerage Application', 'SaleApplicationManagement'),
  s('A02010300', 'Transaction Management > Application Management > Consulting Application', 'ConsultingApplicationManagement'),
  s('A02020100', 'Transaction Management > Contract Management > Purchase Brokerage Contract Management', 'PurchaseContractManagement'),
  s('A02020200', 'Transaction Management > Contract Management > Sale Brokerage Contract Management', 'SaleContractManagement'),
  s('A02020300', 'Transaction Management > Contract Management > Consulting Contract Management', 'ConsultingContractManagement'),
  // Member Management
  s('A01010000', 'Member Management > Registration Management', 'MemberList'),
  s('A01020000', 'Member Management > Active Member Management', 'MemberList'),
  s('A01030000', 'Member Management > Deleted/Dormant Member Management', 'MemberList'),
  // NPL Information Management
  s('A03020000', 'NPL Information Management > CIC Data Management', 'ScreenPending', 'pending'),
  s('A03010100', 'NPL Information Management > NPL Registration Info Management > NPL Management', 'NplManagement'),
  s('A03010200', 'NPL Information Management > NPL Registration Info Management > Collateral Asset Management', 'CollateralAssetManagement'),
  s('A03010300', 'NPL Information Management > NPL Registration Info Management > Debtor Management', 'DebtorManagement'),
  s('A03010400', 'NPL Information Management > NPL Registration Info Management > NPL LOT Change Management', 'NplLotManagement'),
  s('A07010000', 'NPL Information Management > Online Auction Management > Online Auction Notice Management', 'AuctionManagement'),
  s('A07020000', 'NPL Information Management > Online Auction Management > Bidder Management', 'BidderManagement'),
  s('A07030000', 'NPL Information Management > Online Auction Management > Live Online Auction Management', 'LiveAuctionManagement'),
  // Content Management
  s('A04010000', 'Content Management > Notice Management', 'NoticeManagement'),
  s('A04020100', 'Content Management > VAMC News Management > News Management', 'NewsManagement'),
  s('A04020200', 'Content Management > VAMC News Management > Media Management', 'MediaManagement'),
  s('A04020300', 'Content Management > VAMC News Management > Resources Management', 'ResourcesManagement'),
  s('A04020400', 'Content Management > VAMC News Management > Disclosure Management', 'DisclosureManagement'),
  s('A04030100', 'Content Management > NPL Announcement Management > Appraisal Notice Management', 'AppraisalNoticeManagement'),
  s('A04030200', 'Content Management > NPL Announcement Management > Sale Brokerage Notice Management', 'SaleNoticeManagement'),
  s('A04030300', 'Content Management > NPL Announcement Management > Online Auction Notice Management', 'AuctionNoticeManagement'),
  s('A04040000', 'Content Management > Direct Inquiry Management', 'InquiryManagement'),
  s('A04050000', 'Content Management > FAQ Management', 'FaqManagement'),
  s('A04060000', 'Content Management > Site Display Management > Banner Management', 'BannerManagement'),
  s('A04110200', 'Content Management > Site Display Management > Logo Management', 'LogoManagement'),
  s('A04110300', 'Content Management > Site Display Management > Slogan Management', 'SloganManagement'),
  s('A04070000', 'Content Management > Legal Documents Management', 'LegalDocumentsManagement'),
  s('A04090000', 'Content Management > Careers Management', 'CareersManagement'),
  s('A04120000', 'Content Management > Auction Guide Management', 'AuctionGuideManagement'),
  s('A04080100', 'Content Management > VAMC Introduction Management > Leadership Management', 'LeadershipManagement'),
  s('A04080200', 'Content Management > VAMC Introduction Management > Partners Management', 'PartnersManagement'),
  s('A04100000', 'Content Management > Service Guide Management', 'ServiceGuideManagement'),
  // Statistics
  s('A05010000', 'Statistics > User Statistics', 'ScreenPending', 'pending'),
  s('A05020000', 'Statistics > NPL Info Statistics', 'ScreenPending', 'pending'),
  s('A05030000', 'Statistics > Collateral Statistics', 'ScreenPending', 'pending'),
  s('A05040000', 'Statistics > Value Statistics', 'ScreenPending', 'pending'),
  // System Operation Management
  s('A06010100', 'System Operation Management > NPL Platform Management > Menu Settings', 'SYS020101SC'),
  s('A06010200', 'System Operation Management > NPL Platform Management > Form Management', 'SYS020102SC'),
  s('A06010300', 'System Operation Management > NPL Platform Management > Fee Management', 'SYS020103SC'),
  s('A06010500', 'System Operation Management > NPL Platform Management > Exchange Rate Management', 'ExchangeRateManagement'),
  s('A06010400', 'System Operation Management > NPL Platform Management > Web Menu Permission Management', 'SYS020104SC'),
  s('A06010600', 'System Operation Management > NPL Platform Management > Prohibited Words Management', 'ScreenPending', 'pending'),
  s('A06010700', 'System Operation Management > NPL Platform Management > Terms Management', 'TermsManagement'),
  s('A06020100', 'System Operation Management > Admin Management > Admin Menu Settings', 'SYS030101SC'),
  s('A06020200', 'System Operation Management > Admin Management > User Management', 'SYS030102SC'),
  s('A06020300', 'System Operation Management > Admin Management > User Group Management', 'SYS030103SC'),
  s('A06020400', 'System Operation Management > Admin Management > Menu Permission Management', 'SYS030104SC'),
  s('A06030100', 'System Operation Management > Code Management > Common Code Management', 'CommonCodeManagement'),
  s('A06030200', 'System Operation Management > Code Management > Region Code Management', 'RegionCodeManagement'),
  s('A06030300', 'System Operation Management > Code Management > Finance Code Management', 'FinanceCodeManagement'),
  s('A06040100', 'System Operation Management > System Management > Program Management', 'ProgramManagement'),
  s('A06040200', 'System Operation Management > System Management > Screen Management', 'ScreenManagement'),
  s('A06040300', 'System Operation Management > System Management > i18n Label Management', 'SYS050301SC'),
  s('A06040400', 'System Operation Management > System Management > Batch Management', 'BatchManagement'),
  s('A06040500', 'System Operation Management > System Management > Approval Process Management', 'ApprovalProcessManagement'),
  s('A06060100', 'System Operation Management > Notification Management > Notification Message Management', 'NotificationMessageManagement'),
  s('A06060200', 'System Operation Management > Notification Management > Notification Send History', 'NotificationHistoryManagement'),
];
