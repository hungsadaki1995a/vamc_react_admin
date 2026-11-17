import { DatePicker } from 'antd';
import type { DatePickerProps, RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

/** DatePicker with project-wide default format (YYYY-MM-DD). */
function DateField(props: DatePickerProps) {
  return <DatePicker format="YYYY-MM-DD" {...props} />;
}

/** RangePicker with project-wide default format (YYYY-MM-DD). */
function DateRangeField(props: RangePickerProps) {
  return <RangePicker format="YYYY-MM-DD" {...props} />;
}

DateField.RangePicker = DateRangeField;

export default DateField;
