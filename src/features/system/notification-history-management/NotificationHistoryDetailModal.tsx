import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import TextInput from '@/components/inputs/TextInput';
import { NOTI_CHANNEL_LABELS, NOTI_RECIPIENT_LABELS } from '@/api/system/notification-api';
import { ResultBadge, SysNotAvailable } from '../_shared/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '../_shared/SysFormUi';
import { formatSysDateTime } from '../_shared/system-utils';
import { useNotificationHistory } from './use-notification-histories';
import styles from './notification-history-management.module.scss';

// Notification Send History - Detail popup (VPA090502P01), read only.
// Frame layout: Sent At | Send Result | Channel / Service | Code | Recipient Type / Recipient /
// Failure Reason (failed only) / Title / Content.

const PENDING_HISTORY_FIELDS_NOTE = (
  <SysNotAvailable>
    Code, Service and the recipient address wait for a schema change; Recipient shows the member / employee number.
  </SysNotAvailable>
);

/** Read-only value box like the frame's grey inputs. */
function ReadOnly({ value }: { value?: string | null }) {
  return <TextInput value={value || '-'} readOnly className={styles.readOnly} />;
}

export default function NotificationHistoryDetailModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const { data, isFetching, isError, error } = useNotificationHistory(logId);
  const failed = data?.sndngScsYn === 'N';

  return (
    <SysFormModal width={1200} open title="Notification Send Detail" onCancel={onClose} notice={PENDING_HISTORY_FIELDS_NOTE}>
      <LoadingSpinner spinning={isFetching}>
        {isError && <p className={styles.errorText}>{error.message}</p>}
        <SysFieldGrid columns={3}>
          <SysField label="Sent At">
            <ReadOnly value={data ? formatSysDateTime(data.notiSndngDt, { withSeconds: true }) : undefined} />
          </SysField>
          <SysField label="Send Result">
            <ResultBadge value={data?.sndngScsYn} />
          </SysField>
          <SysField label="Channel">
            <ReadOnly value={data ? (NOTI_CHANNEL_LABELS[data.notiMediaSe] ?? data.notiMediaSe) : undefined} />
          </SysField>
          <SysField label="Service">
            <ReadOnly />
          </SysField>
          <SysField label="Code">
            <ReadOnly />
          </SysField>
          <SysField label="Recipient Type">
            <ReadOnly value={data?.notiRcvrSeCd ? NOTI_RECIPIENT_LABELS[data.notiRcvrSeCd] : undefined} />
          </SysField>
          <SysField label="Recipient" span="full">
            <ReadOnly value={data?.notiRcvrId} />
          </SysField>
          {failed && (
            <SysField label="Failure Reason" span="full">
              <div className={`${styles.valueBox} ${styles.failText}`}>{data?.failRsn || '-'}</div>
            </SysField>
          )}
          <SysField label="Title" span="full">
            <ReadOnly value={data?.notiTtl} />
          </SysField>
          <SysField label="Content" span="full">
            {/* Plain text: the stored content may be HTML from the sender. Long content scrolls. */}
            <div className={`${styles.valueBox} ${styles.contentBox}`}>{data?.notiCn || '-'}</div>
          </SysField>
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
