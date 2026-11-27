import i18n from '@/lib/i18n';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import type { ApprovalRequestBody } from '@/api/common/approval-api';
import type { TradeAppKind, TradeContractKind } from '@/api/trade/trade-api';
import {
  assignConsultant,
  completeAdditionalConsultation,
  completeConsultingReport,
  receiveAdditionalConsultation,
  requestConsultingReportApproval,
  saveConsultingReport,
  attachContractSignedScan,
  attachTerminationScan,
  completeContractTermination,
  registerTerminationDraft,
  requestTerminationApproval,
  requestTerminationSignature,
  startContractTermination,
  changeContractOfficer,
  completeSale,
  concludeContract,
  concludePurchaseTrade,
  confirmContractFee,
  createContractAnnex,
  decideContractRenewal,
  getContractApprovalHistories,
  getContractFeeItems,
  recordPurchaseDelivery,
  refundContractFee,
  registerContractDraft,
  requestContractDraftApproval,
  requestContractSignatureApproval,
  updateContractDraft,
} from '@/api/trade/trade-contract-api';
import type {
  ContractApprovalHistory,
  CreateAnnexRequest,
  FeeReceiptRequest,
  RenewalDecision,
  StartTerminationRequest,
  TradeCompletionRequest,
  UpdateContractDraftRequest,
} from '@/api/trade/trade-contract-api';
import { uploadTradeFiles } from '@/api/trade/trade-file-api';
import type { Fee } from '@/api/system/fee-api';

// Write hooks of the contract popup (VPA050201P01 / 050202P01 / 050203P01). Every write refetches the contract
// lists / details, the application lists (contract link) and the approval inbox.

const AFTER_WRITE = [['trade'], ['approval']];

interface Target {
  kind: TradeContractKind;
  ctrtCd: string;
}

export function useContractApprovalHistories(kind: TradeContractKind, ctrtCd: string | null) {
  return useApiQuery<ContractApprovalHistory[]>(
    ['trade', 'contracts', 'approval-histories', kind, ctrtCd],
    () => getContractApprovalHistories(kind, ctrtCd as string),
    { enabled: !!ctrtCd },
  );
}

