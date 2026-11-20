import { useState } from 'react';
import { DatePicker, Input, Upload } from 'antd';
import type { UploadFile } from 'antd';
import type { Dayjs } from 'dayjs';
import { UploadOutlined } from '@ant-design/icons';
import { FEE_SCHEDULE_API_AVAILABLE } from '@/api/system/fee-api';
import { SysButton, SysNotAvailable } from '../_shared/sys-list-ui';
import { SysField, SysFieldGrid, SysFormModal } from '../_shared/sys-form-ui';
import { SYS_DATE_FORMAT } from '../_shared/sys-constants';
import styles from './fee-management.module.scss';

// Fee Management - Fee Schedule popup (VPA090103P02): one shared record shown at the bottom of the
// user Fee Guide (VPW03020601). No API yet (waits for a schema change), so [Edit] stays disabled.

interface FeeScheduleState {
  effectiveDate: Dayjs | null;
  basis: string;
  notes: string;
  files: UploadFile[];
}

const NOT_AVAILABLE = (
  <SysNotAvailable>Saving the fee schedule waits for a schema change (Basis and fee schedule storage).</SysNotAvailable>
);

export default function FeeScheduleModal({ canWrite, onClose }: { canWrite: boolean; onClose: () => void }) {
  const [values, setValues] = useState<FeeScheduleState>({ effectiveDate: null, basis: '', notes: '', files: [] });
  const patch = (value: Partial<FeeScheduleState>) => setValues((prev) => ({ ...prev, ...value }));

  return (
    <SysFormModal
      open
      title="Fee Schedule"
      submitText="Edit"
      // TODO(api): wire GET / PUT /platform/fees/schedule once FEE_SCHEDULE_API_AVAILABLE is true.
      onSubmit={canWrite ? () => undefined : undefined}
      submitDisabled={!FEE_SCHEDULE_API_AVAILABLE}
      onCancel={onClose}
      notice={FEE_SCHEDULE_API_AVAILABLE ? undefined : NOT_AVAILABLE}
      width={760}
    >
      <SysFieldGrid columns={1}>
        <SysField label="Effective Date" required>
          <DatePicker
            className={styles.fullWidth}
            value={values.effectiveDate}
            format={SYS_DATE_FORMAT}
            placeholder="DD-MM-YYYY"
            onChange={(effectiveDate) => patch({ effectiveDate })}
          />
        </SysField>
        <SysField label="Basis">
          <Input
            value={values.basis}
            maxLength={500}
            placeholder="e.g. decision number and date"
            onChange={(e) => patch({ basis: e.target.value })}
          />
        </SysField>
        <SysField label="Notes">
          <Input.TextArea rows={8} value={values.notes} maxLength={1000} onChange={(e) => patch({ notes: e.target.value })} />
        </SysField>
        {/* In the spec text (pdf, optional) but not drawn in the frame. */}
        <SysField label="Fee Schedule File" hint="PDF only.">
          <Upload
            className={styles.upload}
            accept=".pdf,application/pdf"
            maxCount={1}
            fileList={values.files}
            beforeUpload={() => false}
            onChange={({ fileList }) => patch({ files: fileList })}
          >
            <SysButton icon={<UploadOutlined />}>Select File</SysButton>
          </Upload>
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
