import { Radio, type RadioGroupProps, type RadioProps } from 'antd';
import styles from './app-radio.module.scss';

export type AppRadioProps = RadioProps;
export type AppRadioGroupProps = RadioGroupProps;

/** Radio button matching Figma Radio Button specs (4042:25800). */
function AppRadio({ className, ...props }: AppRadioProps) {
  return <Radio {...props} className={[styles.root, className].filter(Boolean).join(' ')} />;
}

function AppRadioGroup({ className, ...props }: AppRadioGroupProps) {
  return (
    <Radio.Group {...props} className={[styles.group, className].filter(Boolean).join(' ')} />
  );
}

AppRadio.Group = AppRadioGroup;
AppRadio.Button = Radio.Button;

export { AppRadioGroup };
export default AppRadio;
