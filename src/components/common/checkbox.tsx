import { Checkbox as AntCheckbox, type CheckboxGroupProps, type CheckboxProps } from 'antd';
import './checkbox.css';

export type { CheckboxGroupProps, CheckboxProps };

function Checkbox({ className, ...props }: CheckboxProps) {
  const rootClassName = ['ds-checkbox', className].filter(Boolean).join(' ');
  return <AntCheckbox {...props} className={rootClassName} />;
}

function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  const rootClassName = ['ds-checkbox-group', className].filter(Boolean).join(' ');
  return <AntCheckbox.Group {...props} className={rootClassName} />;
}

Checkbox.Group = CheckboxGroup;

export default Checkbox;
