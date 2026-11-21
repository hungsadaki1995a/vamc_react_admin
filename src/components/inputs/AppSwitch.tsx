import { Switch, type SwitchProps } from 'antd';
import styles from './app-switch.module.scss';

export type AppSwitchProps = SwitchProps;

/** Toggle switch matching Figma Toggle Button specs (4042:25800). */
export default function AppSwitch({ className, ...props }: AppSwitchProps) {
  return <Switch {...props} className={[styles.root, className].filter(Boolean).join(' ')} />;
}
