import type { SelectProps } from 'antd';
import type { CodeDetail } from '@/api/common/code-domain-api';

export type ComcdSelectProps = Omit<SelectProps, 'options'> & {
  /** Code domain ID from T_CCO_COM_C (e.g. 'JBC_CD', 'GD_CD') */
  cdDmnId: string;
  /**
   * Prepend a blank option at the top of the list.
   * Pass the label to display (e.g. 'All', 'Select', '').
   * The option value is always ''.
   *
   * @example
   * <ComcdSelect cdDmnId="JBC_CD" prefixOption="All" />
   * <ComcdSelect cdDmnId="JBC_CD" prefixOption="Select" />
   * <ComcdSelect cdDmnId="JBC_CD" prefixOption="" />
   */
  prefixOption?: string;
  /**
   * Optional filter function for cascading (chained) selects.
   * Receives each CodeDetail item — return true to include, false to exclude.
   *
   * @example
   * // Show only codes whose parent equals selected value
   * <ComcdSelect cdDmnId="CHILD_CD" filterFn={(c) => c.bzLrgCzCd === parentValue} />
   */
  filterFn?: (item: CodeDetail) => boolean;
};
