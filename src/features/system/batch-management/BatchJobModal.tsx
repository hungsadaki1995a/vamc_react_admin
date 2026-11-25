import { useMemo, useState } from 'react';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { BatchJobItem, BatchJobSaveRequest } from '@/api/system/batch-api';
import { USE_YN_RADIO_OPTIONS } from '@/config/sys-constants';
import type { YesNo } from '@/config/sys-constants';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { BATCH_MESSAGES, isValidCron, isValidJson, runErrorMessage } from './batch-utils';
import { useBatchRegistry, useCreateBatchJob, useExecuteBatchJob, useUpdateBatchJob } from './use-batch-jobs';
import styles from './batch-management.module.scss';

type FieldKey = 'btchJobNm' | 'btchGroup' | 'cronExpression' | 'jobParameters';

interface FormValues {
  btchJobNm: string;
  btchGroup: string;
  useYn: YesNo;
  cronExpression: string;
  jobExpln: string;
  jobParameters: string;
}

interface BatchJobModalProps {
  /** Edit mode when given, register mode otherwise. */
  job?: BatchJobItem;
  canWrite: boolean;
  onClose: () => void;
  onOpenHistory: (jobName: string) => void;
}

function toFormValues(job?: BatchJobItem): FormValues {
  return {
    btchJobNm: job?.btchJobNm ?? '',
    btchGroup: job?.btchGroup ?? '',
    useYn: job && !job.scheduleVtlzYn ? 'N' : 'Y',
    cronExpression: job?.cronExpression ?? '',
    jobExpln: job?.jobExpln ?? '',
    jobParameters: job?.jobParameters ?? '',
  };
}

