import type { ReactNode } from 'react';
import { Button, Modal } from 'antd';
import styles from './sys-ui.module.scss';

// Register / edit popup and label-value field grid of the v0.8 design.
//
// <SysFormModal open title="Register Form" submitText="Register" onSubmit={save} onCancel={close}>
//   <SysFieldGrid columns={3}>
//     <SysField label="Form No." required error={errors.formNo}><Input … /></SysField>
//     <SysField label="Form Name" required span="full">…</SysField>
//   </SysFieldGrid>
// </SysFormModal>

interface SysFormModalProps {
  open: boolean;
  /** Heading, e.g. "Register Form" / "Edit Form"; also shown small in the top bar. */
  title: string;
  children: ReactNode;
  onCancel: () => void;
  /** Omit for a read-only popup — the footer then shows only [Close]. */
  onSubmit?: () => void;
  /** "Register" / "Edit" (design wording). */
  submitText?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  /** Buttons placed before [Cancel], e.g. [Delete], [Reset Password], [Run Now], [Execution History]. */
  extraActions?: ReactNode;
  /** Fixed guide text above the footer (e.g. Batch "Use and Cron changes are applied …"). */
  notice?: ReactNode;
  width?: number;
}

export function SysFormModal({
  open,
  title,
  children,
  onCancel,
  onSubmit,
  submitText = 'Save',
  submitting = false,
  submitDisabled = false,
  extraActions,
  notice,
  width = 960,
}: SysFormModalProps) {
  const footer = (
    <div className={styles.modalFooter}>
      {extraActions}
      {onSubmit ? (
        <>
          <Button color="primary" variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={submitting} disabled={submitDisabled} onClick={onSubmit}>
            {submitText}
          </Button>
        </>
      ) : (
        <Button type="primary" onClick={onCancel}>
          Close
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      title={<span className={styles.modalBarTitle}>{title}</span>}
      onCancel={onCancel}
      footer={footer}
      width={width}
      centered
      destroyOnHidden
      mask={{ closable: false }}
      className={styles.modal}
    >
      <h2 className={styles.modalHeading}>{title}</h2>
      {children}
      {notice && <p className={styles.modalNotice}>{notice}</p>}
    </Modal>
  );
}

/** Bordered label | value grid; `columns` = label-value pairs per row. */
export function SysFieldGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  return (
    <div className={styles.fieldGrid} data-cols={columns}>
      {children}
    </div>
  );
}

interface SysFieldProps {
  label: ReactNode;
  required?: boolean;
  /** E0x message shown under the control with a red border. */
  error?: string;
  /** Pairs the field spans (2, 3) or `full` = rest of the row. */
  span?: 1 | 2 | 3 | 'full';
  /** Grey hint under the control (format examples, policy notes). */
  hint?: ReactNode;
  children: ReactNode;
}

export function SysField({ label, required, error, span = 1, hint, children }: SysFieldProps) {
  return (
    <>
      <div className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.requiredMark}>*</span>}
      </div>
      <div className={styles.fieldValue} data-span={span} data-error={error ? true : undefined}>
        <div className={styles.fieldControl}>{children}</div>
        {hint && <div className={styles.fieldHint}>{hint}</div>}
        {error && <div className={styles.fieldError}>{error}</div>}
      </div>
    </>
  );
}

/** Titled block inside a popup or detail panel (e.g. "Send Information", "Job Information"). */
export function SysFormSection({ title, children, actions }: { title: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className={styles.formSection}>
      <div className={styles.formSectionHeader}>
        <h3 className={styles.formSectionTitle}>{title}</h3>
        {actions && <div className={styles.sectionActions}>{actions}</div>}
      </div>
      {children}
    </section>
  );
}
