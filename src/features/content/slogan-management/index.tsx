import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import TextArea from '@/components/inputs/TextArea';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { SloganSetting } from '@/api/contents/site-display-api';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useCurrentSlogan, useSaveSlogan } from './use-slogans';
import styles from './slogan-management.module.scss';

// Slogan Management (VPA07060301), menu A07060300: the user home hero text.
// Design: Slogan (VN)* / (EN)* textareas, max 100 characters and 2 lines each, counter, [Save] (applied at once).

const TITLE = 'Slogan Management';
const BREADCRUMB = ['Content Management', 'Site Display Management', TITLE];

const SLOGAN_MAX = 100;
const SLOGAN_MAX_LINES = 2;

type FieldKey = 'sloganVi' | 'sloganEn';

const LABELS: Record<FieldKey, string> = { sloganVi: 'Slogan (VN)', sloganEn: 'Slogan (EN)' };

/** Keeps at most two lines (Enter starts the second line, a third one is dropped). */
const limitLines = (value: string) => value.split('\n').slice(0, SLOGAN_MAX_LINES).join('\n');

export default function SloganManagement() {
  const { t } = useTranslation();
  const { data, isFetching, isError } = useCurrentSlogan();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <SloganForm key={data.sloganId ?? 'new'} slogan={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.content.slogan.loadFailed') : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function SloganForm({ slogan }: { slogan: SloganSetting }) {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveSlogan();
  const { errors, setError, clearError, clearAll, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<Record<FieldKey, string>>({
    sloganVi: slogan.sloganVi ?? '',
    sloganEn: slogan.sloganEn ?? '',
  });

  const submit = async () => {
    clearAll();
    const empty = (Object.keys(LABELS) as FieldKey[]).filter((key) => !values[key].trim());
    empty.forEach((key) => setError(key, t('messages.sys.fieldRequired', { label: LABELS[key] })));
    if (empty.length > 0) return;
    try {
      await save.mutateAsync({ sloganVi: values.sloganVi, sloganEn: values.sloganEn });
      toast.success(SYS_MESSAGES.saved);
    } catch (e) {
      if (!applyApiError(e)) toast.error(errorMessage(e));
    }
  };

  const textField = (key: FieldKey) => (
    <SysField label={LABELS[key]} required error={errors[key]}>
      <div className={styles.textBox}>
        <TextArea
          aria-label={LABELS[key]}
          rows={SLOGAN_MAX_LINES + 1}
          value={values[key]}
          maxLength={SLOGAN_MAX}
          disabled={!canWrite}
          status={errors[key] ? 'error' : undefined}
          onChange={(e) => {
            const value = limitLines(e.target.value);
            setValues((prev) => ({ ...prev, [key]: value }));
            clearError(key);
          }}
        />
        <span className={styles.counter}>
          <strong>{values[key].length}</strong> / {SLOGAN_MAX} characters
        </span>
      </div>
    </SysField>
  );

  return (
    <>
      <form noValidate onSubmit={(e) => e.preventDefault()}>
        <SysFieldGrid columns={1}>
          {textField('sloganVi')}
          {textField('sloganEn')}
        </SysFieldGrid>
      </form>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton look="primary" loading={save.isPending} onClick={submit}>
            Save
          </SysButton>
        </div>
      )}
    </>
  );
}
