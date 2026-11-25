import { webcrypto } from 'node:crypto';
import type { Page } from '@playwright/test';

// Workflow fixtures (project `workflow`): staff accounts, direct admin API calls with each account's token, and
// record pickers that choose applications by their status at run time (the seeded data changes on every run).
// Calls go straight to E2E_API_TARGET (no browser, no Origin header, so no CORS involved).

export type StaffKey = 'rcpt01' | 'prcs01' | 'appr01' | 'admin';
export type TradeKind = 'sale' | 'purchase' | 'consulting';

interface StaffAccount {
  key: StaffKey;
  /** EMP_NO, accepted by POST /api/auth/login. */
  empNo: string;
  /** The login page accepts only an e-mail or phone number. */
  uiLoginId: string;
}

/** Local seed accounts (17_seed_approval_processes / employee seed); override the e-mails with E2E_<KEY>_LOGIN. */
export const STAFF: StaffAccount[] = [
  { key: 'rcpt01', empNo: 'rcpt01', uiLoginId: process.env.E2E_RCPT01_LOGIN ?? 'account01@gmail.com' },
  { key: 'prcs01', empNo: 'prcs01', uiLoginId: process.env.E2E_PRCS01_LOGIN ?? 'account02@gmail.com' },
  { key: 'appr01', empNo: 'appr01', uiLoginId: process.env.E2E_APPR01_LOGIN ?? 'account03@gmail.com' },
  { key: 'admin', empNo: 'admin', uiLoginId: process.env.E2E_ADMIN_LOGIN ?? 'admin@gmail.com' },
];

/** Shared password of the workflow accounts — from the environment, never committed. */
export function workflowPassword(): string {
  const pass = process.env.E2E_WORKFLOW_PASS;
  if (!pass) throw new Error('Set E2E_WORKFLOW_PASS (password of rcpt01 / prcs01 / appr01 / admin, see e2e/README.md).');
  return pass;
}

/** Saved browser session of one account (written by workflow.setup.ts). */
export const storageStateOf = (key: StaffKey) => `e2e/.auth/wf-${key}.json`;

const API_TARGET = (process.env.E2E_API_TARGET ?? 'http://127.0.0.1:7200').replace(/\/+$/, '');

interface Body<T> {
  status?: number;
  message?: string;
  data?: T;
}

const tokens = new Map<StaffKey, string>();

async function login(key: StaffKey): Promise<string> {
  const cached = tokens.get(key);
  if (cached) return cached;
  const account = STAFF.find((s) => s.key === key);
  if (!account) throw new Error(`Unknown staff account ${key}`);
  const keyRes = (await (await fetch(`${API_TARGET}/api/auth/public-key`)).json()) as Body<{ publicKey: string }>;
  const der = Buffer.from(keyRes.data?.publicKey ?? '', 'base64');
  const publicKey = await webcrypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const encrypted = await webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new TextEncoder().encode(workflowPassword()));
  const res = await fetch(`${API_TARGET}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en' },
    body: JSON.stringify({ loginId: account.empNo, password: Buffer.from(encrypted).toString('base64') }),
  });
  const body = (await res.json()) as { accessToken?: string; data?: { accessToken?: string } };
  const token = body.accessToken ?? body.data?.accessToken;
  if (!res.ok || !token) throw new Error(`API login of ${key} failed (HTTP ${res.status})`);
  tokens.set(key, token);
  return token;
}

/** Calls the admin API as `key`; throws with the server message on a non-2xx answer. */
export async function api<T>(key: StaffKey, method: string, path: string, body?: unknown): Promise<T> {
  const token = await login(key);
  const res = await fetch(`${API_TARGET}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': 'en',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Body<T>;
  if (!res.ok) throw new Error(`${method} ${path} as ${key} → ${res.status} ${json.message ?? ''}`);
  return json.data as T;
}

