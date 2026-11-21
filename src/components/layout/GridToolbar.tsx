import { useTotalCountLabel } from '@/hooks/use-total-count-label';
import styles from './grid-toolbar.module.scss';

type GridToolbarProps = {
  /**
   * Grid section title. Use only when needed to identify a grid, such as in a split view.
   * Place it here instead of adding a separate title row — a separate div misaligns left/right toolbar heights.
   */
  title?: React.ReactNode;
  /** Total count display (e.g. "Total 102 items") */
  totalCount?: number;
  /**
   * Pass only when overriding the count prefix label (defaults to common label `COMPONENT.VIEW.TEXT_gridTotal`).
   * When provided, renders that text + number only.
   */
  countLabel?: string;
  /** Left additional elements */
  left?: React.ReactNode;
  /** Right action buttons */
  actions?: React.ReactNode;
};

export default function GridToolbar({ title, totalCount, countLabel, left, actions }: GridToolbarProps) {
  const { template } = useTotalCountLabel();

  // Split the template at {0} rather than using the formatted string so only the number can be styled bold.
  // e.g. "Total {0} items" → ['Total ', ' items']
  const [before, after = ''] = template.split('{0}');

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        {title !== undefined && <span className={styles.title}>{title}</span>}
        {totalCount !== undefined && (
          <span className={styles.count}>
            {countLabel !== undefined ? (
              <>{countLabel} <strong>{totalCount.toLocaleString()}</strong></>
            ) : (
              <>{before}<strong>{totalCount.toLocaleString()}</strong>{after}</>
            )}
          </span>
        )}
        {left}
      </div>
      <div className={styles.right}>
        {actions}
      </div>
    </div>
  );
}
