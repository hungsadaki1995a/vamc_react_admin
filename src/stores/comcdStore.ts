import { create } from 'zustand';
import { mockLoadCodes } from '@/mock/services/comcdService';
import type { CodeDetail } from '@/api/common';

interface SelectOption {
  label: string;
  value: string;
}

interface ComcdStore {
  codes: Record<string, CodeDetail[]>;
  loading: boolean;
  loadCodes: () => Promise<void>;
  getOptions: (cdDmnId: string) => SelectOption[];
  getCodeName: (cdDmnId: string, cd: string) => string;
}

function groupByMain(list: CodeDetail[]): Record<string, CodeDetail[]> {
  const grouped: Record<string, CodeDetail[]> = {};
  for (const item of list) {
    if (!grouped[item.cdDmnId]) grouped[item.cdDmnId] = [];
    grouped[item.cdDmnId].push(item);
  }
  return grouped;
}

export const useComcdStore = create<ComcdStore>()((set, get) => ({
  codes: {},
  loading: false,

  loadCodes: async () => {
    const list = await mockLoadCodes();
    set({ codes: groupByMain(list) });
  },

  getOptions: (cdDmnId) =>
    (get().codes[cdDmnId] ?? []).map((c) => ({ label: c.cdNm, value: c.cd })),

  getCodeName: (cdDmnId, cd) =>
    get().codes[cdDmnId]?.find((c) => c.cd === cd)?.cdNm ?? cd,
}));
