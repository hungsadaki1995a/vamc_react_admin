import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Spin } from 'antd';
import AuthHeader from '@/components/auth/auth-header';
import ContentTabs, { type ContentTabItem } from '@/components/common/content-tabs/content-tabs';
import { PUBLIC_ROUTES } from '@/app/route-constants';
import vamcLogoLogin from '@/assets/vamc-logo-login.png';
import EmailVerificationForm from './components/email-verification-form';
import PasswordResetForm from './components/password-reset-form';
import ZaloVerificationForm, { type ZaloVerificationResult } from './components/zalo-verification-form';
import { useVerifyResetTokenQuery } from './hooks/use-find-password';
import styles from '../find-id-page/index.module.scss';

type VerificationTab = 'email' | 'zalo';

/** Find Password page with Email/Zalo verification and Password Reset step. */
export default function FindPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlToken = searchParams.get('token')?.trim() || null;

  const [activeTab, setActiveTab] = useState<VerificationTab>('email');
  const [zaloVerified, setZaloVerified] = useState<ZaloVerificationResult | null>(null);
  const [expiredError, setExpiredError] = useState(false);

  const verifyQuery = useVerifyResetTokenQuery(urlToken);

  const tabItems: ContentTabItem<VerificationTab>[] = [
    { key: 'email', label: t('auth.findPassword.emailTab') },
    { key: 'zalo', label: t('auth.findPassword.zaloTab') },
  ];

  const isUrlTokenVerified = Boolean(urlToken) && verifyQuery.isSuccess && Boolean(verifyQuery.data?.loginId);
  const activeToken = isUrlTokenVerified ? urlToken : (zaloVerified?.token ?? null);
  const maskedLoginId = isUrlTokenVerified
    ? (verifyQuery.data?.loginId ?? '')
    : (zaloVerified?.maskedLoginId ?? '');
  const isResetView = Boolean(activeToken);

  const verifyErrorMsg =
    urlToken && verifyQuery.isError
      ? verifyQuery.error.errorCode === 'RCV003'
        ? t('auth.findPassword.linkExpired')
        : verifyQuery.error.userMessage
      : null;

  const errorAlertMsg = expiredError ? t('auth.findPassword.linkExpired') : verifyErrorMsg;

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

          {urlToken && verifyQuery.isLoading ? (
            <div className={styles.confirmResult}>
              <Spin />
            </div>
          ) : isResetView && activeToken ? (
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
                  if (urlToken) {
                    setSearchParams({}, { replace: true });
                  }
                  setActiveTab(key);
                }}
                ariaLabel={t('auth.findPassword.title')}
                fullWidth
              />

              {errorAlertMsg && <Alert type="error" showIcon message={errorAlertMsg} />}

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
