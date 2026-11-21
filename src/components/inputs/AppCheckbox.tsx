import { Checkbox, type CheckboxProps } from 'antd';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
import styles from './app-checkbox.module.scss';

export type AppCheckboxProps = CheckboxProps;
export type AppCheckboxGroupProps<T = string | number> = CheckboxGroupProps<T>;

/** Checkbox matching Figma Check Button specs (4042:25800). */
function AppCheckbox({ className, ...props }: AppCheckboxProps) {
  return <Checkbox {...props} className={[styles.root, className].filter(Boolean).join(' ')} />;
}

function AppCheckboxGroup<T = string | number>({ className, ...props }: AppCheckboxGroupProps<T>) {
  return (
    <Checkbox.Group<T>
      {...props}
      className={[styles.group, className].filter(Boolean).join(' ')}
    />
  );
}

AppCheckbox.Group = AppCheckboxGroup;

export { AppCheckboxGroup };
export default AppCheckbox;
