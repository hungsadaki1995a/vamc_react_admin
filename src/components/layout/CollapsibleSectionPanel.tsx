import { useMemo, useState, type CSSProperties } from 'react';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import ActionButton from '@/components/common/ActionButton';
import { useLabelStore } from '@/stores/labelStore';
import './CollapsibleSectionPanel.css';

type TogglePosition = 'left' | 'right' | 'extra-end';

interface CollapsibleSectionPanelProps {
  title: React.ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  borderColor?: string;
  borderRadius?: string | number;
  headerBackground?: string;
  headerBorderColor?: string;
  headerPadding?: string;
  headerMinHeight?: string | number;
  bodyBackground?: string;
  bodyPadding?: string;
  titleBold?: boolean;
  titleColor?: string;
  titleFontSize?: string | number;
  titleFontWeight?: CSSProperties['fontWeight'];
  extra?: React.ReactNode;
  panelKey?: string;
  className?: string;
  headerClassName?: string;
  extraClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  toggleAriaLabel?: string;
  hideToggle?: boolean;
  togglePosition?: TogglePosition;
  children?: React.ReactNode;
}

export default function CollapsibleSectionPanel({
  title,
  expanded: controlledExpanded,
  defaultExpanded = true,
  onExpandedChange,
  borderColor,
  borderRadius,
  headerBackground,
  headerBorderColor,
  headerPadding,
  headerMinHeight,
  bodyBackground,
  bodyPadding,
  titleBold = true,
  titleColor,
  titleFontSize,
  titleFontWeight,
  extra,
  className,
  headerClassName,
  extraClassName,
  contentClassName,
  titleClassName,
  bodyClassName,
  toggleAriaLabel,
  hideToggle = false,
  togglePosition = 'extra-end',
  children,
}: CollapsibleSectionPanelProps) {
  const t = useLabelStore((s) => s.t);
  useLabelStore((s) => s.labelsVersion);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded ?? internalExpanded;
  const rootClassName = [
    'ds-collapsible-section',
    expanded ? 'ds-collapsible-section--expanded' : 'ds-collapsible-section--collapsed',
    className,
  ].filter(Boolean).join(' ');
  const rootStyle = useMemo(() => {
    const nextStyle: CSSProperties & Record<string, string> = {};
    const toCssLength = (value: string | number | undefined) => (
      typeof value === 'number' ? `${value}px` : value
    );

    if (borderColor) nextStyle['--ds-collapsible-border-color'] = borderColor;
    if (borderRadius !== undefined) nextStyle['--ds-collapsible-radius'] = toCssLength(borderRadius) ?? '';
    if (headerBackground) nextStyle['--ds-collapsible-header-bg'] = headerBackground;
    if (headerBorderColor) nextStyle['--ds-collapsible-header-border-color'] = headerBorderColor;
    if (headerPadding) nextStyle['--ds-collapsible-header-padding'] = headerPadding;
    if (headerMinHeight !== undefined) nextStyle['--ds-collapsible-header-min-height'] = toCssLength(headerMinHeight) ?? '';
    if (bodyBackground) nextStyle['--ds-collapsible-body-bg'] = bodyBackground;
    if (bodyPadding) nextStyle['--ds-collapsible-body-padding'] = bodyPadding;
    if (titleColor) nextStyle['--ds-collapsible-title-color'] = titleColor;
    if (titleFontSize !== undefined) nextStyle['--ds-collapsible-title-font-size'] = toCssLength(titleFontSize) ?? '';
    nextStyle['--ds-collapsible-title-font-weight'] = String(titleFontWeight ?? (titleBold ? 700 : 400));
    return Object.keys(nextStyle).length > 0 ? nextStyle : undefined;
  }, [
    bodyBackground,
    bodyPadding,
    borderColor,
    borderRadius,
    headerBackground,
    headerBorderColor,
    headerMinHeight,
    headerPadding,
    titleBold,
    titleColor,
    titleFontSize,
    titleFontWeight,
  ]);

  const setExpanded = (nextExpanded: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(nextExpanded);
    }
    onExpandedChange?.(nextExpanded);
  };

  const toggleExpanded = () => setExpanded(!expanded);

  const toggleButton = !hideToggle ? (
    <ActionButton
      action={expanded ? 'collapse' : 'expand'}
      size="small"
      type="text"
      className="ds-collapsible-section-toggle"
      aria-label={toggleAriaLabel ?? t('COMPONENT.VIEW.TEXT_toggleSection', '영역 접기/펼치기')}
      icon={expanded ? <UpOutlined /> : <DownOutlined />}
      onClick={(event) => {
        event.stopPropagation();
        toggleExpanded();
      }}
    />
  ) : null;

  return (
    <section
      className={rootClassName}
      style={rootStyle}
      data-expanded={expanded || undefined}
      data-collapsed={!expanded || undefined}
    >
      <div
        className="ds-collapsible-section-header"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <span className={`ds-collapsible-section-header-content${headerClassName ? ` ${headerClassName}` : ''}`}>
          {togglePosition === 'left' && toggleButton}
          <span className={`ds-collapsible-section-title${titleClassName ? ` ${titleClassName}` : ''}`}>
            {title}
          </span>
        </span>
        <div
          className={`ds-collapsible-section-extra${extraClassName ? ` ${extraClassName}` : ''}`}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {togglePosition === 'right' && toggleButton}
          {extra}
          {togglePosition === 'extra-end' && toggleButton}
        </div>
      </div>
      <div className="ds-collapsible-section-body-shell" aria-hidden={!expanded}>
        <div className={[bodyClassName, contentClassName, 'ds-collapsible-section-body'].filter(Boolean).join(' ')}>
          {children}
        </div>
      </div>
    </section>
  );
}
