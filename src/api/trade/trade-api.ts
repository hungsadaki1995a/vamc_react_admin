import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';
import { RECEIPT_OFFICER_STEP, getApprovalCandidates } from '@/api/common/approval-api';
import type { ApprovalRequestBody, ApprovalStep } from '@/api/common/approval-api';

// Trade API — AbstractTradeApplicationController (/api/v1/service-applications/{sale|purchase|consulting}) and
// AbstractTradeContractController (/api/v1/{sale-brokerage|purchase-brokerage|consulting}-contracts).
// Screens VPA05010101/05010201/05010301 (applications), VPA05020101/05020201/05020301 (contracts).

export type TradeAppKind = 'purchase' | 'sale' | 'consulting';
export type TradeContractKind = 'purchase-brokerage-contracts' | 'sale-brokerage-contracts' | 'consulting-contracts';
export type YesNo = 'Y' | 'N';

/** SRVC_PRCS_STTS_CD. */
export type TradeApplicationStatus = 'RCPT' | 'PRCS' | 'DCIN' | 'DCOK' | 'CMPL' | 'CNCL';
export type TradeApprovalStage = 'NOT_RECEIVED' | 'PROCESSING' | 'IN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
/** What the signed-in employee may do on an application (computed by the server). */
export type TradeApplicationAction = 'RECEIVE' | 'CHECK_DOCUMENTS' | 'REQUEST_APPROVAL' | 'DECIDE' | 'VIEW';

/** Approval process prefix per kind: `PROC_<prefix>_RCPT`, `_CTRT`, `_SIGN`, `_ANX`, `_END`, `_END_SIGN`. */
export const TRADE_PROCESS_PREFIX: Record<TradeAppKind, string> = {
  sale: 'PROC_DSPSL_MDT',
  purchase: 'PROC_PUR_MDT',
  consulting: 'PROC_CNSLT',
};

export type TradeProcessStage = 'RCPT' | 'CTRT' | 'SIGN' | 'ANX' | 'END' | 'END_SIGN';

/** Approval process code of a kind and stage, e.g. (`sale`, `RCPT`) → `PROC_DSPSL_MDT_RCPT`. */
export const tradeProcessCode = (kind: TradeAppKind, stage: TradeProcessStage) => `${TRADE_PROCESS_PREFIX[kind]}_${stage}`;

export const TRADE_CONTRACT_KIND: Record<TradeAppKind, TradeContractKind> = {
  sale: 'sale-brokerage-contracts',
  purchase: 'purchase-brokerage-contracts',
  consulting: 'consulting-contracts',
};

/** Row of the application list (TradeApplicationListItemResponse). */
export interface TradeApplicationListItem {
  /** Key (UUID); never shown when `srvcAplyNo` exists. */
  srvcAplyId: string;
  /** Readable number (YCMM / YCMB / YCTV + year + 6 digits) shown on screens. */
  srvcAplyNo?: string;
  /** Readable number of the contract created on approval (HD…). */
  srvcCtrtNo?: string;
  srvcPrcsSttsCd?: TradeApplicationStatus;
  srvcPrcsSttsNm?: string;
  approvalStage?: TradeApprovalStage;
  /** ddMMyyyy. */
  srvcAplyDmy?: string;
  /** WEB, MANL. */
  aplyPathCd?: string;
  /** MDT, BASE_ANX (sale). */
  ctrtKndCd?: string;
  /** Consulting category (consulting). */
  cnsltDmndSeCd?: string;
  mbrNo?: string;
  mbrNm?: string;
  crdtrNm?: string;
  bndLotYn?: YesNo;
  /** Single NPL code. */
  bndCd?: string;
  bndLotId?: string;
  bndLotNm?: string;
  bndCnt?: number;
  crncCd?: string;
  totPrnBlnc?: number;
  totEvlAmt?: number;
  prpDsplPrc?: number;
  /** ISO date-time. */
  rcptDt?: string;
  rcptEmpNo?: string;
  rcptEmpNm?: string;
  tkcgEmpNo?: string;
  tkcgEmpNm?: string;
  approverEmpNo?: string;
  approverEmpNm?: string;
  srvcCtrtCd?: string;
  availableAction?: TradeApplicationAction;
  /** VAMC, BRKR. */
  astCtgrCd?: string;
  /**
   * Purchase applications not yet approved: a running purchase contract of another application on the same NPL /
   * LOT; receipt / approval request will be refused (409 TRD021).
   */
  activePurchaseCtrtCd?: string;
  activePurchaseCtrtNo?: string;
}

