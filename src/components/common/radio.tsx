import { Radio as AntRadio, type RadioGroupProps, type RadioProps } from 'antd';
import './radio.css';

export type { RadioGroupProps, RadioProps };

function Radio({ className, ...props }: RadioProps) {
  const rootClassName = ['ds-radio', className].filter(Boolean).join(' ');
  return <AntRadio {...props} className={rootClassName} />;
}

function RadioGroup({ className, ...props }: RadioGroupProps) {
  const rootClassName = ['ds-radio-group', className].filter(Boolean).join(' ');
  return <AntRadio.Group {...props} className={rootClassName} />;
}

Radio.Group = RadioGroup;
Radio.Button = AntRadio.Button;

export default Radio;
