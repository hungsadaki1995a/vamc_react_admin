import { InputNumber, type InputNumberProps } from 'antd';
import styles from './spinbox.module.scss';

export type SpinboxVariant = 'arrows' | 'stepper';

export type SpinboxProps = Omit<InputNumberProps<number>, 'variant'> & {
  variant?: SpinboxVariant;
  inputVariant?: InputNumberProps<number>['variant'];
};

/** Numeric spinbox matching Figma spinbox type A (arrows) & type B (stepper) (4042:25800). */
export default function Spinbox({
  variant = 'arrows',
  inputVariant,
  mode,
  className,
  readOnly,
  ...props
}: SpinboxProps) {
  const resolvedMode = mode ?? (variant === 'stepper' ? 'spinner' : undefined);

  return (
    <InputNumber<number>
      {...props}
      variant={inputVariant}
      readOnly={readOnly}
      mode={resolvedMode}
      className={[
        styles.root,
        variant === 'stepper' ? styles.stepper : styles.arrows,
        readOnly ? styles.readonly : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
