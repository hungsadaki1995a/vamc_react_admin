import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Spin } from 'antd';
import AuthHeader from '@/components/auth/auth-header';
import ContentTabs, { type ContentTabItem } from '@/components/common/content-tabs/content-tabs';
import { PUBLIC_ROUTES } from '@/app/route-constants';
import vamcLogoLogin from '@/assets/vamc-logo-login.png';
import EmailVerificationForm from './components/email-verification-form';
import FindIdResult from './components/find-id-result';
import ZaloVerificationForm from './components/zalo-verification-form';
import { useConfirmFindIdQuery } from './hooks/use-find-id';
import styles from './index.module.scss';

type VerificationTab = 'email' | 'zalo';

export default function FindIdPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || null;

  const [activeTab, setActiveTab] = useState<VerificationTab>('email');
  const [zaloConfirmedLoginId, setZaloConfirmedLoginId] = useState<string | null>(null);
  const confirmQuery = useConfirmFindIdQuery(token);

  const tabItems: ContentTabItem<VerificationTab>[] = [
    { key: 'email', label: t('auth.findId.emailTab') },
    { key: 'zalo', label: t('auth.findId.zaloTab') },
  ];

  const isEmailResultView = activeTab === 'email' && Boolean(token) && !confirmQuery.isLoading && !confirmQuery.isError;
  const isZaloResultView = activeTab === 'zalo' && zaloConfirmedLoginId !== null;
  const isResultView = isEmailResultView || isZaloResultView;

  const renderEmailTabContent = () => {
    if (!token) {
      return <EmailVerificationForm />;
    }

    if (confirmQuery.isLoading) {
      return (
        <div className={styles.confirmResult}>
          <Spin />
        </div>
      );
    }

    if (confirmQuery.isError) {
      return (
        <div className={styles.confirmResult}>
          <Alert type="error" showIcon message={confirmQuery.error.userMessage} style={{ width: '100%' }} />
          <Button
            type="primary"
            block
            className={styles.primaryBtn}
            onClick={() => setSearchParams({}, { replace: true })}
          >
            {t('auth.findId.confirm')}
          </Button>
        </div>
      );
    }

    return <FindIdResult loginId={confirmQuery.data?.loginId ?? ''} />;
  };

  const renderZaloTabContent = () => {
    if (zaloConfirmedLoginId !== null) {
      return <FindIdResult loginId={zaloConfirmedLoginId} />;
    }

    return <ZaloVerificationForm onConfirmSuccess={setZaloConfirmedLoginId} />;
  };

  return (
    <div className={styles.container}>
      <AuthHeader />

      <main className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <img src={vamcLogoLogin} alt="VAMC" className={styles.logo} />
            <h1 className={styles.title}>{t('auth.findId.title')}</h1>
          </div>

          <ContentTabs
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
            ariaLabel={t('auth.findId.title')}
            fullWidth
          />

          {activeTab === 'email' ? renderEmailTabContent() : renderZaloTabContent()}

          {!isResultView && (
            <div className={styles.links}>
              <button type="button" className={styles.linkBtn} onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}>
                {t('auth.findId.backToLogin')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
