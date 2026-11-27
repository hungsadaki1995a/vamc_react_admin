import type { ReactNode } from 'react';
import { create } from 'zustand';
import type { PopupStatus } from '@/components/common/popup/Popup';

export type DialogType = PopupStatus;

export interface DialogEntry {
  id: number;
  type: DialogType;
  title?: ReactNode;
  content?: ReactNode;
  icon?: ReactNode;
  width?: number | string;
  okText?: ReactNode;
  cancelText?: ReactNode;
  okCancel?: boolean;
  okDisabled?: boolean;
  maskClosable?: boolean;
  onOk?: () => unknown | Promise<unknown>;
  onCancel?: () => unknown;
}

interface DialogState {
  dialogs: DialogEntry[];
  open: (entry: Omit<DialogEntry, 'id'>) => number;
  update: (id: number, patch: Partial<Omit<DialogEntry, 'id'>>) => void;
  close: (id: number) => void;
}

let nextDialogId = 1;

export const useDialogStore = create<DialogState>((set) => ({
  dialogs: [],
  open: (entry) => {
    const id = nextDialogId++;
    set((state) => ({ dialogs: [...state.dialogs, { ...entry, id }] }));
    return id;
  },
  update: (id, patch) =>
    set((state) => ({
      dialogs: state.dialogs.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),
  close: (id) =>
    set((state) => ({
      dialogs: state.dialogs.filter((item) => item.id !== id),
    })),
}));