export interface ApplicationRow {
  srvcAplyId: string;
  srvcAplyNo?: string;
  srvcPrcsSttsCd: string;
  srvcPrcsSttsNm?: string;
  approvalStage?: string;
  availableAction?: string;
  tkcgEmpNo?: string;
  bndCd?: string;
  rjctRsnCn?: string;
  srvcCtrtCd?: string;
  atrzHstryId?: string;
}

const applications = (kind: TradeKind) => `/api/v1/service-applications/${kind}`;

export async function listApplications(kind: TradeKind, as: StaffKey, query: string): Promise<ApplicationRow[]> {
  const page = await api<{ content: ApplicationRow[] }>(as, 'GET', `${applications(kind)}?page=1&size=50&${query}`);
  return page.content;
}

export const getApplication = (kind: TradeKind, id: string, as: StaffKey) =>
  api<ApplicationRow>(as, 'GET', `${applications(kind)}/${encodeURIComponent(id)}`);

/** Matches a row / text showing the application either by its readable number or by its key. */
export async function applicationText(kind: TradeKind, id: string): Promise<RegExp> {
  const no = (await getApplication(kind, id, 'prcs01')).srvcAplyNo;
  return new RegExp(no ? `${no}|${id}` : id);
}

/**
 * An application in RCPT that `rcpt01` may receive. When the seed has none left, registers one (manual, RCPT) for
 * member TV00000002 with a registered NPL — the same call as the Add New form.
 */
export async function pickReceivable(kind: TradeKind): Promise<string> {
  const rows = await listApplications(kind, 'rcpt01', 'sttsCds=RCPT');
  const row = rows.find((r) => r.availableAction === 'RECEIVE');
  if (row) return row.srvcAplyId;
  const npl = (await api<{ content: { bndCd: string }[] }>('rcpt01', 'GET', '/api/v1/npls?page=1&size=1&lotYn=N')).content[0];
  const created = await api<{ srvcAplyId: string }>('rcpt01', 'POST', applications(kind), {
    mbrNo: 'TV00000002',
    aplySttsCd: 'RCPT',
    ...(kind === 'consulting'
      ? { cnsltDmndSeCd: 'CNSTN_SRVC_02', cnsltDmndPrpsCn: 'e2e fixture consulting request' }
      : { bndCd: npl?.bndCd, crncCd: 'VND', prpDsplPrc: 1000000000, ...(kind === 'sale' ? { ctrtKndCd: 'MDT' } : {}) }),
  });
  return created.srvcAplyId;
}

/**
 * A sale application on which `prcs01` may request the receipt approval (DCOK, no session at the approver):
 * reuses one when it exists, otherwise moves a PRCS/DCIN one (documents complete) or receives a new one first.
 */
/** Purchase: a subject with a running purchase contract refuses the approval (409 purchaseContractInProgress). */
async function approvable(kind: TradeKind, id: string): Promise<boolean> {
  if (kind !== 'purchase') return true;
  const detail = (await getApplication(kind, id, 'prcs01')) as ApplicationRow & { activePurchaseCtrtCd?: string };
  return !detail.activePurchaseCtrtCd;
}

async function firstApprovable(kind: TradeKind, rows: ApplicationRow[], action: string): Promise<string | undefined> {
  for (const row of rows) {
    if (row.availableAction === action && (await approvable(kind, row.srvcAplyId))) return row.srvcAplyId;
  }
  return undefined;
}

export async function prepareApprovalRequest(kind: TradeKind): Promise<string> {
  const ready = await firstApprovable(kind, await listApplications(kind, 'prcs01', 'sttsCds=DCOK'), 'REQUEST_APPROVAL');
  if (ready) return ready;

  let id = await firstApprovable(kind, await listApplications(kind, 'prcs01', 'sttsCds=PRCS&sttsCds=DCIN'), 'CHECK_DOCUMENTS');
  if (!id) {
    for (const row of await listApplications(kind, 'rcpt01', 'sttsCds=RCPT')) {
      if (row.availableAction === 'RECEIVE' && (await approvable(kind, row.srvcAplyId))) {
        id = row.srvcAplyId;
        break;
      }
    }
    // Seed exhausted: a manual application (pickReceivable registers one).
    if (!id) id = await pickReceivable(kind);
    await api('rcpt01', 'POST', `${applications(kind)}/${encodeURIComponent(id)}/receipt`, { tkcgEmpNo: 'prcs01' });
  }
  await api('prcs01', 'POST', `${applications(kind)}/${encodeURIComponent(id)}/documents`, { documentsComplete: 'Y' });
  return id;
}