export interface TradeCollateral {
  cltrAstCd?: string;
  cltrAstNm?: string;
  cltrAstLclsfCd?: string;
  cltrCtrtNo?: string;
  /** ddMMyyyy. */
  ctrtDmy?: string;
  astChrcCn?: string;
  cltrAstSttsCd?: string;
  cnsltTrgtNplId?: string;
  bndCd?: string;
}

export interface TradeNpl {
  bndCd?: string;
  bndNm?: string;
  loanCtrtNo?: string;
  crdtrNm?: string;
  crncCd?: string;
  prnBlnc?: number;
  bndEvlAmt?: number;
  expsrYn?: YesNo;
  /** SA, UC, SD. */
  bndSttsCd?: string;
  /** Consulting target NPL id; null for a registered NPL. */
  cnsltTrgtNplId?: string;
  /** ddMMyyyy (consulting targets). */
  loanCtrtDmy?: string;
  collaterals?: TradeCollateral[];
}

export interface TradeFile {
  fileUnqId: string;
  fileSeq?: number;
  fileNm?: string;
  fileSz?: number;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface TradeApplicationHistory {
  srvcPrcsSttsCd?: string;
  srvcPrcsSttsNm?: string;
  prcsDt?: string;
  /** Employee or member number. */
  prcsBy?: string;
  /** Name of the employee / member of `prcsBy`. */
  prcsByNm?: string;
  prcsCn?: string;
}

/** Application detail (TradeApplicationDetailResponse). */
export interface TradeApplicationDetail {
  srvcAplyId: string;
  /** Readable number shown on screens. */
  srvcAplyNo?: string;
  srvcCtrtNo?: string;
  srvcPrcsSttsCd?: TradeApplicationStatus;
  srvcPrcsSttsNm?: string;
  approvalStage?: TradeApprovalStage;
  availableAction?: TradeApplicationAction;
  /**
   * Every action open to the signed-in employee (WP8): RECEIVE, CHANGE_OFFICER, UPDATE, CANCEL, ATTACH_SCAN,
   * CHECK_DOCUMENTS, REQUEST_APPROVAL, DECIDE. Older servers send only `availableAction`.
   */
  availableActions?: string[];
  /** Single NPL code (WP8). */
  bndCd?: string;
  rcptEmpNo?: string;
  rcptEmpNm?: string;
  /** ISO date-time. */
  rcptDt?: string;
  /** ddMMyyyy. */
  srvcAplyDmy?: string;
  aplyPathCd?: string;
  ctrtKndCd?: string;
  baseCtrtCd?: string;
  cnsltDmndSeCd?: string;
  cnsltDmndPrpsCn?: string;
  srcInqryPstNo?: string;
  mbrNo?: string;
  mbrNm?: string;
  /** P, F, O. */
  mbrTypeCd?: string;
  bndLotYn?: YesNo;
  bndLotId?: string;
  bndLotNm?: string;
  crncCd?: string;
  prpDsplPrc?: number;
  dcmntCmpltYn?: YesNo;
  msngDcmntCn?: string;
  dcmntChckDt?: string;
  /** Latest approval rejection reason. */
  rjctRsnCn?: string;
  cnclRsnCn?: string;
  tkcgEmpNo?: string;
  tkcgEmpNm?: string;
  /** Current approval session (GET /api/v1/approvals/{atrzHstryId}). */
  atrzHstryId?: string;
  nowStpNo?: number;
  atrzSttsCd?: string;
  srvcCtrtCd?: string;
  esntlDcmntScnFile?: string;
  /** Running purchase contract of the same subject (purchase). */
  activePurchaseCtrtCd?: string;
  activePurchaseCtrtNo?: string;
  npls?: TradeNpl[];
  cltrAstCd?: string;
  collaterals?: TradeCollateral[];
  files?: TradeFile[];
  steps?: ApprovalStep[];
  histories?: TradeApplicationHistory[];
  astCtgrCd?: string;
}

/** CTRT_STTS_CD: PREPR, DRFAPR, SGNWT, SGNCP, PROGS, ENDING, CMPTN, CNCLN. */
export type TradeContractStatus = string;

/** Row of the contract list (TradeContractListItemResponse); annexes carry `mstCtrtCd`. */
export interface TradeContractListItem {
  /** Key (UUID). */
  srvcCtrtCd: string;
  /** Readable number (HD…, annex HD…-PL01) shown on screens. */
  srvcCtrtNo?: string;
  srvcAplyNo?: string;
  mstCtrtNo?: string;
  /** CTRT_DSPSL_MDT, CTRT_DMDT_ANX, CTRT_DBAS_ANX, CTRT_PUR_MDT, CTRT_PMDT_ANX, CTRT_CNSLT. */
  ctrtSeCd?: string;
  mstCtrtCd?: string;
  /** EXTN, PRCE, POST, ETC. */
  anxPrpsCd?: string;
  ctrtSttsCd?: TradeContractStatus;
  ctrtSttsNm?: string;
  srvcAplyId?: string;
  mbrNo?: string;
  mbrNm?: string;
  bndCd?: string;
  bndLotId?: string;
  /** ddMMyyyy. */
  ctrtCnclsDmy?: string;
  /** ddMMyyyy. */
  ctrtEndDmy?: string;
  /** Days until the end date (negative when past). */
  remainingDays?: number;
  crncCd?: string;
  prpPrc?: number;
  rltrPrc?: number;
  /** LUMP, STAG, AFTR. */
  feeClclnMthCd?: string;
  feeAmt?: number;
  feeStage?: string;
  latestAtrzProcCd?: string;
  /** INPROGRESS, COMPLETED, REJECTED. */
  latestAtrzSttsCd?: string;
  tkcgEmpNo?: string;
  tkcgEmpNm?: string;
  bndLotYn?: YesNo;
  astCtgrCd?: string;
}

export interface TradeContractFee {
  feeId: string;
  feeSeq?: number;
  /** PRAMT, BALNC. */
  feeSeCd?: string;
  crncCd?: string;
  fee?: number;
  /** ddMMyyyy. */
  feePayTermDmy?: string;
  feeRcptYn?: YesNo;
  feeRcptIdntyDmy?: string;
  rcptAmt?: number;
  /** RFPL, RFCP. */
  rfndSttsCd?: string;
  rfndDmy?: string;
  rfndAmt?: number;
}

export interface TradeContractEnd {
  ctrtEndId: string;
  /** CMPL, CNCL, EXPR. */
  endRsnCd?: string;
  /** RFND, CLCN, NONE. */
  feeHndlCd?: string;
  /** PREPR, DRFAPR, SGNWT, SGNCP, CMPTN. */
  endSttsCd?: string;
  atrzHstryId?: string;
  drftDcmntFile?: string;
  sgnScnFile?: string;
  endDmy?: string;
  endRsnCn?: string;
  draftFiles?: TradeFile[];
  scanFiles?: TradeFile[];
}

/** Follow-up consultation requested by the member (RQST → RCPT → CMPTN). */
export interface TradeAdditionalConsultation {
  adtnId: string;
  rqstCn?: string;
  adtnSttsCd?: string;
  rsltCn?: string;
  rsltFile?: string;
  rcptEmpNo?: string;
  rcptDt?: string;
  cmptnDt?: string;
  crtDt?: string;
}

/** Contract detail (TradeContractDetailResponse). */
export interface TradeContractDetail {
  srvcCtrtCd: string;
  /** Readable numbers shown on screens. */
  srvcCtrtNo?: string;
  srvcAplyNo?: string;
  mstCtrtNo?: string;
  ctrtSeCd?: string;
  mstCtrtCd?: string;
  ctrtSttsCd?: TradeContractStatus;
  ctrtSttsNm?: string;
  srvcAplyId?: string;
  mbrNo?: string;
  mbrNm?: string;
  tkcgEmpNo?: string;
  tkcgEmpNm?: string;
  /** ddMMyyyy. */
  ctrtCnclsDmy?: string;
  /** ddMMyyyy. */
  ctrtBgngDmy?: string;
  /** ddMMyyyy. */
  ctrtEndDmy?: string;
  crncCd?: string;
  prpPrc?: number;
  rltrPrc?: number;
  trdCnclsDmy?: string;
  anxPrpsCd?: string;
  anxCn?: string;
  autoTrmnYn?: YesNo;
  feeClclnMthCd?: string;
  feeMngId?: string;
  feeAmt?: number;
  prAmtRt?: number;
  feeRcptCmptnYn?: YesNo;
  atrzHstryId?: string;
  atrzSttsCd?: string;
  drftDcmntFile?: string;
  ctrtDcmntScnFile?: string;
  dlvrCmptnDmy?: string;
  dlvrCn?: string;
  drctTrdYn?: YesNo;
  dspslCtrtCd?: string;
  cnsltEmpNo?: string;
  cnsltEmpNm?: string;
  /** DRFT, APRQ, APRV, RDY, OPEN. */
  cnsltRptpSttsCd?: string;
  cnsltRptpFileUnqId?: string;
  cnsltRptpSmryCn?: string;
  cnsltRptpOpenDt?: string;
  reportFiles?: TradeFile[];
  additionalConsultations?: TradeAdditionalConsultation[];
  npls?: TradeNpl[];
  draftFiles?: TradeFile[];
  scanFiles?: TradeFile[];
  fees?: TradeContractFee[];
  annexes?: TradeContractListItem[];
  terminations?: TradeContractEnd[];
  /** Actions open to the signed-in employee (WP8), e.g. UPDATE_DRAFT, REQUEST_DRAFT_APPROVAL, DECIDE, CONFIRM_FEE. */
  availableActions?: string[];
  /** Approval session waiting for a decision (send to /approvals/{id}/approve|reject). */
  openAtrzHstryId?: string;
  openApproval?: TradeOpenApproval;
}

export interface TradeOpenApproval {
  atrzHstryId: string;
  atrzProcCd?: string;
  atrzTrgtSeCd?: string;
  atrzSttsCd?: string;
  nowStpNo?: number;
  requesterEmpNo?: string;
  approverEmpNo?: string;
  approverEmpNm?: string;
  requestedAt?: string;
  comment?: string;
}

export interface TradeApplicationSearch {
  /** yyyy-MM-dd, inclusive. */
  aplyFromDt?: string;
  /** yyyy-MM-dd, inclusive. */
  aplyToDt?: string;
  sttsCds?: TradeApplicationStatus[];
  approvalStages?: TradeApprovalStage[];
  bndLotYn?: YesNo;
  mbrNo?: string;
  bndCd?: string;
  keyword?: string;
  rcptEmpNo?: string;
  tkcgEmpNo?: string;
}

export interface TradeContractSearch {
  /** yyyy-MM-dd, inclusive. */
  ctrtFromDt?: string;
  /** yyyy-MM-dd, inclusive. */
  ctrtToDt?: string;
  ctrtSttsCds?: TradeContractStatus[];
  bndLotYn?: YesNo;
  mbrNo?: string;
  bndCd?: string;
  keyword?: string;
  tkcgEmpNo?: string;
  endingWithinDays?: number;
}

/** CLTR_AST_LCLSF_CD of a typed consulting collateral. */
export type CollateralCategory = 'REST' | 'PERS' | 'FNRT' | 'TSBDK';

export const COLLATERAL_CATEGORY_LABELS: Record<CollateralCategory, string> = {
  REST: 'Real estate',
  PERS: 'Movable property',
  FNRT: 'Financial rights',
  TSBDK: 'Other collateral',
};

/** Collateral typed in a manual consulting registration (ConsultingTargetCollateralRequest). */
export interface ConsultingTargetCollateral {
  cltrAstLclsfCd: CollateralCategory;
  /** ≤ 25. */
  cltrCtrtNo: string;
  /** yyyy-MM-dd. */
  ctrtDt: string;
  /** ≤ 1000. */
  astChrcCn: string;
  lglSttsCn?: string;
  loanTtmCltrWrthCn?: string;
  rcntCltrWrthCn?: string;
  cltrAplcnScpCn?: string;
  prstCn?: string;
}

/**
 * Body of manual registration (POST) and edit (PUT) — SaveTradeApplicationRequest. On PUT a field left out keeps the
 * stored value (price, scan group, contract kind, consulting fields), so the edit sends only what changed.
 */
export interface SaveTradeApplicationRequest {
  /** Active member (create only). */
  mbrNo?: string;
  /** Registered NPL, or `bndLotId`, never both (create only; optional for consulting). */
  bndCd?: string;
  bndLotId?: string;
  /** Sale: MDT, BASE_ANX (+ baseCtrtCd). */
  ctrtKndCd?: 'MDT' | 'BASE_ANX';
  baseCtrtCd?: string;
  /** Consulting: CNSLT_DMND_SE_CD and the request (≤ 4000). */
  cnsltDmndSeCd?: string;
  cnsltDmndPrpsCn?: string;
  /** Consulting: listed collateral (CLTR_AST_INFO.CLTR_AST_CD); unknown → 404 TRD052. */
  cltrAstCd?: string;
  /** Consulting, create only: collaterals typed from the paper form (max 20), stored like the member's web form. */
  targetCollaterals?: ConsultingTargetCollateral[];
  crncCd?: 'VND' | 'USD';
  prpDsplPrc?: number;
  /** File group uploaded with scope `application`. */
  scanFileId?: string;
  /** Create: RCPT, or PRCS = received at once (needs tkcgEmpNo). */
  aplySttsCd?: 'RCPT' | 'PRCS';
  tkcgEmpNo?: string;
}

export interface TradeApplicationStatusResult {
  srvcAplyId: string;
  srvcPrcsSttsCd?: string;
  [field: string]: unknown;
}

/** Number shown for an application: readable number, the key only while the server has none. */
export const applicationNo = (row: { srvcAplyId: string; srvcAplyNo?: string }) => row.srvcAplyNo || row.srvcAplyId;

/** Number shown for a contract / annex. */
export const contractNo = (row: { srvcCtrtCd: string; srvcCtrtNo?: string }) => row.srvcCtrtNo || row.srvcCtrtCd;

const applications = (kind: TradeAppKind) => `/api/v1/service-applications/${kind}`;
const application = (kind: TradeAppKind, id: string) => `${applications(kind)}/${encodeURIComponent(id)}`;

export const getTradeApplications = (
  kind: TradeAppKind,
  search: TradeApplicationSearch,
  page: number,
  size: number,
) => apiGet<PageResponse<TradeApplicationListItem>>(applications(kind), { ...search, page, size });

export const getTradeApplication = (kind: TradeAppKind, id: string) =>
  apiGet<TradeApplicationDetail>(application(kind, id));

/** M3–M7: manual registration of a paper application. */
export const createTradeApplication = (kind: TradeAppKind, body: SaveTradeApplicationRequest) =>
  apiPost<TradeApplicationStatusResult>(applications(kind), body);

/** A4: edit before approval (contract kind, base contract, consulting request, currency, price, scan). */
export const updateTradeApplication = (kind: TradeAppKind, id: string, body: SaveTradeApplicationRequest) =>
  apiPut<TradeApplicationDetail>(application(kind, id), body);

/** I7 / M7: receive the application and assign the officer in charge (RCPT → PRCS). */
export const receiptTradeApplication = (kind: TradeAppKind, id: string, tkcgEmpNo: string) =>
  apiPost<unknown>(`${application(kind, id)}/receipt`, { tkcgEmpNo });

/** Change the officer in charge (stage PROCESSING / IN_APPROVAL / REJECTED); the new officer gets an e-mail. */
export const changeTradeApplicationOfficer = (kind: TradeAppKind, id: string, tkcgEmpNo: string) =>
  apiPut<unknown>(`${application(kind, id)}/officer`, { tkcgEmpNo });

/** I11 / I11-1c: attach an uploaded file group (POST /trade-files?scope=application) as scanned documents. */
export const attachTradeApplicationScans = (kind: TradeAppKind, id: string, fileUnqId: string) =>
  apiPost<unknown>(`${application(kind, id)}/scans`, { fileUnqId });

/** I11-1a / I11-2: documents complete (PRCS/DCIN → DCOK) or incomplete with the missing note (→ DCIN). */
export const checkTradeApplicationDocuments = (kind: TradeAppKind, id: string, complete: boolean, missingNote?: string) =>
  apiPost<unknown>(`${application(kind, id)}/documents`, complete ? { documentsComplete: 'Y' } : { documentsComplete: 'N', missingNote });

/** H2: cancel (RCPT…DCOK → CNCL); closes the open approval session. Reason ≤ 1000. */
export const cancelTradeApplication = (kind: TradeAppKind, id: string, reason: string) =>
  apiPost<unknown>(`${application(kind, id)}/cancel`, { reason });

/** I11-3: the officer asks for the receipt approval (DCOK; approver = `_RCPT` step 3). */
export const requestTradeApplicationApproval = (kind: TradeAppKind, id: string, body: ApprovalRequestBody) =>
  apiPost<unknown>(`${application(kind, id)}/approval`, body);

/** Employees selectable as officer in charge (`PROC_<prefix>_RCPT` step 2). */
export const getTradeOfficerCandidates = (kind: TradeAppKind) =>
  getApprovalCandidates({ atrzProcCd: tradeProcessCode(kind, 'RCPT'), stpNo: RECEIPT_OFFICER_STEP });

export const downloadTradeApplicationsExcel = (kind: TradeAppKind, search: Record<string, unknown>) =>
  apiDownload(`${applications(kind)}/excel`, `${kind}-applications.xlsx`, search);

export const getTradeContracts = (
  kind: TradeContractKind,
  search: TradeContractSearch,
  page: number,
  size: number,
) => apiGet<PageResponse<TradeContractListItem>>(`/api/v1/${kind}`, { ...search, page, size });

export const getTradeContract = (kind: TradeContractKind, id: string) =>
  apiGet<TradeContractDetail>(`/api/v1/${kind}/${encodeURIComponent(id)}`);

export const downloadTradeContractsExcel = (kind: TradeContractKind, search: Record<string, unknown>) =>
  apiDownload(`/api/v1/${kind}/excel`, `${kind}.xlsx`, search);
