import { create } from 'zustand';

/** `blocking` = writes / downloads (full-screen overlay); `background` = reads (top progress bar only). */
export type LoadingKind = 'blocking' | 'background';

interface LoadingState {
  blocking: number;
  background: number;
  increment: (kind: LoadingKind) => void;
  decrement: (kind: LoadingKind) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  blocking: 0,
  background: 0,
  increment: (kind) => set((s) => ({ [kind]: s[kind] + 1 }) as Pick<LoadingState, LoadingKind>),
  decrement: (kind) => set((s) => ({ [kind]: Math.max(0, s[kind] - 1) }) as Pick<LoadingState, LoadingKind>),
}));
