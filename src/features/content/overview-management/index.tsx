import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { AboutOverview } from '@/api/contents/about-page-api';
import { SysButton, SysPage, SysTitleBar } from '@/features/system/_shared/SysListUi';
import { SysField, SysFieldGrid } from '@/features/system/_shared/SysFormUi';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import RichTextEditor from '../_shared/RichTextEditor';
import { useAboutOverview, useSaveAboutOverview } from './use-overview';
import styles from './overview-management.module.scss';

// Overview Management (VPA07100401): body of user About > About VAMC > Overview (VPW03010201).
// Saved content applies to the user screen immediately; Body (EN) falls back to Body (VN) there.

const TITLE = 'Overview Management';
const BREADCRUMB = ['Content Management', 'About VAMC Management', TITLE];

export default function OverviewManagement() {
  const { data, isFetching, isError } = useAboutOverview();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <OverviewForm key={data.pstNo ?? 'new'} overview={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? 'The overview could not be loaded.' : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function OverviewForm({ overview }: { overview: AboutOverview }) {
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveAboutOverview();
  const { errors, setError, clearError, applyApiError } = useFieldErrors<'bodyVn' | 'bodyEn'>();
  const [bodyVn, setBodyVn] = useState(overview.bodyVn ?? '');
  const [bodyEn, setBodyEn] = useState(overview.bodyEn ?? '');

  const submit = async () => {
    // E01 under the field
    if (!bodyVn.trim()) {
      setError('bodyVn', 'Body (VN) is required.');
      return;
    }
    try {
      await save.mutateAsync({ bodyVn, bodyEn: bodyEn || undefined });
      toast.success(SYS_MESSAGES.saved);
    } catch (error) {
      if (!applyApiError(error)) toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <form className={styles.form} noValidate onSubmit={(e) => e.preventDefault()}>
        <SysFieldGrid columns={1}>
          <SysField label="Body (VN)" required error={errors.bodyVn}>
            <RichTextEditor
              ariaLabel="Body (VN)"
              value={bodyVn}
              disabled={!canWrite}
              invalid={!!errors.bodyVn}
              onChange={(html) => {
                setBodyVn(html);
                clearError('bodyVn');
              }}
            />
          </SysField>
          <SysField label="Body (EN)" error={errors.bodyEn}>
            <RichTextEditor ariaLabel="Body (EN)" value={bodyEn} disabled={!canWrite} onChange={setBodyEn} />
          </SysField>
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
