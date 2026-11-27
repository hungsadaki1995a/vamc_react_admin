import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppRadio from '@/components/inputs/AppRadio';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloUser, ZaloUserType } from '@/api/system/zalo-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import type { YesNo } from '@/config/sys-constants';
import { errorMessage, formatSysDateTime } from '@/utils/system-utils';
import ZaloLinkStateBadge from './ZaloLinkStateBadge';
import { accountText } from './zalo-user-constants';
import { useLinkZaloUser, useUnlinkZaloUser } from './use-zalo-users';
import styles from './zalo-user-management.module.scss';

// Zalo Users - detail popup (row click). Pending: link to an account (LINK_MTHD_CD MANUAL). Linked: [Unlink].

type FieldKey = 'userTypeCd' | 'userNo';

interface ZaloUserModalProps {
  user: ZaloUser;
  canWrite: boolean;
  onClose: () => void;
}

/** Read-only value box like the frame's grey inputs. */
function ReadOnly({ value }: { value?: string | null }) {
  return <TextInput value={value || '-'} readOnly className={styles.readOnly} />;
}

export default function ZaloUserModal({ user, canWrite, onClose }: ZaloUserModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const link = useLinkZaloUser();
  const unlink = useUnlinkZaloUser();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<{ userTypeCd: ZaloUserType; userNo: string }>({ userTypeCd: 'MBR', userNo: '' });
  const linked = user.linkStatus === 'LINKED';
  const canLink = canWrite && !linked;

  const yesNoAt = (yn?: YesNo, at?: string) => {
    if (!yn) return '-';
    const label = t(yn === 'Y' ? 'zalo.common.yes' : 'zalo.common.no');
    return yn === 'Y' && at ? `${label} (${formatSysDateTime(at)})` : label;
  };

  const handleLink = async () => {
    if (!checkRequired(values, ['userTypeCd', 'userNo'])) return;
    try {
      await link.mutateAsync({ zaloUserId: user.zaloUserId, request: { userTypeCd: values.userTypeCd, userNo: values.userNo.trim() } });
      toast.success(t('messages.zalo.linked'));
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        [ZALO_ERRORS.accountNotFound]: ['userNo', t('messages.zalo.accountNotFound')],
        [ZALO_ERRORS.accountAlreadyLinked]: ['userNo', t('messages.zalo.accountAlreadyLinked')],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const handleUnlink = () => {
    confirm({
      content: t('messages.zalo.confirmUnlink', { account: user.userNo ?? '-' }),
      okText: t('zalo.users.buttons.unlink'),
      danger: true,
      onOk: async () => {
        try {
          await unlink.mutateAsync(user.zaloUserId);
          toast.success(t('messages.zalo.unlinked'));
          onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  return (
    <SysFormModal
      open
      width={960}
      title={t('zalo.users.detail.title')}
      submitText={t('zalo.users.buttons.link')}
      onSubmit={canLink ? handleLink : undefined}
      submitting={link.isPending}
      onCancel={onClose}
      leftActions={
        canWrite &&
        linked && (
          <SysButton look="danger" loading={unlink.isPending} onClick={handleUnlink}>
            {t('zalo.users.buttons.unlink')}
          </SysButton>
        )
      }
    >
      <SysFieldGrid columns={2}>
        <SysField label={t('zalo.users.columns.zaloNm')}>
          <ReadOnly value={user.zaloNm} />
        </SysField>
        <SysField label={t('zalo.users.columns.telno')}>
          <ReadOnly value={user.telno} />
        </SysField>
        <SysField label={t('zalo.users.columns.status')}>
          <ZaloLinkStateBadge user={user} />
        </SysField>
        <SysField label={t('zalo.users.columns.following')}>
          <ReadOnly value={yesNoAt(user.flwYn, user.flwDt)} />
        </SysField>
        <SysField label={t('zalo.users.detail.shareAgree')}>
          <ReadOnly value={yesNoAt(user.shareAgreYn, user.shareAgreDt)} />
        </SysField>
        <SysField label={t('zalo.users.columns.lstItrctDt')}>
          <ReadOnly value={user.lstItrctDt ? formatSysDateTime(user.lstItrctDt) : undefined} />
        </SysField>
        {linked && (
          <>
            <SysField label={t('zalo.users.columns.account')}>
              <ReadOnly value={accountText(user)} />
            </SysField>
            <SysField label={t('zalo.users.columns.linkDt')}>
              <ReadOnly value={user.linkDt ? formatSysDateTime(user.linkDt) : undefined} />
            </SysField>
          </>
        )}
        {canLink && (
          <>
            <SysField label={t('zalo.users.link.userType')} required error={errors.userTypeCd}>
              <AppRadio.Group
                value={values.userTypeCd}
                options={[
                  { value: 'MBR', label: t('zalo.userTypes.MBR') },
                  { value: 'EMP', label: t('zalo.userTypes.EMP') },
                ]}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, userTypeCd: e.target.value as ZaloUserType }));
                  clearError('userTypeCd');
                }}
              />
            </SysField>
            <SysField label={t('zalo.users.link.userNo')} required error={errors.userNo}>
              <TextInput
                value={values.userNo}
                maxLength={10}
                placeholder={t('zalo.users.link.userNoPlaceholder')}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, userNo: e.target.value }));
                  clearError('userNo');
                }}
              />
            </SysField>
          </>
        )}
      </SysFieldGrid>
    </SysFormModal>
  );
}
