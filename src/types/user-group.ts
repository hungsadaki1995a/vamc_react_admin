export type CodeNameItem = {
  id: string;
  name: string;
  useYn: 'Y' | 'N';
};

export type CodeNameCardLabels = {
  title: string;
  formTitle: string;
  id: string;
  name: string;
  use: string;
  idPlaceholder: string;
  namePlaceholder: string;
  reset: string;
  delete: string;
  save: string;
  /** Shown instead of the list while the parent selection is missing. */
  emptyHint?: string;
};
