import type { BoardPath, FileBoard } from '@/api/contents/post-api';

// One entry per Content Management menu that is backed by a BBS board.
// The list screen (post-board.tsx) and the popup (post-modal.tsx) are driven by it.

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
  /** Thumbnail image (news). */
  thumbnail?: boolean;
  /** Main image (about: portrait / logo). */
  image?: boolean;
  summary?: boolean;
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

const newsBoard = (id: string, title: string, category: string): BoardConfig => ({
  ...NEWS,
  id,
  title,
  category: { kind: 'fixed', value: category },
  statusMode: 'endpoint',
  pin: true,
  thumbnail: true,
  summary: true,
  contentRequired: true,
});

const nplBoard = (id: string, title: string, category: string): BoardConfig => ({
  ...NPL,
  id,
  title,
  category: { kind: 'fixed', value: category },
  statusMode: 'endpoint',
  pin: true,
  summary: true,
  tag: { label: 'Document Number', requestKey: 'docNumber' },
  contentRequired: true,
});

export const BOARDS = {
  /** A04010000 — VPA002301 / VPA0023P01 */
  notice: {
    id: 'notice',
    board: 'notices',
    fileBoard: 'NOTICE',
    title: 'Notices Management',
    category: { kind: 'codes', groupCd: 'NTC_MTTR_SE_CD', label: 'Notice Type' },
    statusMode: 'endpoint',
    pin: true,
    contentRequired: true,
  },
  /** A04020100 / 0200 / 0300 / 0400 — VPA002401–2601 + Disclosure */
  news: newsBoard('news', 'News Management', 'NWS'),
  media: newsBoard('media', 'Media Management', 'MED'),
  resources: newsBoard('resources', 'Resources Management', 'RSC'),
  disclosure: newsBoard('disclosure', 'Disclosure Management', 'DSC'),
  /** A04030100 / 0200 / 0300 — VPA002701–2901 */
  appraisalNotice: nplBoard('appraisal-notice', 'Appraisal Notice Management', 'APPR'),
  saleNotice: nplBoard('sale-notice', 'Sale Brokerage Notice Management', 'SALE'),
  auctionNotice: nplBoard('auction-notice', 'Online Auction Notice Management', 'AUCT'),
  /** A04070000 — VPA003301 / VPA0033P01 */
  legal: {
    id: 'legal',
    board: 'legal-documents',
    fileBoard: 'LEGAL',
    title: 'Legal Documents Management',
    category: { kind: 'none' },
    categoryKey: 'docType',
    statusMode: 'body',
    legal: true,
    excel: true,
  },
  /** A04090000 — VPA003401 / VPA0034P01 */
  careers: {
    id: 'careers',
    board: 'careers',
    fileBoard: 'CAREER',
    title: 'Careers Management',
    category: { kind: 'none' },
    statusMode: 'body',
    pin: true,
    contentRequired: true,
    excel: true,
  },
  /** A04080100 — leadership sections of the About board */
  leadership: {
    ...ABOUT,
    id: 'leadership',
    title: 'Leadership Management',
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
  /** A04080200 — partner section of the About board */
  partners: {
    ...ABOUT,
    id: 'partners',
    title: 'Partners Management',
    category: { kind: 'fixed', value: 'PRTN' },
    categoryKey: 'section',
    statusMode: 'body',
    image: true,
    tag: { label: 'Partner Type', requestKey: 'tag' },
  },
  /** A04100000 */
  serviceGuide: {
    id: 'service-guide',
    board: 'service-guides',
    fileBoard: 'SERVICE_GUIDE',
    title: 'Service Guide Management',
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
  /** A04120000 — the AUC page of the service guide board */
  auctionGuide: {
    id: 'auction-guide',
    board: 'service-guides',
    fileBoard: 'SERVICE_GUIDE',
    title: 'Auction Guide Management',
    category: { kind: 'fixed', value: 'AUC' },
    categoryKey: 'page',
    statusMode: 'bulk',
    summary: true,
    tag: { label: 'Section Key', requestKey: 'sectionKey', createOnly: true, required: true },
    contentRequired: true,
  },
} satisfies Record<string, BoardConfig>;
