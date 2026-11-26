import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppSelect from '@/components/inputs/AppSelect';
import { useNotify } from '@/hooks/use-notify';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloUser } from '@/api/system/zalo-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import { sentMessage } from '../_shared/zalo-messages';
import { useActiveZaloTemplates, useSendZaloUserTestMessage } from './use-zalo-users';
import styles from './zalo-user-management.module.scss';

// Zalo Users - [Send Test Message]: one template in use, sent to this user with the sample data (type TEST,
// sender = signed-in employee; sending limits and a channel stop apply).

/** Errors that block the sending: shown as a dialog so the rule code stays readable. */
const BLOCKING_ERRORS: string[] = [ZALO_ERRORS.channelStopped, ZALO_ERRORS.limitExceeded];

interface ZaloTestMessageModalProps {
  user: ZaloUser;
  onClose: () => void;
}

export default function ZaloTestMessageModal({ user, onClose }: ZaloTestMessageModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { alert } = useSysDialogs();
  const { data: templates, isFetching } = useActiveZaloTemplates();
  const send = useSendZaloUserTestMessage();
  const [tplCd, setTplCd] = useState<string | undefined>();
  const [error, setError] = useState<string>();

  const options = (templates?.content ?? []).map((tpl) => ({ value: tpl.tplCd, label: `${tpl.tplCd} · ${tpl.tplNm}` }));

  const handleSubmit = async () => {
    if (!tplCd) {
      setError(SYS_MESSAGES.required);
      return;
    }
    try {
      const response = await send.mutateAsync({ zaloUserId: user.zaloUserId, tplCd });
      toast.success(sentMessage(response.data));
      onClose();
    } catch (failure) {
      const code = apiErrorCode(failure);
      if (code && BLOCKING_ERRORS.includes(code)) alert(errorMessage(failure));
      else toast.error(errorMessage(failure));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={t('zalo.users.testMessage.title')}
      submitText={t('zalo.common.send')}
      onSubmit={() => void handleSubmit()}
      submitting={send.isPending}
      onCancel={onClose}
      notice={t('zalo.users.testMessage.notice')}
    >
      <SysFieldGrid columns={1} labelWidth={140}>
        <SysField label={t('zalo.users.columns.zaloNm')}>{user.zaloNm || '-'}</SysField>
        <SysField label={t('zalo.users.testMessage.template')} required error={error}>
          <AppSelect<string>
            className={styles.fullWidth}
            value={tplCd}
            options={options}
            loading={isFetching}
            placeholder={t('zalo.users.testMessage.templatePlaceholder')}
            aria-label={t('zalo.users.testMessage.template')}
            onChange={(value) => {
              setTplCd(value);
              setError(undefined);
            }}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
