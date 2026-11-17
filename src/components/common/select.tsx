import { Select as AntSelect, type SelectProps as AntSelectProps } from 'antd';
import type { BaseOptionType, DefaultOptionType } from 'antd/es/select';
import './select.css';

export interface SelectProps<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> extends AntSelectProps<ValueType, OptionType> {
  /** Read-only display: keeps text readable while preventing edits and dropdown open */
  readOnly?: boolean;
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12.5762 5.57613C12.8105 5.34181 13.1895 5.34181 13.4238 5.57613C13.6582 5.81044 13.6582 6.18947 13.4238 6.42378L8.42384 11.4238C8.18953 11.6581 7.8105 11.6581 7.57619 11.4238L2.57619 6.42378C2.34187 6.18947 2.34187 5.81044 2.57619 5.57613C2.8105 5.34181 3.18953 5.34181 3.42384 5.57613L8.00002 10.1523L12.5762 5.57613Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Common Select component styled to match the VNPL Admin Design System (Figma 4:216).
 */
export default function Select<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>({
  readOnly = false,
  mode,
  className,
  classNames,
  suffixIcon,
  open,
  allowClear,
  showSearch,
  optionRender,
  tabIndex,
  ...props
}: SelectProps<ValueType, OptionType>) {
  const isMultiple = mode === 'multiple' || mode === 'tags';

  const rootClassName = [
    'ds-select',
    readOnly ? 'ds-select--readonly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const popupRootClassName = [
    'ds-select-dropdown',
    isMultiple ? 'ds-select-dropdown--multiple' : '',
    classNames?.popup?.root,
  ]
    .filter(Boolean)
    .join(' ');

  const mergedClassNames: SelectProps<ValueType, OptionType>['classNames'] = {
    ...classNames,
    popup: {
      ...classNames?.popup,
      root: popupRootClassName,
    },
  };

  const defaultOptionRender: SelectProps<ValueType, OptionType>['optionRender'] =
    isMultiple
      ? (option) => (
          <span className="ds-select-option-check">
            <span className="ds-select-checkbox" aria-hidden="true" />
            <span className="ds-select-option-label">{option.label}</span>
          </span>
        )
      : undefined;

  return (
    <AntSelect<ValueType, OptionType>
      {...props}
      mode={mode}
      className={rootClassName}
      classNames={mergedClassNames}
      suffixIcon={suffixIcon === undefined ? <ChevronDownIcon /> : suffixIcon}
      open={readOnly ? false : open}
      allowClear={readOnly ? false : allowClear}
      showSearch={readOnly ? false : showSearch}
      optionRender={optionRender ?? defaultOptionRender}
      tabIndex={readOnly ? -1 : tabIndex}
      aria-readonly={readOnly || undefined}
    />
  );
}
