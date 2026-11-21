import { useRef, useState, type ReactNode } from 'react';
import { Input, Tooltip, type InputProps, type InputRef } from 'antd';
import styles from './text-input.module.scss';

export type TextInputVariant = 'default' | 'search' | 'password' | 'sum' | 'grid';

export type TextInputProps = Omit<InputProps, 'variant'> & {
  variant?: TextInputVariant;
  inputVariant?: InputProps['variant'];
  onSearch?: (value: string) => void;
  enterButton?: ReactNode;
  visibilityToggle?: boolean;
  iconRender?: (visible: boolean) => ReactNode;
};

/**
 * Text input matching Figma input_text / input_Sum / input_Search / input_Password / input_Grid (4042:25794).
 * Includes automatic overflow tooltip when the displayed text is truncated.
 */
export default function TextInput({
  variant = 'default',
  inputVariant,
  value,
  readOnly,
  size,
  className,
  onMouseEnter,
  onMouseLeave,
  onSearch,
  enterButton,
  visibilityToggle,
  iconRender,
  ...props
}: TextInputProps) {
  const inputRef = useRef<InputRef>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>();

  const handleMouseEnter = (e: React.MouseEvent<HTMLInputElement>) => {
    const el = inputRef.current?.input;
    if (el && typeof value === 'string' && el.scrollWidth > el.offsetWidth) {
      setTooltipTitle(value);
    } else {
      setTooltipTitle(undefined);
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLInputElement>) => {
    setTooltipTitle(undefined);
    onMouseLeave?.(e);
  };

  const resolvedSize = size ?? (variant === 'grid' ? 'small' : undefined);

  const rootClassName = [
    styles.root,
    readOnly ? styles.readonly : '',
    variant === 'sum' ? styles.variantSum : '',
    variant === 'grid' || resolvedSize === 'small' ? styles.sizeSmall : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (variant === 'password') {
    return (
      <Input.Password
        ref={inputRef}
        variant={inputVariant}
        value={value}
        readOnly={readOnly}
        size={resolvedSize}
        visibilityToggle={visibilityToggle}
        iconRender={iconRender}
        className={rootClassName}
        {...props}
      />
    );
  }

  if (variant === 'search') {
    return (
      <Input.Search
        ref={inputRef}
        variant={inputVariant}
        value={value}
        readOnly={readOnly}
        size={resolvedSize}
        onSearch={onSearch}
        enterButton={enterButton}
        className={rootClassName}
        {...props}
      />
    );
  }

  return (
    <Tooltip title={tooltipTitle} placement="topLeft" mouseEnterDelay={0.4}>
      <Input
        ref={inputRef}
        variant={inputVariant}
        value={value}
        readOnly={readOnly}
        size={resolvedSize}
        className={rootClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </Tooltip>
  );
}
