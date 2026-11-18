import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { App, Button, Input } from 'antd';
import { PUBLIC_ROUTES } from '@/app/route-constants';
import styles from '../index.module.scss';

export interface FindIdResultProps {
  loginId: string;
}

/** Displays the confirmed masked login ID with navigation actions. */
export default function FindIdResult({ loginId }: FindIdResultProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="findId_result_loginId" className={styles.label}>
          {t('auth.login.loginIdLabel')}
        </label>
        <Input id="findId_result_loginId" readOnly value={loginId} className={styles.readonlyInput} />
      </div>

      <div className={styles.buttonGroup}>
        <Button
          type="primary"
          block
          className={styles.primaryBtn}
          onClick={() => navigate(PUBLIC_ROUTES.LOGIN, { replace: true })}
        >
          {t('auth.findId.backToLogin')}
        </Button>
        <Button
          type="default"
          block
          className={styles.secondaryBtn}
          onClick={() => message.info(t('auth.login.findNotReady'))}
        >
          {t('auth.login.findPassword')}
        </Button>
      </div>
    </div>
  );
}
