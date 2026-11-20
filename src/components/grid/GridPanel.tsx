import GridToolbar from '@/components/layout/GridToolbar';
import GridTable, { type GridTableProps } from './GridTable';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GridPanelProps<TData = any> extends GridTableProps<TData> {
  /** Grid title shown at the left of the toolbar (e.g. to identify each grid in a split view) */
  title?: React.ReactNode;
  /** Total count display in toolbar (e.g. "Total 102 items") */
  totalCount?: number;
  /** Count label in toolbar (default: "Total") */
  countLabel?: string;
  /** Left slot in toolbar */
  toolbarLeft?: React.ReactNode;
  /** Right action buttons in toolbar */
  actions?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GridPanel<TData = any>({
  title,
  totalCount,
  countLabel,
  toolbarLeft,
  actions,
  ...gridTableProps
}: GridPanelProps<TData>) {
  return (
    <>
      <GridToolbar
        title={title}
        totalCount={totalCount}
        countLabel={countLabel}
        left={toolbarLeft}
        actions={actions}
      />
      <GridTable {...gridTableProps} />
    </>
  );
}
