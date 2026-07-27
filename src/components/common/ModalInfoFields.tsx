import type { CSSProperties, ReactNode } from 'react';
import './ModalInfoFields.css';

export interface ModalInfoFieldItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
  full?: boolean;
  wrap?: boolean;
  className?: string;
  valueClassName?: string;
}

interface ModalInfoFieldsProps {
  items: ModalInfoFieldItem[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  labelWidth?: number | string;
  variant?: 'field' | 'card';
  style?: CSSProperties;
}

type ModalInfoFieldsStyle = CSSProperties & {
  '--ds-modal-info-columns'?: number;
  '--ds-modal-info-label-width'?: string;
};

export default function ModalInfoFields({
  items,
  className,
  columns = 1,
  labelWidth = 120,
  variant = 'field',
  style,
}: ModalInfoFieldsProps) {
  const rootStyle: ModalInfoFieldsStyle = {
    '--ds-modal-info-columns': columns,
    '--ds-modal-info-label-width': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth,
    ...style,
  };

  return (
    <div
      className={[
        'ds-modal-info-fields',
        `ds-modal-info-fields--${variant}`,
        className,
      ].filter(Boolean).join(' ')}
      style={rootStyle}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={[
            'ds-modal-info-field',
            item.full ? 'ds-modal-info-field--full' : '',
            item.className,
          ].filter(Boolean).join(' ')}
        >
          <div className="ds-modal-info-field__label">{item.label}</div>
          <div
            className={[
              'ds-modal-info-field__value',
              item.wrap ? 'ds-modal-info-field__value--wrap' : '',
              item.valueClassName,
            ].filter(Boolean).join(' ')}
            title={typeof item.value === 'string' ? item.value : undefined}
          >
            <span className="ds-modal-info-field__value-text">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
