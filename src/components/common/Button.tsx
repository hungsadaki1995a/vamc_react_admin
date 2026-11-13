/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';
import refreshIconUrl from '@/assets/images/refresh.svg';
import searchIconUrl from '@/assets/images/search.svg';

/**
 * VNPL Admin Design System — Button Component (Figma node 4042:25854)
 *
 * Supports 4 design system patterns:
 * 1. Normal Button (`buttonType="normal"`):
 *    - `variant`: 'primary' | 'secondary' | 'quaternary'
 *    - `buttonStyle`: 'filled' | 'outlined'
 *    - `size`: 'default' (32px, B2/semibold) | 'small' (24px, B3/medium)
 * 2. Button with Icon (same as Button-Search, Figma 4197:7061):
 *    - Normal button with `leftIcon` and/or `rightIcon`, or `preset="search" | "reset"`
 * 3. Icon Button (`buttonType="icon"` or `<IconButton />`, Figma 4024:17090):
 *    - 32x32px square icon-only button with 16x16px icon
 * 4. Text Button (`buttonType="text"` or `<TextButton />`, Figma 4056:39115):
 *    - Inline text button (B1/medium, 13px/18px) with optional 14x14px icon (e.g. Fold)
 */

const buttonVariants = cva(
  [
    'group/button inline-flex shrink-0 items-center justify-center',
    'whitespace-nowrap select-none outline-none transition-colors cursor-pointer',
    'disabled:pointer-events-none disabled:cursor-not-allowed',
    'focus-visible:ring-2 focus-visible:ring-border-active/40',
  ].join(' '),
  {
    variants: {
      buttonType: {
        normal: 'gap-1',
        icon: [
          'p-0 rounded-[4px] border border-solid',
          'bg-bg-primary border-btn-line-quaternary text-btn-icon-primary',
          'hover:bg-btn-line-hover hover:border-btn-line-quaternary hover:text-btn-icon-primary-hover',
          'active:bg-btn-line-pressed active:border-btn-line-quaternary active:text-btn-icon-primary-pressed',
          'disabled:bg-btn-disabled-fill disabled:border-btn-disabled-border disabled:text-btn-icon-disabled',
        ].join(' '),
        text: [
          'gap-1 p-0 h-auto bg-transparent border-none rounded-none',
          'typo-b1-medium text-text-tertiary',
          'hover:text-text-secondary',
          'active:text-text-primary',
          'disabled:text-text-disabled',
        ].join(' '),
      },
      variant: {
        primary: '',
        secondary: '',
        quaternary: '',
      },
      buttonStyle: {
        filled: 'border border-solid border-transparent',
        outlined: 'border border-solid',
      },
      size: {
        default: '',
        small: '',
      },
    },
    compoundVariants: [
      // ── Normal Button Sizes ───────────────────────────────────────────
      {
        buttonType: 'normal',
        size: 'default',
        className: 'h-8 px-[10px] rounded-[4px] typo-b2-semibold',
      },
      {
        buttonType: 'normal',
        size: 'small',
        className: 'h-6 px-2 rounded-[3px] typo-b3-medium',
      },
      {
        buttonType: 'normal',
        size: 'small',
        buttonStyle: 'outlined',
        className: 'border-[0.75px]',
      },

      // ── Icon Button Sizes ─────────────────────────────────────────────
      {
        buttonType: 'icon',
        size: 'default',
        className: 'size-8',
      },
      {
        buttonType: 'icon',
        size: 'small',
        className: 'size-6 rounded-[3px] border-[0.75px]',
      },

      // ── Primary + Filled (Figma 4024:16586 / 16706 / 16709 / 16712) ──
      {
        buttonType: 'normal',
        variant: 'primary',
        buttonStyle: 'filled',
        className: [
          'bg-btn-primary text-text-white',
          'hover:bg-btn-primary-fill-hover',
          'active:bg-btn-primary-fill-pressed',
          'disabled:bg-btn-disabled-fill disabled:text-text-white disabled:border-transparent',
        ].join(' '),
      },

      // ── Primary + Outlined (Figma 4024:16893 / 16889 / 16885 / 16881) ─
      {
        buttonType: 'normal',
        variant: 'primary',
        buttonStyle: 'outlined',
        className: [
          'bg-bg-primary text-btn-primary border-btn-primary',
          'hover:bg-btn-line-hover hover:text-btn-primary-fill-hover hover:border-btn-primary-fill-hover',
          'active:bg-btn-line-pressed active:text-btn-primary-fill-pressed active:border-btn-primary-fill-pressed',
          'disabled:bg-btn-disabled-fill disabled:text-text-disabled disabled:border-btn-disabled-border',
        ].join(' '),
      },

      // ── Secondary + Filled (Figma 4024:16784 / 16788 / 16792 / 16796) ─
      {
        buttonType: 'normal',
        variant: 'secondary',
        buttonStyle: 'filled',
        className: [
          'bg-btn-secondary text-text-white',
          'hover:bg-btn-secondary-fill-hover',
          'active:bg-btn-secondary-fill-pressed',
          'disabled:bg-btn-disabled-fill disabled:text-text-white disabled:border-transparent',
        ].join(' '),
      },

      // ── Secondary + Outlined (Figma 4024:16942 / 16946 / 16950 / 16954)
      {
        buttonType: 'normal',
        variant: 'secondary',
        buttonStyle: 'outlined',
        className: [
          'bg-bg-primary text-btn-secondary border-btn-secondary',
          'hover:bg-btn-line-hover hover:text-btn-secondary-fill-hover hover:border-btn-secondary-fill-hover',
          'active:bg-btn-line-pressed active:text-btn-secondary-fill-pressed active:border-btn-secondary-fill-pressed',
          'disabled:bg-btn-disabled-fill disabled:text-text-disabled disabled:border-btn-disabled-border',
        ].join(' '),
      },

      // ── Quaternary + Filled (Figma 4024:16974 / 16978 / 16982 / 16986)
      {
        buttonType: 'normal',
        variant: 'quaternary',
        buttonStyle: 'filled',
        className: [
          'bg-btn-quaternary text-text-white',
          'hover:bg-btn-quaternary-fill-hover',
          'active:bg-btn-quaternary-fill-pressed',
          'disabled:bg-btn-disabled-fill disabled:text-text-white disabled:border-transparent',
        ].join(' '),
      },

      // ── Quaternary + Outlined (Figma 4024:16990..17002 & 4152:10431..10443)
      {
        buttonType: 'normal',
        variant: 'quaternary',
        buttonStyle: 'outlined',
        className: [
          'bg-bg-primary text-text-secondary border-btn-line-quaternary',
          'hover:bg-btn-line-hover hover:text-text-secondary hover:border-btn-line-quaternary',
          'active:bg-btn-line-pressed active:text-text-secondary active:border-btn-line-quaternary',
          'disabled:bg-btn-disabled-fill disabled:text-text-disabled disabled:border-btn-disabled-border',
        ].join(' '),
      },
    ],
    defaultVariants: {
      buttonType: 'normal',
      variant: 'primary',
      buttonStyle: 'filled',
      size: 'default',
    },
  },
);

