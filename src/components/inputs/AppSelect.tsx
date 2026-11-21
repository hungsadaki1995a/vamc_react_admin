import { Select, type SelectProps } from 'antd';
import type { BaseOptionType, DefaultOptionType } from 'antd/es/select';
import styles from './app-select.module.scss';

export type AppSelectProps<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = SelectProps<ValueType, OptionType>;

/** Selectbox matching Figma Selectbox specs (4042:25800). */
export default function AppSelect<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>({ className, classNames, size, ...props }: AppSelectProps<ValueType, OptionType>) {
  return (
    <Select<ValueType, OptionType>
      {...props}
      size={size}
      className={[styles.root, size === 'small' ? styles.sizeSmall : '', className]
        .filter(Boolean)
        .join(' ')}
      classNames={{
        ...classNames,
        popup: {
          ...classNames?.popup,
          root: [styles.dropdown, classNames?.popup?.root].filter(Boolean).join(' '),
        },
      }}
    />
  );
}
