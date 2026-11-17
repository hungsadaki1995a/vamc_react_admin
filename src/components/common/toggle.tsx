import { Switch as AntSwitch, type SwitchProps } from 'antd';
import './toggle.css';

export type ToggleProps = SwitchProps;

export default function Toggle({ className, ...props }: ToggleProps) {
  const rootClassName = ['ds-toggle', className].filter(Boolean).join(' ');
  return <AntSwitch {...props} className={rootClassName} />;
}
