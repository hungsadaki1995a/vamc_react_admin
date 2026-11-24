import type { BoardPath, FileBoard } from '@/api/contents/post-api';

// One entry per Content Management menu that is backed by a BBS board.
// The list screen (PostBoard.tsx) and the popup (PostModal.tsx) are driven by it; columns, filters and
// popup rows follow the v0.8 design of each menu (VPA0701 – VPA0708).

export type CategoryOption = {
  value: string;
  label: string;
};

/** How a menu relates to the board's category (PST_KND_CD). */
export type CategoryMode =
  /** Pick one code of a COM_CD group (filter + popup select). */
  | { kind: 'codes'; groupCd: string; label: string }
  /** Pick one of a fixed list (filter + popup select). */
  | { kind: 'options'; options: CategoryOption[]; label: string }
  /** The menu shows exactly one category. */
  | { kind: 'fixed'; value: string }
  /** The board has a single implicit category (careers). */
  | { kind: 'none' };

export type BoardConfig = {
  /** Unique key — also the react-query key. */
  id: string;
  board: BoardPath;
  fileBoard: FileBoard;
  /** Page title; also the last breadcrumb item. */
  title: string;
  /** Singular noun of the popup title: "Register <itemName>" / "Edit <itemName>". */
  itemName: string;
  /** Breadcrumb items between "Content Management" and the title. */
  parents?: readonly string[];
  category: CategoryMode;
  /**
   * How posting status is saved on edit:
   *  - endpoint: PATCH /{pstNo}/status (notices, news, npl-announcements)
   *  - body:     `published` travels in the PUT body (careers, legal, about)
   *  - bulk:     PATCH /publish for the single post (service guides)
   */
  statusMode: 'endpoint' | 'body' | 'bulk';
  /** Top display (pinned + order 1–5). */
  pin?: boolean;
  /** The board stores a pin but the design shows none: hidden, saved values are kept. */
  hidePin?: boolean;
  /** Thumbnail image (news). */
  thumbnail?: boolean;
  /** Main image (about: portrait / logo). */
  image?: boolean;
  summary?: boolean;
  /** The board stores a summary but the design shows none: hidden, saved values are kept. */
  hideSummary?: boolean;
  /** No "Provide English" / Title (EN) / Content (EN) rows (legal documents). */
  noEnglish?: boolean;
  /** Free tag column / field with this label (document number, section key, partner type…). */
  tag?: { label: string; requestKey: 'docNumber' | 'tag' | 'sectionKey'; createOnly?: boolean; required?: boolean };
  /** Person fields: name, email, phone (about). */
  person?: boolean;
  /** Legal document fields, filters and columns. */
  legal?: boolean;
  /** Request key that carries the category on create/update (default `category`). */
  categoryKey?: 'category' | 'section' | 'page' | 'docType';
  contentRequired?: boolean;
  /** GET /excel is available. */
  excel?: boolean;
};

const NEWS = { board: 'news', fileBoard: 'NEWS', parents: ['VAMC News Management'] } as const;
const NPL = {
  board: 'npl-announcements',
  fileBoard: 'NPL_ANNOUNCEMENT',
  parents: ['NPL Announcement Management'],
} as const;
const ABOUT = { board: 'about', fileBoard: 'ABOUT', parents: ['VAMC Introduction Management'] } as const;

// News boards: no pin and no summary in the design (VPA070201P01 – VPA070204P01); Disclosure has no thumbnail.
const newsBoard = (id: string, title: string, itemName: string, category: string, thumbnail = true): BoardConfig => ({
  ...NEWS,
  id,
  title,
  itemName,
  category: { kind: 'fixed', value: category },
  statusMode: 'endpoint',
  pin: true,
  hidePin: true,
  thumbnail,
  summary: true,
  hideSummary: true,
  contentRequired: true,
});

const nplBoard = (id: string, title: string, itemName: string, category: string): BoardConfig => ({
  ...NPL,
  id,
  title,
  itemName,
  category: { kind: 'fixed', value: category },
  statusMode: 'endpoint',
  pin: true,
  summary: true,
  hideSummary: true,
  tag: { label: 'Document No.', requestKey: 'docNumber', required: true },
  contentRequired: true,
});