/** Fee schedule items of the contract kind (draft form select); skipped while disabled. */
export function useContractFeeItems(kind: TradeContractKind, enabled: boolean) {
  return useApiQuery<Fee[]>(['trade', 'contracts', 'fee-items', kind], () => getContractFeeItems(kind), {
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChangeContractOfficer() {
  return useApiAction(({ kind, ctrtCd, empNo }: Target & { empNo: string }) => changeContractOfficer(kind, ctrtCd, empNo), {
    invalidate: AFTER_WRITE,
  });
}

export function useUpdateContractDraft() {
  return useApiAction(({ kind, ctrtCd, body }: Target & { body: UpdateContractDraftRequest }) => updateContractDraft(kind, ctrtCd, body), {
    invalidate: AFTER_WRITE,
  });
}

/** Draft (`approval`) or signature (`signature`) approval request. */
export function useRequestContractApproval() {
  return useApiAction(
    ({ kind, ctrtCd, step, body }: Target & { step: 'draft' | 'signature'; body: ApprovalRequestBody }) =>
      step === 'draft' ? requestContractDraftApproval(kind, ctrtCd, body) : requestContractSignatureApproval(kind, ctrtCd, body),
    { invalidate: AFTER_WRITE },
  );
}

/** Uploads a document (scope `contract`) and registers it as the draft or the signed scan. */
export function useUploadContractDocument() {
  return useApiTask(
    async ({ kind, appKind, ctrtCd, files, as }: Target & { appKind: TradeAppKind; files: File[]; as: 'draft' | 'signed' }) => {
      const group = await uploadTradeFiles(appKind, 'contract', files);
      if (as === 'draft') await registerContractDraft(kind, ctrtCd, group.fileUnqId);
      else await attachContractSignedScan(kind, ctrtCd, group.fileUnqId);
      return group;
    },
    { invalidate: AFTER_WRITE },
  );
}

export function useConcludeContract() {
  return useApiAction(({ kind, ctrtCd, cnclsDt }: Target & { cnclsDt?: string }) => concludeContract(kind, ctrtCd, cnclsDt), {
    invalidate: AFTER_WRITE,
  });
}

export function useContractFeeAction() {
  return useApiAction(
    ({ kind, ctrtCd, feeId, refund, body }: Target & { feeId: string; refund: boolean; body: FeeReceiptRequest }) =>
      refund ? refundContractFee(kind, ctrtCd, feeId, body) : confirmContractFee(kind, ctrtCd, feeId, body),
    { invalidate: AFTER_WRITE },
  );
}

/** Sale completion (sale) or trade conclusion (purchase). */
export function useCompleteContractTrade() {
  return useApiAction(
    ({ kind, ctrtCd, body }: Target & { body: TradeCompletionRequest }) =>
      kind === 'sale-brokerage-contracts' ? completeSale(ctrtCd, body) : concludePurchaseTrade(ctrtCd, body),
    { invalidate: AFTER_WRITE },
  );
}

export function useRecordDelivery() {
  return useApiAction(({ ctrtCd, dlvrCmptnDt, dlvrCn }: { ctrtCd: string; dlvrCmptnDt: string; dlvrCn?: string }) =>
    recordPurchaseDelivery(ctrtCd, { dlvrCmptnDt, dlvrCn }), { invalidate: AFTER_WRITE });
}

export function useCreateAnnex() {
  return useApiAction(({ kind, ctrtCd, body }: Target & { body: CreateAnnexRequest }) => createContractAnnex(kind, ctrtCd, body), {
    invalidate: AFTER_WRITE,
  });
}

export function useDecideRenewal() {
  return useApiAction(
    ({ kind, ctrtCd, decision, newEndDt, note }: Target & { decision: RenewalDecision; newEndDt?: string; note?: string }) =>
      decideContractRenewal(kind, ctrtCd, { decision, newEndDt, note }),
    { invalidate: AFTER_WRITE },
  );
}

export function useStartTermination() {
  return useApiAction(({ kind, ctrtCd, body }: Target & { body: StartTerminationRequest }) => startContractTermination(kind, ctrtCd, body), {
    invalidate: AFTER_WRITE,
  });
}

/** Termination approval (`approval`) or minutes signature approval (`signature`). */
export function useRequestTerminationApproval() {
  return useApiAction(
    ({ kind, ctrtCd, step, body }: Target & { step: 'approval' | 'signature'; body: ApprovalRequestBody }) =>
      step === 'approval' ? requestTerminationApproval(kind, ctrtCd, body) : requestTerminationSignature(kind, ctrtCd, body),
    { invalidate: AFTER_WRITE },
  );
}

/** Uploads the minutes (scope `contract`) as draft or signed scan. */
export function useUploadTerminationDocument() {
  return useApiTask(
    async ({ kind, appKind, ctrtCd, files, as }: Target & { appKind: TradeAppKind; files: File[]; as: 'draft' | 'signed' }) => {
      const group = await uploadTradeFiles(appKind, 'contract', files);
      if (as === 'draft') await registerTerminationDraft(kind, ctrtCd, group.fileUnqId);
      else await attachTerminationScan(kind, ctrtCd, group.fileUnqId);
      return group;
    },
    { invalidate: AFTER_WRITE },
  );
}

export function useCompleteTermination() {
  return useApiAction(({ kind, ctrtCd }: Target) => completeContractTermination(kind, ctrtCd), { invalidate: AFTER_WRITE });
}

export function useAssignConsultant() {
  return useApiAction(({ ctrtCd, empNo }: { ctrtCd: string; empNo: string }) => assignConsultant(ctrtCd, empNo), { invalidate: AFTER_WRITE });
}

/** Uploads the report file (consulting, scope `contract`) and saves it with the summary. */
export function useSaveConsultingReport() {
  return useApiTask(
    async ({ ctrtCd, files, fileUnqId, summary }: { ctrtCd: string; files: File[]; fileUnqId?: string; summary: string }) => {
      const groupId = files.length ? (await uploadTradeFiles('consulting', 'contract', files)).fileUnqId : fileUnqId;
      if (!groupId) throw new Error(i18n.t('trade.report.fileMissing'));
      return saveConsultingReport(ctrtCd, groupId, summary);
    },
    { invalidate: AFTER_WRITE },
  );
}

export function useRequestReportApproval() {
  return useApiAction(({ ctrtCd, body }: { ctrtCd: string; body: ApprovalRequestBody }) => requestConsultingReportApproval(ctrtCd, body), {
    invalidate: AFTER_WRITE,
  });
}

export function useCompleteConsultingReport() {
  return useApiAction((ctrtCd: string) => completeConsultingReport(ctrtCd), { invalidate: AFTER_WRITE });
}

export function useAdditionalConsultationAction() {
  return useApiTask(
    async ({ ctrtCd, adtnId, complete, resultCn, files }: { ctrtCd: string; adtnId: string; complete: boolean; resultCn?: string; files?: File[] }) => {
      if (!complete) return receiveAdditionalConsultation(ctrtCd, adtnId);
      const fileUnqId = files?.length ? (await uploadTradeFiles('consulting', 'contract', files)).fileUnqId : undefined;
      return completeAdditionalConsultation(ctrtCd, adtnId, resultCn ?? '', fileUnqId);
    },
    { invalidate: AFTER_WRITE },
  );
}
