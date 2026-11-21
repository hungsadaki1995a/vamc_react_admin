import { DatePicker, type DatePickerProps } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import styles from './app-date-picker.module.scss';

export type AppDatePickerProps = Omit<DatePickerProps, 'multiple' | 'onChange'> & {
  onChange?: (date: Dayjs | null, dateString: string | string[]) => void;
};
export type AppRangePickerProps = RangePickerProps;

/** Date picker matching Figma Date Pickers specs (4042:25814 & 4050:30148). */
function AppDatePicker({ className, onChange, ...props }: AppDatePickerProps) {
  return (
    <DatePicker
      {...(props as DatePickerProps)}
      onChange={onChange as DatePickerProps['onChange']}
      className={[styles.root, className].filter(Boolean).join(' ')}
    />
  );
}

/** Date range picker matching Figma Date Pickers specs (4042:25814 & 4050:30148). */
export function AppRangePicker({ className, ...props }: AppRangePickerProps) {
  return (
    <DatePicker.RangePicker
      {...props}
      className={[styles.root, styles.rangeRoot, className].filter(Boolean).join(' ')}
    />
  );
}

AppDatePicker.RangePicker = AppRangePicker;

export default AppDatePicker;