export const BOARDS = {
  /** A07010000 — VPA07010001 / VPA070100P01 */
  notice: {
    id: 'notice',
    board: 'notices',
    fileBoard: 'NOTICE',
    title: 'Notice Management',
    itemName: 'Notice',
    category: { kind: 'codes', groupCd: 'NTC_MTTR_SE_CD', label: 'Notice Type' },
    statusMode: 'endpoint',
    pin: true,
    contentRequired: true,
  },
  /** A07020100 / 0200 / 0300 / 0400 — VPA07020101–2601 + Disclosure */
  news: newsBoard('news', 'News Management', 'News', 'NWS'),
  media: newsBoard('media', 'Media Management', 'Media', 'MED'),
  resources: newsBoard('resources', 'Resources Management', 'Resource', 'RSC'),
  disclosure: newsBoard('disclosure', 'Disclosure Management', 'Disclosure', 'DSC', false),
  /** A07030100 / 0200 / 0300 — VPA07030101–2901 */
  appraisalNotice: nplBoard('appraisal-notice', 'Appraisal Notice Management', 'Appraisal Notice', 'APPR'),
  saleNotice: nplBoard('sale-notice', 'Sale Brokerage Notice Management', 'Sale Brokerage Notice', 'SALE'),
  auctionNotice: nplBoard('auction-notice', 'Online Auction Notice Management', 'Online Auction Notice', 'AUCT'),
  /** A07070000 — VPA07070001 / VPA070700P01 */
  legal: {
    id: 'legal',
    board: 'legal-documents',
    fileBoard: 'LEGAL',
    title: 'Legal Documents Management',
    itemName: 'Legal Document',
    category: { kind: 'none' },
    categoryKey: 'docType',
    statusMode: 'body',
    legal: true,
    hideSummary: true,
    noEnglish: true,
    excel: true,
  },
  /** A07080000 — VPA07080001 / VPA070800P01 */
  careers: {
    id: 'careers',
    board: 'careers',
    fileBoard: 'CAREER',
    title: 'Careers Management',
    itemName: 'Career Post',
    category: { kind: 'none' },
    statusMode: 'body',
    pin: true,
    contentRequired: true,
    excel: true,
  },
  /** A07100500 — leadership sections of the About board */
  leadership: {
    ...ABOUT,
    id: 'leadership',
    title: 'Leadership Management',
    itemName: 'Leader',
    category: {
      kind: 'options',
      label: 'Section',
      options: [
        { value: 'BEXB', label: "Members' Council" },
        { value: 'BDIR', label: 'Board of Directors' },
        { value: 'BSPV', label: 'Supervisory Board' },
      ],
    },
    categoryKey: 'section',
    statusMode: 'body',
    image: true,
    summary: true,
    person: true,
    tag: { label: 'Tag', requestKey: 'tag' },
  },
  /** A07100600 — partner section of the About board */
  partners: {
    ...ABOUT,
    id: 'partners',
    title: 'Partners Management',
    itemName: 'Partner',
    category: { kind: 'fixed', value: 'PRTN' },
    categoryKey: 'section',
    statusMode: 'body',
    image: true,
    tag: { label: 'Partner Type', requestKey: 'tag' },
  },
  /** A07110000 */
  serviceGuide: {
    id: 'service-guide',
    board: 'service-guides',
    fileBoard: 'SERVICE_GUIDE',
    title: 'Service Guide Management',
    itemName: 'Service Guide Section',
    category: {
      kind: 'options',
      label: 'Page',
      options: [
        { value: 'TRD', label: 'Trading (TRD)' },
        { value: 'BUY', label: 'Purchase (BUY)' },
        { value: 'SELL', label: 'Sale (SELL)' },
        { value: 'CNSL', label: 'Consulting (CNSL)' },
        { value: 'FEE', label: 'Fee (FEE)' },
      ],
    },
    categoryKey: 'page',
    statusMode: 'bulk',
    summary: true,
    tag: { label: 'Section Key', requestKey: 'sectionKey', createOnly: true, required: true },
    contentRequired: true,
  },
  /** A07090000 — the AUC page of the service guide board */
  auctionGuide: {
    id: 'auction-guide',
    board: 'service-guides',
    fileBoard: 'SERVICE_GUIDE',
    title: 'Auction Guide Management',
    itemName: 'Auction Guide Section',
    category: { kind: 'fixed', value: 'AUC' },
    categoryKey: 'page',
    statusMode: 'bulk',
    summary: true,
    tag: { label: 'Section Key', requestKey: 'sectionKey', createOnly: true, required: true },
    contentRequired: true,
  },
} satisfies Record<string, BoardConfig>;