/** I11-3 through the API (the UI path is covered by wp1-approval.spec.ts). */
export const requestApproval = (kind: TradeKind, id: string, approverEmpNo = 'appr01') =>
  api('prcs01', 'POST', `${applications(kind)}/${encodeURIComponent(id)}/approval`, { approverEmpNo, comment: 'e2e workflow' });

/** Full-page screenshot into E2E_SHOT_DIR (kept outside the repo), when set. */
export async function shot(page: Page, name: string): Promise<void> {
  const dir = process.env.E2E_SHOT_DIR;
  if (dir) await page.screenshot({ path: `${dir}/${name}.png` });
}

// ── Contracts (WP4 / WP5) ────────────────────────────────────────────────────

export const CONTRACT_PATH: Record<TradeKind, string> = {
  sale: '/api/v1/sale-brokerage-contracts',
  purchase: '/api/v1/purchase-brokerage-contracts',
  consulting: '/api/v1/consulting-contracts',
};

export interface ContractRow {
  srvcCtrtCd: string;
  srvcCtrtNo?: string;
  mstCtrtCd?: string;
  ctrtSttsCd: string;
  tkcgEmpNo?: string;
  ctrtEndDmy?: string;
  prpPrc?: number;
  trdCnclsDmy?: string;
  dlvrCmptnDmy?: string;
  remainingDays?: number;
  availableActions?: string[];
  openAtrzHstryId?: string;
  fees?: { feeId: string; feeSeCd?: string; fee?: number; feeRcptYn?: string }[];
  annexes?: { srvcCtrtCd: string; ctrtSttsCd?: string }[];
}

export const getContract = (kind: TradeKind, ctrtCd: string, as: StaffKey = 'prcs01') =>
  api<ContractRow>(as, 'GET', `${CONTRACT_PATH[kind]}/${encodeURIComponent(ctrtCd)}`);

export async function listContracts(kind: TradeKind, query: string, as: StaffKey = 'prcs01'): Promise<ContractRow[]> {
  return (await api<{ content: ContractRow[] }>(as, 'GET', `${CONTRACT_PATH[kind]}?page=1&size=50&${query}`)).content;
}

/** First main contract (not an annex) of the list whose detail (as prcs01) offers `action`. */
export async function findContractWith(kind: TradeKind, query: string, action: string): Promise<string | undefined> {
  for (const row of await listContracts(kind, query)) {
    if (row.mstCtrtCd && row.mstCtrtCd !== row.srvcCtrtCd) continue;
    const detail = await getContract(kind, row.srvcCtrtCd);
    if (detail.availableActions?.includes(action)) return row.srvcCtrtCd;
  }
  return undefined;
}

/**
 * A main contract in PREPR that prcs01 may draft. Purchase and consulting have no seeded contracts: builds one with
 * the application chain (documents complete → approval request → approval), like docs/simulator/flow.py.
 */
export async function preparePreparingContract(kind: TradeKind): Promise<string> {
  await ensureFeeSchedule(kind);
  const existing = await findContractWith(kind, 'ctrtSttsCds=PREPR', 'UPDATE_DRAFT');
  if (existing) return existing;
  const id = await prepareApprovalRequest(kind);
  await requestApproval(kind, id);
  const session = (await getApplication(kind, id, 'prcs01')).atrzHstryId as string;
  await api('appr01', 'POST', `/api/v1/approvals/${session}/approve`, { confirmed: true, cmntCn: 'e2e fixture' });
  const contract = (await getApplication(kind, id, 'prcs01')).srvcCtrtCd;
  if (!contract) throw new Error(`No contract created for ${kind} ${id}`);
  return contract;
}