export type ButtonType = NonNullable<VariantProps<typeof buttonVariants>['buttonType']>;
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonStyle = NonNullable<VariantProps<typeof buttonVariants>['buttonStyle']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
export type ButtonPreset = 'search' | 'reset';

const MULTI_COLOR_ICON_PATTERNS = ['excel-filled', 'status-', 'tree-folder-'];

function isMultiColorIconUrl(src: string): boolean {
  return MULTI_COLOR_ICON_PATTERNS.some((pattern) => src.includes(pattern));
}

interface ButtonIconSlotProps {
  icon: React.ReactNode | string;
  sizeClass: string;
  className?: string;
  preserveColor?: boolean;
}

function ButtonIconSlot({ icon, sizeClass, className, preserveColor }: ButtonIconSlotProps) {
  if (typeof icon === 'string') {
    if (preserveColor || isMultiColorIconUrl(icon)) {
      return (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className={cn('inline-block shrink-0 select-none pointer-events-none', sizeClass, className)}
        />
      );
    }

    return (
      <span
        aria-hidden="true"
        className={cn('inline-block shrink-0 pointer-events-none bg-current', sizeClass, className)}
        style={{
          WebkitMaskImage: `url("${icon}")`,
          maskImage: `url("${icon}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center pointer-events-none [&_svg]:size-full',
        sizeClass,
        className,
      )}
    >
      {icon}
    </span>
  );
}

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
    VariantProps<typeof buttonVariants> {
  /** Inline CSS style object */
  style?: React.CSSProperties;
  /** Alias for `buttonStyle` ('filled' | 'outlined') */
  appearance?: ButtonStyle;
  /** Preset configuration matching Figma Button-Search (`'search'` | `'reset'`) */
  preset?: ButtonPreset;
  /** Icon for `buttonType="icon"`, or shorthand for `leftIcon` on normal/text buttons */
  icon?: React.ReactNode | string;
  /** Left icon (ReactNode or imported SVG URL from `@/assets/images`) */
  leftIcon?: React.ReactNode | string;
  /** Right icon (ReactNode or imported SVG URL from `@/assets/images`) */
  rightIcon?: React.ReactNode | string;
  /** Keep original SVG colors instead of tinting with currentColor */
  preserveIconColor?: boolean;
  /** Render as child element via Radix Slot */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      buttonType,
      variant,
      buttonStyle,
      appearance,
      size = 'default',
      preset,
      icon,
      leftIcon,
      rightIcon,
      preserveIconColor = false,
      asChild = false,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) => {
    // Resolve preset defaults (Figma 4197:7061 Button-Search: Reset & Search)
    const resolvedButtonType: ButtonType = buttonType ?? 'normal';
    const resolvedVariant: ButtonVariant =
      variant ?? (preset === 'search' || preset === 'reset' ? 'primary' : 'primary');
    const resolvedButtonStyle: ButtonStyle =
      buttonStyle ??
      appearance ??
      (preset === 'reset' ? 'outlined' : preset === 'search' ? 'filled' : 'filled');
    const resolvedSize: ButtonSize = size ?? 'default';

    const resolvedLeftIcon =
      leftIcon ??
      (resolvedButtonType !== 'icon' ? icon : undefined) ??
      (preset === 'search' ? searchIconUrl : preset === 'reset' ? refreshIconUrl : undefined);

    const resolvedChildren =
      children ?? (preset === 'search' ? 'Search' : preset === 'reset' ? 'Reset' : undefined);

    // Icon sizing per Figma specs:
    // - normal default & icon default: 16x16 (size-4)
    // - normal small & icon small: 12x12 (size-3)
    // - text button: 14x14 (size-[14px])
    const iconSizeClass =
      resolvedButtonType === 'text'
        ? 'size-[14px]'
        : resolvedSize === 'small'
          ? 'size-3'
          : 'size-4';

    // In Figma, quaternary outlined default buttons & text buttons use `--color-btn-icon-primary` (#666699)
    // for their icon in default state and inherit disabled color when disabled.
    const iconColorClass =
      resolvedButtonType === 'text'
        ? 'text-btn-icon-primary group-hover/button:text-text-secondary group-active/button:text-text-primary group-disabled/button:text-text-disabled'
        : resolvedButtonType === 'normal' &&
            resolvedVariant === 'quaternary' &&
            resolvedButtonStyle === 'outlined'
          ? 'text-btn-icon-primary group-disabled/button:text-text-disabled'
          : undefined;

    const Comp = asChild ? Slot.Root : 'button';

    if (asChild) {
      return (
        <Comp
          ref={ref}
          data-slot="button"
          data-button-type={resolvedButtonType}
          data-variant={resolvedVariant}
          data-button-style={resolvedButtonStyle}
          data-size={resolvedSize}
          className={cn(
            buttonVariants({
              buttonType: resolvedButtonType,
              variant: resolvedVariant,
              buttonStyle: resolvedButtonStyle,
              size: resolvedSize,
              className,
            }),
          )}
          {...props}
        >
          {resolvedChildren}
        </Comp>
      );
    }

    const iconOnlyNode = icon ?? leftIcon ?? rightIcon;

    return (
      <Comp
        ref={ref}
        type={type}
        data-slot="button"
        data-button-type={resolvedButtonType}
        data-variant={resolvedVariant}
        data-button-style={resolvedButtonStyle}
        data-size={resolvedSize}
        className={cn(
          buttonVariants({
            buttonType: resolvedButtonType,
            variant: resolvedVariant,
            buttonStyle: resolvedButtonStyle,
            size: resolvedSize,
            className,
          }),
        )}
        {...props}
      >
        {resolvedButtonType === 'icon' ? (
          iconOnlyNode ? (
            <ButtonIconSlot
              icon={iconOnlyNode}
              sizeClass={iconSizeClass}
              preserveColor={preserveIconColor}
            />
          ) : (
            resolvedChildren
          )
        ) : (
          <>
            {resolvedLeftIcon && (
              <ButtonIconSlot
                icon={resolvedLeftIcon}
                sizeClass={iconSizeClass}
                className={iconColorClass}
                preserveColor={preserveIconColor}
              />
            )}
            {resolvedChildren != null && <span>{resolvedChildren}</span>}
            {rightIcon && (
              <ButtonIconSlot
                icon={rightIcon}
                sizeClass={iconSizeClass}
                className={iconColorClass}
                preserveColor={preserveIconColor}
              />
            )}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

/** Icon-only Button (Figma 4024:17090 "Button-icon") */
export type IconButtonProps = Omit<ButtonProps, 'buttonType'>;

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => (
  <Button ref={ref} buttonType="icon" {...props} />
));
IconButton.displayName = 'IconButton';

/** Text Button (Figma 4056:39115 "button-text", e.g. Fold) */
export type TextButtonProps = Omit<ButtonProps, 'buttonType'>;

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>((props, ref) => (
  <Button ref={ref} buttonType="text" {...props} />
));
TextButton.displayName = 'TextButton';

/** Search Button with Icon (Figma 4197:7061 "Button-Search" — Search) */
export type SearchButtonProps = Omit<ButtonProps, 'preset'>;

const SearchButton = React.forwardRef<HTMLButtonElement, SearchButtonProps>((props, ref) => (
  <Button ref={ref} preset="search" {...props} />
));
SearchButton.displayName = 'SearchButton';

/** Reset Button with Icon (Figma 4197:7061 "Button-Search" — Reset) */
export type ResetButtonProps = Omit<ButtonProps, 'preset'>;

const ResetButton = React.forwardRef<HTMLButtonElement, ResetButtonProps>((props, ref) => (
  <Button ref={ref} preset="reset" {...props} />
));
ResetButton.displayName = 'ResetButton';

export { Button, IconButton, TextButton, SearchButton, ResetButton, buttonVariants };
export default Button;