/** Batch Management - Register/Edit (VPA090404P01). Mount with a `key` so the form starts from `job`. */
export default function BatchJobModal({ job, canWrite, onClose, onOpenHistory }: BatchJobModalProps) {
  const isEdit = job !== undefined;
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const [values, setValues] = useState<FormValues>(() => toFormValues(job));
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();

  const { data: registry = [] } = useBatchRegistry(!isEdit);
  const createJob = useCreateBatchJob();
  const updateJob = useUpdateBatchJob();
  const execute = useExecuteBatchJob();

  const jobOptions = useMemo(
    () => registry.map((item) => ({ value: item.jobName, label: item.jobName, group: item.jobGroup })),
    [registry],
  );
  const groupOptions = useMemo(() => {
    const groups = new Set(registry.map((item) => item.jobGroup));
    if (values.btchGroup) groups.add(values.btchGroup);
    return [...groups].sort().map((group) => ({ value: group, label: group }));
  }, [registry, values.btchGroup]);

  const change = (patch: Partial<FormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    (Object.keys(patch) as (keyof FormValues)[]).forEach((key) => {
      if (key !== 'useYn' && key !== 'jobExpln') clearError(key);
    });
  };

  const selectJob = (jobName: string) => {
    const group = registry.find((item) => item.jobName === jobName)?.jobGroup ?? '';
    change({ btchJobNm: jobName, btchGroup: group });
  };

  const submit = async () => {
    if (!checkRequired(values, ['btchJobNm', 'btchGroup', 'cronExpression'])) return;
    let valid = true;
    if (!isValidCron(values.cronExpression)) {
      setError('cronExpression', BATCH_MESSAGES.invalidCron);
      valid = false;
    }
    if (!isValidJson(values.jobParameters)) {
      setError('jobParameters', BATCH_MESSAGES.invalidJson);
      valid = false;
    }
    if (!valid) return;

    const body: BatchJobSaveRequest = {
      btchJobNm: values.btchJobNm,
      btchGroup: values.btchGroup,
      cronExpression: values.cronExpression.trim(),
      scheduleVtlzYn: values.useYn === 'Y',
      jobExpln: values.jobExpln.trim() || undefined,
      jobParameters: values.jobParameters.trim() || undefined,
    };
    try {
      if (isEdit) {
        await updateJob.mutateAsync({ jobName: job.btchJobNm, body });
        toast.success(SYS_MESSAGES.updated);
      } else {
        await createJob.mutateAsync(body);
        toast.success(SYS_MESSAGES.registered);
      }
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        BAT002: ['btchJobNm', BATCH_MESSAGES.duplicate],
        BAT004: ['cronExpression', BATCH_MESSAGES.invalidCron],
        BAT005: ['jobParameters', BATCH_MESSAGES.invalidJson],
        BAT008: ['btchJobNm', errorMessage(error)],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const runNow = () => {
    if (!job) return;
    confirm({
      content: BATCH_MESSAGES.confirmRunNow(job.btchJobNm),
      okText: SYS_DIALOG_LABELS.run,
      onOk: async () => {
        try {
          await execute.mutateAsync(job.btchJobNm);
          toast.success(BATCH_MESSAGES.runStarted(job.btchJobNm));
        } catch (error) {
          toast.error(runErrorMessage(error));
        }
      },
    });
  };

  // [Run Now] [Execution History] sit on the left of the footer, [Cancel] [Edit] on the right.
  const leftActions = isEdit && (
    <>
      {canWrite && (
        // Disabled by the saved Use value, not the edited one.
        <SysButton disabled={!job.scheduleVtlzYn} loading={execute.isPending} onClick={runNow}>
          Run Now
        </SysButton>
      )}
      <SysButton onClick={() => onOpenHistory(job.btchJobNm)}>Execution History</SysButton>
    </>
  );

  return (
    <SysFormModal
      open
      title={isEdit ? 'Edit Batch' : 'Register Batch'}
      submitText={isEdit ? 'Edit' : 'Register'}
      onSubmit={canWrite ? submit : undefined}
      submitting={createJob.isPending || updateJob.isPending}
      onCancel={onClose}
      leftActions={leftActions}
      width={1200}
      notice={BATCH_MESSAGES.notice}
    >
      <SysFieldGrid columns={2}>
        <SysField label="Job Name" required error={errors.btchJobNm}>
          {isEdit ? (
            <TextInput value={values.btchJobNm} disabled />
          ) : (
            <AppSelect
              showSearch
              placeholder="Select"
              value={values.btchJobNm || undefined}
              options={jobOptions}
              onChange={(v) => selectJob(String(v ?? ''))}
              className={styles.fullWidth}
            />
          )}
        </SysField>
        <SysField label="Group" required error={errors.btchGroup}>
          {/* Filled from the selected job (the server rejects a group that differs from the code: BAT008). */}
          <AppSelect
            placeholder="Select"
            value={values.btchGroup || undefined}
            options={groupOptions}
            disabled
            className={styles.fullWidth}
          />
        </SysField>
        <SysField label="Use" required>
          <AppRadio.Group
            options={USE_YN_RADIO_OPTIONS}
            value={values.useYn}
            disabled={!canWrite}
            onChange={(e) => change({ useYn: e.target.value as YesNo })}
          />
        </SysField>
        <SysField label="Cron" required error={errors.cronExpression}>
          <TextInput
            value={values.cronExpression}
            placeholder="e.g. 0 0 3 * * ?"
            maxLength={100}
            disabled={!canWrite}
            onChange={(e) => change({ cronExpression: e.target.value })}
          />
        </SysField>
        <SysField label="Description">
          <TextInput
            value={values.jobExpln}
            maxLength={500}
            disabled={!canWrite}
            onChange={(e) => change({ jobExpln: e.target.value })}
          />
        </SysField>
        <SysField label="Parameters" error={errors.jobParameters}>
          <TextInput
            value={values.jobParameters}
            placeholder='JSON format (e.g. {"days":30})'
            disabled={!canWrite}
            onChange={(e) => change({ jobParameters: e.target.value })}
            className={styles.code}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
