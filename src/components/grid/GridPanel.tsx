import GridToolbar from '@/components/layout/GridToolbar';
import GridTable, { type GridTableProps } from './GridTable';

interface GridPanelProps<TData = any> extends GridTableProps<TData> {
  /** Total count display in toolbar (e.g. "전체 102건") */
  totalCount?: number;
  /** Count label in toolbar (default: "전체") */
  countLabel?: string;
  /** Left slot in toolbar */
  toolbarLeft?: React.ReactNode;
  /** Right action buttons in toolbar */
  actions?: React.ReactNode;
}

export default function GridPanel<TData = any>({
  totalCount,
  countLabel,
  toolbarLeft,
  actions,
  ...gridTableProps
}: GridPanelProps<TData>) {
  return (
    <>
      <GridToolbar
        totalCount={totalCount}
        countLabel={countLabel}
        left={toolbarLeft}
        actions={actions}
      />
      <GridTable {...gridTableProps} />
    </>
  );
}
