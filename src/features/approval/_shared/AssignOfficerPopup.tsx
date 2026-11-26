import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Popup from '@/components/common/popup/Popup';
import { ApprovalSummary, EmployeePickField } from './ApprovalParts';
import type { ApprovalDetailRow } from './ApprovalParts';
import type { EmployeeSearchSource } from './EmployeeSearchPopup';
import styles from './approval-popups.module.scss';

// Officer selection (VPA0004P01 / VPA020500P01) shared by [Receipt] of an application (officer required), the
// officer change from the popup header (click on the officer name, like the member Staff in Charge) and, in later
// packages, contract officer / consultant assignment. Candidates: the employees holding the role of `stpNo` of
// `atrzProcCd`; [Search] opens the Employee Search popup.

export interface AssignOfficerPopupProps {
  atrzProcCd: string;
  stpNo: number;
  /** Session in progress: candidates follow its role snapshot. */
  atrzHstryId?: string;
  title: string;
  confirmText: string;
  details?: ApprovalDetailRow[];
  /** Current officer, not offered again. */
  currentEmpNo?: string;
  /** Other employees that cannot be picked (e.g. the officer when assigning a consultant). */
  excludeEmpNos?: string[];
  /** Overrides the step candidates (e.g. every employee for the consultant). */
  source?: EmployeeSearchSource;
  /** Field label, default "Officer in Charge". */
  label?: string;
  submitting: boolean;
  onSubmit: (empNo: string) => void;
  onClose: () => void;
}

export default function AssignOfficerPopup({
  atrzProcCd,
  stpNo,
  atrzHstryId,
  title,
  confirmText,
  details = [],
  currentEmpNo,
  excludeEmpNos = [],
  source,
  label = 'Officer in Charge',
  submitting,
  onSubmit,
  onClose,
}: AssignOfficerPopupProps) {
  const { t } = useTranslation();
  const [officer, setOfficer] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!officer) {
      setError(t('messages.trade.officerRequired'));
      return;
    }
    onSubmit(officer);
  };

  return (
    <Popup
      open
      width={600}
      title={title}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={handleConfirm}
      confirmText={confirmText}
      confirmLoading={submitting}
    >
      <ApprovalSummary rows={details} />
      <div className={styles.field}>
        <label className={`${styles.label} ${styles.required}`}>{label}</label>
        <EmployeePickField
          value={officer}
          onChange={(empNo) => {
            setOfficer(empNo);
            setError('');
          }}
          source={source ?? { type: 'candidates', atrzProcCd, stpNo, atrzHstryId }}
          excludeEmpNos={[...excludeEmpNos, ...(currentEmpNo ? [currentEmpNo] : [])]}
          placeholder={`Select the ${label.toLowerCase()}`}
          searchTitle={label === 'Officer in Charge' ? 'Officer Search' : `${label} Search`}
        />
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </Popup>
  );
}
