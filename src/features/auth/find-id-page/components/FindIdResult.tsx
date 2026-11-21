import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ActionButton from '@/components/common/actions/ActionButton';
import TextInput from '@/components/inputs/TextInput';
import { PUBLIC_ROUTES } from '@/app/route-constants';
import type { FindIdResultProps } from '@/types/auth';
import styles from '../index.module.scss';

/** Displays the confirmed masked login ID with navigation actions. */
export default function FindIdResult({ loginId }: FindIdResultProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="findId_result_loginId" className={styles.label}>
          {t('auth.login.loginIdLabel')}
        </label>
        <TextInput id="findId_result_loginId" readOnly value={loginId} className={styles.readonlyInput} />
      </div>

      <div className={styles.buttonGroup}>
        <ActionButton
          intent="primary"
          appearance="filled"
          block
          className={styles.primaryBtn}
          onClick={() => navigate(PUBLIC_ROUTES.LOGIN, { replace: true })}
        >
          {t('auth.findId.backToLogin')}
        </ActionButton>
        <ActionButton
          intent="quaternary"
          appearance="outlined"
          block
          className={styles.secondaryBtn}
          onClick={() => navigate(PUBLIC_ROUTES.FIND_PASSWORD)}
        >
          {t('auth.login.findPassword')}
        </ActionButton>
      </div>
    </div>
  );
}
