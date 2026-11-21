import { Table, type TableProps } from 'antd';
import type { AnyObject } from 'antd/es/_util/type';
import styles from './data-table.module.scss';

export type DataTableProps<RecordType extends AnyObject = AnyObject> = TableProps<RecordType>;

/** Ant Design Table styled to match Figma Table tokens (4133:6096). */
export default function DataTable<RecordType extends AnyObject = AnyObject>({
  className,
  pagination = false,
  size = 'small',
  ...props
}: DataTableProps<RecordType>) {
  return (
    <Table<RecordType>
      {...props}
      size={size}
      pagination={pagination}
      className={[styles.root, className].filter(Boolean).join(' ')}
    />
  );
}