const FEE_CATEGORY: Record<TradeKind, string> = { sale: 'DMDT', purchase: 'PMDT', consulting: 'CNSLT' };

/**
 * The draft save needs an active fee schedule item of the kind (SRVC_FEE_MNG, default = first in use). The local
 * seed has one for sale only: creates a test item for purchase / consulting when missing (Fee Management API).
 */
export async function ensureFeeSchedule(kind: TradeKind): Promise<void> {
  const page = await api<{ content: { feeId: string; useYn?: string }[] }>('admin', 'GET', '/api/v1/platform/fees?page=1&size=100');
  const prefix = { DMDT: 'FEE-SBR-', PMDT: 'FEE-PBR-', CNSLT: 'FEE-CNS-' }[FEE_CATEGORY[kind]] as string;
  if (page.content.some((fee) => fee.feeId.startsWith(prefix) && fee.useYn !== 'N')) return;
  await api('admin', 'POST', '/api/v1/platform/fees', {
    category: FEE_CATEGORY[kind],
    order: 1,
    name: `E2E ${kind} fee`,
    method: 'TRF',
    currency: 'VND',
    rate: 1,
    useYn: 'Y',
  });
}

// ── Contract fixtures driven through the API (WP5–WP7 start from a contract in progress) ──

const SAMPLE_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

