export type TableInsertDraft = {
  rows: number;
  cols: number;
  borderStyle: string;
  borderWidth: number;
  borderColor: string;
  cellBackgroundColor: string;
  tableStyle: string;
};

export const DEFAULT_TABLE_INSERT_DRAFT: TableInsertDraft = {
  rows: 4,
  cols: 4,
  borderStyle: '2',
  borderWidth: 1,
  borderColor: '#c7c7c7',
  cellBackgroundColor: '#ffffff',
  tableStyle: '',
};

export const TABLE_BORDER_STYLE_OPTIONS = [
  { label: 'None', value: '1' },
  { label: 'Solid', value: '2' },
  { label: 'Double', value: '3' },
  { label: 'Dashed', value: '4' },
  { label: 'Dotted', value: '5' },
  { label: 'Groove', value: '6' },
  { label: 'Inset', value: '7' },
] as const;

export const TABLE_BORDER_WIDTH_OPTIONS = [
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
] as const;

export const TABLE_STYLE_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Style 1', value: '1' },
  { label: 'Style 2', value: '2' },
  { label: 'Style 3', value: '3' },
  { label: 'Style 4', value: '4' },
  { label: 'Style 5', value: '5' },
  { label: 'Style 6', value: '6' },
  { label: 'Style 7', value: '7' },
  { label: 'Style 8', value: '8' },
  { label: 'Style 9', value: '9' },
  { label: 'Style 10', value: '10' },
  { label: 'Style 11', value: '11' },
  { label: 'Style 12', value: '12' },
  { label: 'Style 13', value: '13' },
  { label: 'Style 14', value: '14' },
  { label: 'Style 15', value: '15' },
  { label: 'Style 16', value: '16' },
] as const;

export const TABLE_BACKGROUND_PRESET_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Pattern 1', value: '1' },
  { label: 'Pattern 2', value: '2' },
  { label: 'Pattern 3', value: '3' },
  { label: 'Pattern 4', value: '4' },
  { label: 'Pattern 5', value: '5' },
  { label: 'Pattern 6', value: '6' },
  { label: 'Pattern 7', value: '7' },
  { label: 'Pattern 8', value: '8' },
  { label: 'Pattern 9', value: '9' },
  { label: 'Pattern 10', value: '10' },
  { label: 'Pattern 11', value: '11' },
  { label: 'Pattern 12', value: '12' },
  { label: 'Pattern 13', value: '13' },
  { label: 'Pattern 14', value: '14' },
  { label: 'Pattern 15', value: '15' },
  { label: 'Pattern 16', value: '16' },
  { label: 'Pattern 17', value: '17' },
  { label: 'Pattern 18', value: '18' },
  { label: 'Pattern 19', value: '19' },
  { label: 'Pattern 20', value: '20' },
  { label: 'Pattern 21', value: '21' },
  { label: 'Pattern 22', value: '22' },
  { label: 'Pattern 23', value: '23' },
  { label: 'Pattern 24', value: '24' },
  { label: 'Pattern 25', value: '25' },
  { label: 'Pattern 26', value: '26' },
  { label: 'Pattern 27', value: '27' },
  { label: 'Pattern 28', value: '28' },
  { label: 'Pattern 29', value: '29' },
  { label: 'Pattern 30', value: '30' },
  { label: 'Pattern 31', value: '31' },
] as const;

export function clampTableDimension(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(20, Math.round(value)));
}
