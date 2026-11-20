import { Spin } from 'antd';
import { NOTI_CHANNEL_LABELS, NOTI_RECIPIENT_LABELS } from '@/api/system/notification-api';
import { DateTimeText, ResultBadge } from '../_shared/sys-list-ui';
import { SysField, SysFieldGrid, SysFormModal, SysFormSection } from '../_shared/sys-form-ui';
import { useNotificationHistory } from './use-notification-histories';
import styles from './notification-history-management.module.scss';

// Notification Send History - Detail popup (VPA090502P01), read only.

const PENDING_HISTORY_FIELDS_NOTE =
  'Code, Service and the recipient address are not available yet (waiting for a schema change); Recipient shows the member / employee number.';

export default function NotificationHistoryDetailModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const { data, isFetching, isError, error } = useNotificationHistory(logId);
  const failed = data?.sndngScsYn === 'N';

  return (
    <SysFormModal open title="Notification Send Detail" onCancel={onClose} notice={PENDING_HISTORY_FIELDS_NOTE}>
      <Spin spinning={isFetching}>
        {isError && <p className={styles.errorText}>{error.message}</p>}
        <SysFormSection title="Send Information">
          <SysFieldGrid columns={2}>
            <SysField label="Sent At">
              <DateTimeText value={data?.notiSndngDt} seconds />
            </SysField>
            <SysField label="Send Result">
              <ResultBadge value={data?.sndngScsYn} />
            </SysField>
            <SysField label="Channel">{data ? (NOTI_CHANNEL_LABELS[data.notiMediaSe] ?? data.notiMediaSe) : '-'}</SysField>
            <SysField label="Service">-</SysField>
            <SysField label="Code">-</SysField>
            <SysField label="Recipient Type">
              {data?.notiRcvrSeCd ? NOTI_RECIPIENT_LABELS[data.notiRcvrSeCd] : '-'}
            </SysField>
            <SysField label="Recipient" span="full">
              {data?.notiRcvrId || '-'}
            </SysField>
            {failed && (
              <SysField label="Failure Reason" span="full">
                <span className={styles.preText}>{data?.failRsn || '-'}</span>
              </SysField>
            )}
          </SysFieldGrid>
        </SysFormSection>
        <SysFormSection title="Sent Content">
          <SysFieldGrid columns={1}>
            <SysField label="Title">{data?.notiTtl || '-'}</SysField>
            <SysField label="Content">
              {/* Shown as plain text: the stored content may be HTML from the sender. */}
              <div className={styles.contentBox}>{data?.notiCn || '-'}</div>
            </SysField>
          </SysFieldGrid>
        </SysFormSection>
      </Spin>
    </SysFormModal>
  );
}
