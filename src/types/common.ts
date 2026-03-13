export interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
}
