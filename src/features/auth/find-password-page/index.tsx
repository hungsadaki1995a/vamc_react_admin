import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from 'antd';
import AuthHeader from '@/components/auth/auth-header';
import ContentTabs, { type ContentTabItem } from '@/components/common/content-tabs/content-tabs';
import { PUBLIC_ROUTES } from '@/app/route-constants';
import vamcLogoLogin from '@/assets/vamc-logo-login.png';
import EmailVerificationForm from './components/email-verification-form';
import PasswordResetForm from './components/password-reset-form';
import ZaloVerificationForm, { type ZaloVerificationResult } from './components/zalo-verification-form';
import styles from '../find-id-page/index.module.scss';

type VerificationTab = 'email' | 'zalo';

/** Find Password page with Email/Zalo verification and Password Reset step. */
export default function FindPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlToken = searchParams.get('token')?.trim() || null;
  const urlLoginId = searchParams.get('loginId')?.trim() || searchParams.get('email')?.trim() || '';

  const [activeTab, setActiveTab] = useState<VerificationTab>('email');
  const [zaloVerified, setZaloVerified] = useState<ZaloVerificationResult | null>(null);
  const [expiredError, setExpiredError] = useState(false);

  const tabItems: ContentTabItem<VerificationTab>[] = [
    { key: 'email', label: t('auth.findPassword.emailTab') },
    { key: 'zalo', label: t('auth.findPassword.zaloTab') },
  ];

  const activeToken = urlToken ?? zaloVerified?.token ?? null;
  const maskedLoginId = urlToken ? urlLoginId : (zaloVerified?.maskedLoginId ?? '');
  const isResetView = Boolean(activeToken);

  const handleTokenExpired = () => {
    setExpiredError(true);
    setZaloVerified(null);
    if (urlToken) {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className={styles.container}>
      <AuthHeader />

      <main className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <img src={vamcLogoLogin} alt="VAMC" className={styles.logo} />
            <h1 className={styles.title}>
              {isResetView ? t('auth.findPassword.resetTitle') : t('auth.findPassword.title')}
            </h1>
            {isResetView && <p className={styles.subtitle}>{t('auth.findPassword.resetSubtitle')}</p>}
          </div>

          {isResetView && activeToken ? (
            <PasswordResetForm
              token={activeToken}
              maskedLoginId={maskedLoginId}
              onTokenExpired={handleTokenExpired}
            />
          ) : (
            <>
              <ContentTabs
                items={tabItems}
                activeKey={activeTab}
                onChange={(key) => {
                  setExpiredError(false);
                  setActiveTab(key);
                }}
                ariaLabel={t('auth.findPassword.title')}
                fullWidth
              />

              {expiredError && (
                <Alert type="error" showIcon message={t('auth.findPassword.linkExpired')} />
              )}

              {activeTab === 'email' ? (
                <EmailVerificationForm />
              ) : (
                <ZaloVerificationForm onConfirmSuccess={setZaloVerified} />
              )}

              <div className={styles.links}>
                <button type="button" className={styles.linkBtn} onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}>
                  {t('auth.findPassword.backToLogin')}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