/** Uploads the sample PDF as a trade document group (as prcs01); returns its id. */
export async function uploadSampleFile(kind: TradeKind, scope: 'application' | 'contract'): Promise<string> {
  const token = await login('prcs01');
  const form = new FormData();
  form.append('files', new Blob([SAMPLE_PDF], { type: 'application/pdf' }), 'e2e-fixture.pdf');
  const res = await fetch(`${API_TARGET}/api/v1/trade-files?kind=${kind}&scope=${scope}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = (await res.json()) as Body<{ fileUnqId: string }>;
  if (!res.ok || !json.data) throw new Error(`upload → ${res.status} ${json.message ?? ''}`);
  return json.data.fileUnqId;
}

async function approveOpenSession(kind: TradeKind, ctrtCd: string): Promise<void> {
  const session = (await getContract(kind, ctrtCd)).openAtrzHstryId;
  if (!session) throw new Error(`No open approval on ${ctrtCd}`);
  await api('appr01', 'POST', `/api/v1/approvals/${session}/approve`, { confirmed: true, cmntCn: 'e2e fixture' });
}

/** Drives a PREPR main contract to PROGS (draft STAG 20 % → approvals → documents → conclusion). */
export async function driveContractToProgress(kind: TradeKind, ctrtCd: string, endDate?: string): Promise<void> {
  const path = `${CONTRACT_PATH[kind]}/${encodeURIComponent(ctrtCd)}`;
  const today = new Date().toISOString().slice(0, 10);
  await api('prcs01', 'PUT', path, {
    ctrtBgngDt: today,
    ...(endDate ? { ctrtEndDt: endDate } : {}),
    crncCd: 'VND',
    feeClclnMthCd: 'STAG',
    feeAmt: 100000000,
    prAmtRt: 20,
  });
  await api('prcs01', 'POST', `${path}/approval`, { approverEmpNo: 'appr01', comment: 'e2e fixture' });
  await approveOpenSession(kind, ctrtCd);
  await api('prcs01', 'POST', `${path}/draft-registration`, { fileUnqId: await uploadSampleFile(kind, 'contract') });
  await api('prcs01', 'POST', `${path}/signature-approval`, { approverEmpNo: 'appr01', comment: 'e2e fixture' });
  await approveOpenSession(kind, ctrtCd);
  await api('prcs01', 'POST', `${path}/signed-scan`, { fileUnqId: await uploadSampleFile(kind, 'contract') });
  await api('prcs01', 'POST', `${path}/conclusion`, { cnclsDt: today });
}

/** Marks every unpaid fee installment as received. */
export async function payOpenFees(kind: TradeKind, ctrtCd: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  for (const fee of (await getContract(kind, ctrtCd)).fees ?? []) {
    if (fee.feeRcptYn === 'Y') continue;
    await api('prcs01', 'POST', `${CONTRACT_PATH[kind]}/${encodeURIComponent(ctrtCd)}/fees/${fee.feeId}/receipt`, {
      transferDt: today,
      amount: fee.fee,
    });
  }
}

/** A fresh main contract of the kind in PROGS, optionally of one member's application. */
export async function prepareContractInProgress(kind: TradeKind, endDate?: string): Promise<string> {
  await ensureFeeSchedule(kind);
  const id = await prepareApprovalRequest(kind);
  await requestApproval(kind, id);
  const session = (await getApplication(kind, id, 'prcs01')).atrzHstryId as string;
  await api('appr01', 'POST', `/api/v1/approvals/${session}/approve`, { confirmed: true, cmntCn: 'e2e fixture' });
  const ctrtCd = (await getApplication(kind, id, 'prcs01')).srvcCtrtCd as string;
  await driveContractToProgress(kind, ctrtCd, endDate);
  return ctrtCd;
}

/** The consulting application → contract (PROGS, advance paid) of one member, for the client-side follow-up. */
export async function prepareConsultingContractOf(mbrNo: string): Promise<{ srvcAplyId: string; ctrtCd: string }> {
  await ensureFeeSchedule('consulting');
  const app = (await listApplications('consulting', 'prcs01', 'sttsCds=PRCS&sttsCds=DCIN&sttsCds=DCOK')).find(
    (r) => (r as ApplicationRow & { mbrNo?: string }).mbrNo === mbrNo,
  );
  if (!app) throw new Error(`No consulting application of ${mbrNo} in processing`);
  const id = app.srvcAplyId;
  if (app.srvcPrcsSttsCd !== 'DCOK') {
    await api('prcs01', 'POST', `/api/v1/service-applications/consulting/${encodeURIComponent(id)}/documents`, { documentsComplete: 'Y' });
  }
  await requestApproval('consulting', id);
  const session = (await getApplication('consulting', id, 'prcs01')).atrzHstryId as string;
  await api('appr01', 'POST', `/api/v1/approvals/${session}/approve`, { confirmed: true, cmntCn: 'e2e fixture' });
  const ctrtCd = (await getApplication('consulting', id, 'prcs01')).srvcCtrtCd as string;
  await driveContractToProgress('consulting', ctrtCd);
  await payOpenFees('consulting', ctrtCd);
  return { srvcAplyId: id, ctrtCd };
}

/** Client side (member, E2E_CLIENT_API_TARGET): a follow-up consultation request on a consulting application. */
export async function requestFollowUpAsMember(loginId: string, srvcAplyId: string, content: string): Promise<void> {
  const base = (process.env.E2E_CLIENT_API_TARGET ?? 'http://127.0.0.1:7100').replace(/\/+$/, '');
  const keyRes = (await (await fetch(`${base}/api/auth/public-key`)).json()) as Body<{ publicKey: string }>;
  const publicKey = await webcrypto.subtle.importKey('spki', Buffer.from(keyRes.data?.publicKey ?? '', 'base64'), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const password = Buffer.from(
    await webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new TextEncoder().encode(workflowPassword())),
  ).toString('base64');
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  const loginBody = (await loginRes.json()) as { accessToken?: string; data?: { accessToken?: string } };
  const token = loginBody.accessToken ?? loginBody.data?.accessToken;
  if (!token) throw new Error(`Client login of ${loginId} failed (HTTP ${loginRes.status})`);
  const res = await fetch(`${base}/api/mypage/contracts/${encodeURIComponent(srvcAplyId)}/additional-consultations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Follow-up request → ${res.status} ${await res.text()}`);
}
