import { apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { ApprovalRequestBody } from '@/api/common/approval-api';
import type { TradeContractDetail, TradeContractKind, YesNo } from '@/api/trade/trade-api';

// Trade contract write API — AbstractTradeContractController and Sale / Purchase / ConsultingContractController
// (/api/v1/{sale-brokerage|purchase-brokerage|consulting}-contracts/{ctrtCd}). Popups VPA050201P01 / 050202P01 /
// 050203P01 (contract register-edit), lifecycle of plan §1.2 / §1.3 (WP4, WP5). Dates are ISO `yyyy-MM-dd`.

export type FeeMethod = 'LUMP' | 'STAG' | 'AFTR';
export type AnnexPurpose = 'EXTN' | 'PRCE' | 'POST' | 'ETC';
export type RenewalDecision = 'EXTEND_ANNEX' | 'NEW_CONTRACT' | 'NO_EXTEND';

/** K2: draft terms (PREPR, officer only). Sale may be open-ended (no end date, `openEndedYn=Y`). */
export interface UpdateContractDraftRequest {
  ctrtBgngDt?: string;
  ctrtEndDt?: string;
  openEndedYn?: YesNo;
  crncCd?: 'VND' | 'USD';
  prpPrc?: number;
  autoTrmnYn?: YesNo;
  /** Annex content (annexes). */
  anxCn?: string;
  /** LUMP full after signing ①, AFTR full after the trade ②, STAG advance + balance ③. Required on a main contract. */
  feeClclnMthCd?: FeeMethod;
  /** Fee schedule (FEE_MNG); the server uses the default one of the kind when absent. */
  feeMngId?: string;
  feeAmt?: number;
  /** Advance rate in % (STAG). */
  prAmtRt?: number;
}

export interface FeeReceiptRequest {
  transferDt: string;
  amount: number;
}

/** Sale completion (K23) / purchase trade conclusion (K22). */
export interface TradeCompletionRequest {
  trdCnclsDt: string;
  rltrPrc: number;
  finalFeeAmt?: number;
}

export interface CreateAnnexRequest {
  anxPrpsCd: AnnexPurpose;
  /** EXTN. */
  newEndDt?: string;
  /** PRCE. */
  newPrpPrc?: number;
  anxCn?: string;
}

/** One approval session of the contract (draft, signature, annex, termination). */
export interface ContractApprovalHistory {
  atrzHstryId: string;
  atrzProcCd?: string;
  atrzTrgtSeCd?: string;
  /** INPROGRESS, COMPLETED, REJECTED. */
  atrzSttsCd?: string;
  nowStpNo?: number;
  requesterEmpNo?: string;
  approverEmpNo?: string;
  approverEmpNm?: string;
  requestedAt?: string;
  decidedAt?: string;
  comment?: string;
}

export interface ContractStatusResult {
  srvcCtrtCd: string;
  ctrtSttsCd?: string;
  [field: string]: unknown;
}

const contract = (kind: TradeContractKind, ctrtCd: string) => `/api/v1/${kind}/${encodeURIComponent(ctrtCd)}`;

export const getContractApprovalHistories = (kind: TradeContractKind, ctrtCd: string) =>
  apiGet<ContractApprovalHistory[]>(`${contract(kind, ctrtCd)}/approval-histories`, undefined, []);

/** Officer change (WP8): any staff with write permission; the new officer must hold the processing role. */
export const changeContractOfficer = (kind: TradeContractKind, ctrtCd: string, tkcgEmpNo: string) =>
  apiPut<TradeContractDetail>(`${contract(kind, ctrtCd)}/officer`, { tkcgEmpNo });

export const updateContractDraft = (kind: TradeContractKind, ctrtCd: string, body: UpdateContractDraftRequest) =>
  apiPut<TradeContractDetail>(contract(kind, ctrtCd), body);

/** K3: draft approval (`_CTRT`, annex `_ANX`) → DRFAPR when approved. */
export const requestContractDraftApproval = (kind: TradeContractKind, ctrtCd: string, body: ApprovalRequestBody) =>
  apiPost<unknown>(`${contract(kind, ctrtCd)}/approval`, body);

/** K7: register the draft document (DRFAPR → SGNWT; mails the signature request). */
export const registerContractDraft = (kind: TradeContractKind, ctrtCd: string, fileUnqId: string) =>
  apiPost<unknown>(`${contract(kind, ctrtCd)}/draft-registration`, { fileUnqId });

/** K13: signature approval (`_SIGN`); the approver's decision is "Signing Complete" (SGNWT → SGNCP). */
export const requestContractSignatureApproval = (kind: TradeContractKind, ctrtCd: string, body: ApprovalRequestBody) =>
  apiPost<unknown>(`${contract(kind, ctrtCd)}/signature-approval`, body);

/** K15: signed contract scan (SGNCP). */
export const attachContractSignedScan = (kind: TradeContractKind, ctrtCd: string, fileUnqId: string) =>
  apiPost<unknown>(`${contract(kind, ctrtCd)}/signed-scan`, { fileUnqId });

/** K16: conclusion (SGNCP → PROGS; needs the signed scan; issues the first fee). */
export const concludeContract = (kind: TradeContractKind, ctrtCd: string, cnclsDt?: string) =>
  apiPost<ContractStatusResult>(`${contract(kind, ctrtCd)}/conclusion`, cnclsDt ? { cnclsDt } : {});

/** Fee installment received (PROGS). */
export const confirmContractFee = (kind: TradeContractKind, ctrtCd: string, feeId: string, body: FeeReceiptRequest) =>
  apiPost<unknown>(`${contract(kind, ctrtCd)}/fees/${encodeURIComponent(feeId)}/receipt`, body);

/** Refund of a planned refund (RFPL → RFCP). */
export const refundContractFee = (kind: TradeContractKind, ctrtCd: string, feeId: string, body: FeeReceiptRequest) =>
  apiPost<unknown>(`${contract(kind, ctrtCd)}/fees/${encodeURIComponent(feeId)}/refund`, body);

/** Sale K23: sale agreement signed — actual price, final fee; NPL → SD; issues the balance. */
export const completeSale = (ctrtCd: string, body: TradeCompletionRequest) =>
  apiPost<unknown>(`${contract('sale-brokerage-contracts', ctrtCd)}/sale-completion`, body);

/** Purchase K22: sale-and-purchase agreement signed. */
export const concludePurchaseTrade = (ctrtCd: string, body: TradeCompletionRequest) =>
  apiPost<unknown>(`${contract('purchase-brokerage-contracts', ctrtCd)}/trade-conclusion`, body);

/** Purchase K24: delivery (after the trade conclusion). */
export const recordPurchaseDelivery = (ctrtCd: string, body: { dlvrCmptnDt: string; dlvrCn?: string }) =>
  apiPost<unknown>(`${contract('purchase-brokerage-contracts', ctrtCd)}/delivery`, body);

/** Annex of a contract in progress (sale EXTN / PRCE / POST / ETC, purchase EXTN); answers the annex code. */
export const createContractAnnex = (kind: TradeContractKind, ctrtCd: string, body: CreateAnnexRequest) =>
  apiPost<ContractStatusResult>(`${contract(kind, ctrtCd)}/annexes`, body);

/** X2: renewal decision near the end date (NO_EXTEND opens an EXPR termination at once — open question N3). */
export const decideContractRenewal = (
  kind: TradeContractKind,
  ctrtCd: string,
  body: { decision: RenewalDecision; newEndDt?: string; note?: string },
) => apiPost<unknown>(`${contract(kind, ctrtCd)}/renewal-decision`, body);

// ── Termination (plan §1.4, flow "close" steps 1–15) ─────────────────────────

export type EndReason = 'CMPL' | 'CNCL' | 'EXPR';
export type FeeHandling = 'RFND' | 'CLCN' | 'NONE';

export interface StartTerminationRequest {
  /** CMPL completed, CNCL early termination, EXPR expired (not for consulting; only with an end date). */
  endRsnCd: EndReason;
  /** Fee handling on an early termination: refund / collect / none. */
  feeHndlCd?: FeeHandling;
  note?: string;
  /** Purchase: the parties traded directly. */
  drctTrdYn?: YesNo;
}

const termination = (kind: TradeContractKind, ctrtCd: string) => `${contract(kind, ctrtCd)}/termination`;

/** E1: register the termination (PROGS → ENDING; with auto-termination it completes at once). */
export const startContractTermination = (kind: TradeContractKind, ctrtCd: string, body: StartTerminationRequest) =>
  apiPost<unknown>(termination(kind, ctrtCd), body);

/** E2: termination approval (`_END`). */
export const requestTerminationApproval = (kind: TradeContractKind, ctrtCd: string, body: ApprovalRequestBody) =>
  apiPost<unknown>(`${termination(kind, ctrtCd)}/approval`, body);

/** E6: register the liquidation minutes (Mẫu 12); mails the signature request. */
export const registerTerminationDraft = (kind: TradeContractKind, ctrtCd: string, fileUnqId: string) =>
  apiPost<unknown>(`${termination(kind, ctrtCd)}/draft-registration`, { fileUnqId });

/** E12: minutes signature approval (`_END_SIGN`). */
export const requestTerminationSignature = (kind: TradeContractKind, ctrtCd: string, body: ApprovalRequestBody) =>
  apiPost<unknown>(`${termination(kind, ctrtCd)}/signature-approval`, body);

/** E14: signed minutes scan. */
export const attachTerminationScan = (kind: TradeContractKind, ctrtCd: string, fileUnqId: string) =>
  apiPost<unknown>(`${termination(kind, ctrtCd)}/signed-scan`, { fileUnqId });

/** E15: close the contract (CMPTN for CMPL, else CNCLN; mails TERMINATED). */
export const completeContractTermination = (kind: TradeContractKind, ctrtCd: string) =>
  apiPost<unknown>(`${termination(kind, ctrtCd)}/completion`);

// ── Consulting (plan §1.3, WP7) ──────────────────────────────────────────────

/** Approval process of the consulting report (2 steps, approver = step 2). */
export const CONSULTING_REPORT_PROCESS = 'PROC_CNSLT_RPTP';

const consulting = (ctrtCd: string) => contract('consulting-contracts', ctrtCd);

/** K7: consultant in charge (hired employee, not the officer: 409 TRD001). */
export const assignConsultant = (ctrtCd: string, cnsltEmpNo: string) => apiPut<unknown>(`${consulting(ctrtCd)}/consultant`, { cnsltEmpNo });

/** P1: save the report draft (file group scope `contract` + summary ≤ 4000). */
export const saveConsultingReport = (ctrtCd: string, fileUnqId: string, summary: string) =>
  apiPut<unknown>(`${consulting(ctrtCd)}/report`, { fileUnqId, summary });

/** P2: report approval request (PROC_CNSLT_RPTP). */
export const requestConsultingReportApproval = (ctrtCd: string, body: ApprovalRequestBody) =>
  apiPost<unknown>(`${consulting(ctrtCd)}/report/approval`, body);

/** P6: complete the approved report; issues the remaining fee (published at once when nothing is left: OPEN). */
export const completeConsultingReport = (ctrtCd: string) => apiPost<unknown>(`${consulting(ctrtCd)}/report/completion`);

/** A4: receive a follow-up consultation request of the member. */
export const receiveAdditionalConsultation = (ctrtCd: string, adtnId: string) =>
  apiPost<unknown>(`${consulting(ctrtCd)}/additional-consultations/${encodeURIComponent(adtnId)}/receipt`);

/** A6: answer it (result ≤ 4000, optional file). */
export const completeAdditionalConsultation = (ctrtCd: string, adtnId: string, resultCn: string, fileUnqId?: string) =>
  apiPost<unknown>(`${consulting(ctrtCd)}/additional-consultations/${encodeURIComponent(adtnId)}/completion`, { resultCn, fileUnqId });

/** Whether members may request follow-up consultations (system switch on the consulting contract board). */
export const getAdditionalConsultingSetting = () => apiGet<boolean>('/api/v1/consulting-contracts/settings/additional-consulting');

/** Body `enabled` is Y / N (AdditionalConsultingSettingRequest). */
export const setAdditionalConsultingSetting = (enabled: boolean) =>
  apiPut<boolean>('/api/v1/consulting-contracts/settings/additional-consulting', { enabled: enabled ? 'Y' : 'N' });
