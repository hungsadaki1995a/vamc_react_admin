import { Children, type ReactNode } from 'react';
import DOMPurify from 'dompurify';
import RichTextEditor from '@/components/editors/RichTextEditor';
import ActionButton from './ActionButton';
import ActionButtonGroup from './ActionButtonGroup';
import './ModalDetailView.css';

export interface ModalDetailFooterActionState {
  canEdit?: boolean;
  canDelete?: boolean;
  isDeleting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface ModalDetailViewProps {
  children: ReactNode;
  className?: string;
}

interface ModalDetailHeaderProps {
  eyebrow?: ReactNode;
  recordId?: ReactNode;
  title: ReactNode;
  extra?: ReactNode;
}

interface ModalDetailMetaProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 'auto';
}

interface ModalDetailMetaRowProps {
  children: ReactNode;
  label: ReactNode;
  className?: string;
}

interface ModalDetailSectionProps {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}

interface ModalDetailHtmlContentProps {
  emptyText?: ReactNode;
  html?: string | null;
  maxHeight?: number;
  minHeight?: number;
}

interface ModalDetailFooterProps extends ModalDetailFooterActionState {
  cancelLabel: ReactNode;
  deleteLabel?: ReactNode;
  editLabel?: ReactNode;
  onCancel: () => void;
}

export function ModalDetailView({ children, className }: ModalDetailViewProps) {
  return (
    <div className={['ds-modal-detail-view', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function ModalDetailHeader({ eyebrow, recordId, title, extra }: ModalDetailHeaderProps) {
  return (
    <div className="ds-modal-detail-header">
      <div className="ds-modal-detail-header-main">
        {(eyebrow || recordId) && (
          <div className="ds-modal-detail-eyebrow">
            {eyebrow}
            {recordId && <span className="ds-modal-detail-record-id">{recordId}</span>}
          </div>
        )}
        <h3 className="ds-modal-detail-title">{title}</h3>
      </div>
      {extra && <div className="ds-modal-detail-header-extra">{extra}</div>}
    </div>
  );
}

export function ModalDetailMeta({ children, className, columns = 'auto' }: ModalDetailMetaProps) {
  const itemCount = Children.toArray(children).length;
  const useTwoColumns = columns === 2 || (columns === 'auto' && itemCount >= 3);
  const useThreeColumns = columns === 3;

  return (
    <div
      className={[
        'ds-modal-detail-meta',
        useTwoColumns && 'ds-modal-detail-meta--two-column',
        useThreeColumns && 'ds-modal-detail-meta--three-column',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function ModalDetailMetaRow({ children, label, className }: ModalDetailMetaRowProps) {
  return (
    <div className={['ds-modal-detail-meta-row', className].filter(Boolean).join(' ')}>
      <span className="ds-modal-detail-meta-label">{label}</span>
      <div className="ds-modal-detail-meta-values">{children}</div>
    </div>
  );
}

export function ModalDetailMetaValue({ children }: { children: ReactNode }) {
  return <span className="ds-modal-detail-meta-value">{children}</span>;
}

export function ModalDetailDivider() {
  return <div className="ds-modal-detail-divider" />;
}

export function ModalDetailSection({ children, title, className }: ModalDetailSectionProps) {
  return (
    <section className={['ds-modal-detail-section', className].filter(Boolean).join(' ')}>
      {title && <div className="ds-modal-detail-section-title">{title}</div>}
      {children}
    </section>
  );
}

export function ModalDetailHtmlContent({
  emptyText,
  html,
  maxHeight = 250,
  minHeight,
}: ModalDetailHtmlContentProps) {
  const safeHtml = DOMPurify.sanitize(html ?? '');

  if (!safeHtml.trim() && emptyText) {
    return (
      <div className="ds-modal-detail-html-content ds-modal-detail-html-content--empty" style={{ minHeight }}>
        {emptyText}
      </div>
    );
  }

  return (
    <RichTextEditor
      className="ds-modal-detail-html-content"
      value={safeHtml}
      readOnly
      minHeight={minHeight}
      maxHeight={maxHeight}
    />
  );
}

export function ModalDetailAuthorMeta({ children }: { children: ReactNode }) {
  return <div className="ds-modal-detail-author-meta">{children}</div>;
}

export function ModalDetailFooter({
  canDelete,
  canEdit,
  cancelLabel,
  deleteLabel,
  editLabel,
  isDeleting,
  onCancel,
  onDelete,
  onEdit,
}: ModalDetailFooterProps) {
  return (
    <div className="ds-modal-detail-footer">
      <ActionButtonGroup preset="modal" justify="start">
        {canDelete && onDelete && (
          <ActionButton action="deleteRow" loading={isDeleting} onClick={onDelete}>
            {deleteLabel}
          </ActionButton>
        )}
      </ActionButtonGroup>
      <ActionButtonGroup preset="modal" className="ds-modal-detail-footer-right">
        <ActionButton action="cancel" onClick={onCancel}>{cancelLabel}</ActionButton>
        {canEdit && onEdit && (
          <ActionButton action="saveChanges" onClick={onEdit}>
            {editLabel}
          </ActionButton>
        )}
      </ActionButtonGroup>
    </div>
  );
}
