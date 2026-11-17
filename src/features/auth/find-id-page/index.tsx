import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, Select, Dropdown, App } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { findId } from '@/api/generated/sdk.gen';
import { ApiError } from '@/lib/api/error';
import { useLocaleStore, type LocaleKey } from '@/stores/locale-store';
import { getLocaleShortLabel } from '@/utils/locale-storage';
import vamcLogoLogin from '@/assets/vamc_logo_login-28c7ab.png';
import styles from './index.module.css';

type VerificationTab = 'email' | 'zalo';

interface EmailFormValues {
  name: string;
  email: string;
}

interface ZaloFormValues {
  name: string;
  countryCode: string;
  phoneNumber: string;
  code: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_SECONDS = 180;

const COUNTRY_CODE_OPTIONS = [
  { value: '+84', label: '+84' },
  { value: '+82', label: '+82' },
  { value: '+1', label: '+1' },
];

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function FindIdPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { locale, setLocale } = useLocaleStore();

  const [activeTab, setActiveTab] = useState<VerificationTab>('email');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);
  const [zaloSendLoading, setZaloSendLoading] = useState(false);
  const [zaloErrorMsg, setZaloErrorMsg] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS);

  const emailForm = useForm<EmailFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', email: '' },
  });

  const zaloForm = useForm<ZaloFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', countryCode: '+84', phoneNumber: '', code: '' },
  });

  const [emailName, emailAddr] = useWatch({ control: emailForm.control, name: ['name', 'email'] });
  const isEmailSubmitDisabled = !emailName?.trim() || !emailAddr?.trim();

  const [zaloName, zaloPhone] = useWatch({ control: zaloForm.control, name: ['name', 'phoneNumber'] });
  const isZaloSendDisabled = !zaloName?.trim() || !zaloPhone?.trim();

  useEffect(() => {
    if (!codeSent || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeSent, secondsLeft]);

  const languageMenuItems: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
          <span>English</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>Eng</span>
        </div>
      ),
      icon: locale === 'en' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
    },
    {
      key: 'ko',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
          <span>한국어</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>Kor</span>
        </div>
      ),
      icon: locale === 'ko' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
    },
    {
      key: 'vn',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
          <span>Tiếng Việt</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>Vie</span>
        </div>
      ),
      icon: locale === 'vn' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
    },
  ];

  const handleSendEmail = async (values: EmailFormValues) => {
    setEmailLoading(true);
    setEmailErrorMsg(null);
    try {
      await findId({
        body: {
          channel: 'EMAIL',
          fullName: values.name.trim(),
          email: values.email.trim(),
          urlCallback: `${window.location.origin}${window.location.pathname}`,
        },
        throwOnError: true,
      });
      message.success(t('auth.findId.emailSentMsg'));
    } catch (err) {
      const apiErr = ApiError.from(err);
      setEmailErrorMsg(apiErr.statusCode === 404 ? t('auth.findId.noAccountMatch') : apiErr.userMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendZaloCode = async () => {
    const valid = await zaloForm.trigger(['name', 'phoneNumber']);
    if (!valid) return;
    const { name, countryCode, phoneNumber } = zaloForm.getValues();
    setZaloSendLoading(true);
    setZaloErrorMsg(null);
    try {
      await findId({
        body: {
          channel: 'ZALO',
          fullName: name.trim(),
          phone: `${countryCode}${phoneNumber.replace(/\s+/g, '')}`,
          urlCallback: `${window.location.origin}${window.location.pathname}`,
        },
        throwOnError: true,
      });
      setCodeSent(true);
      setCodeVerified(false);
      setSecondsLeft(CODE_TTL_SECONDS);
      message.success(t('auth.findId.codeSentMsg'));
    } catch (err) {
      const apiErr = ApiError.from(err);
      setZaloErrorMsg(apiErr.statusCode === 404 ? t('auth.findId.noAccountMatch') : apiErr.userMessage);
    } finally {
      setZaloSendLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const valid = await zaloForm.trigger('code');
    if (!valid) return;
    setCodeVerified(true);
    message.success(t('auth.findId.codeVerifiedMsg'));
  };

  const handleZaloConfirm = () => {
    if (!codeVerified) {
      message.warning(t('auth.findId.verifyFirstMsg'));
      return;
    }
    message.success(t('auth.findId.confirmSuccessMsg'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.langSelector}>
        <Dropdown
          menu={{
            items: languageMenuItems,
            selectedKeys: [locale],
            onClick: ({ key }) => setLocale(key as LocaleKey),
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', userSelect: 'none' }}>
            <GlobalOutlined style={{ fontSize: 13, color: 'var(--text-secondary, #666)' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
              {getLocaleShortLabel(locale)}
            </span>
            <DownOutlined style={{ fontSize: 9, opacity: 0.65, color: 'var(--text-tertiary, #999)' }} />
          </div>
        </Dropdown>
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <img src={vamcLogoLogin} alt="VAMC" className={styles.logo} />
          <h1 className={styles.title}>{t('auth.findId.title')}</h1>
        </div>

        <div className={styles.tabs} role="tablist" aria-label={t('auth.findId.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'email'}
            className={`${styles.tabBtn} ${activeTab === 'email' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('email')}
          >
            {t('auth.findId.emailTab')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'zalo'}
            className={`${styles.tabBtn} ${activeTab === 'zalo' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('zalo')}
          >
            {t('auth.findId.zaloTab')}
          </button>
        </div>

        {activeTab === 'email' ? (
          <Form
            key={`email-${locale}`}
            onFinish={emailForm.handleSubmit(handleSendEmail)}
            autoComplete="off"
            layout="vertical"
            className={styles.form}
          >
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="findId_email_name" className={styles.label}>
                  {t('auth.findId.nameLabel')}
                </label>
                <Controller
                  name="name"
                  control={emailForm.control}
                  rules={{ required: t('auth.findId.nameRequired') }}
                  render={({ field, fieldState }) => (
                    <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                      <Input
                        {...field}
                        id="findId_email_name"
                        placeholder={t('auth.findId.namePlaceholder')}
                        className={styles.input}
                        onChange={(e) => {
                          if (emailErrorMsg) setEmailErrorMsg(null);
                          field.onChange(e);
                        }}
                      />
                    </Form.Item>
                  )}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="findId_email" className={styles.label}>
                  {t('auth.findId.emailLabel')}
                </label>
                <Controller
                  name="email"
                  control={emailForm.control}
                  rules={{
                    required: t('auth.findId.emailRequired'),
                    validate: (v) => EMAIL_REGEX.test(v.trim()) || t('auth.findId.emailInvalid'),
                  }}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      validateStatus={fieldState.error || emailErrorMsg ? 'error' : ''}
                      help={fieldState.error?.message || emailErrorMsg}
                    >
                      <Input
                        {...field}
                        id="findId_email"
                        type="email"
                        placeholder={t('auth.findId.emailPlaceholder')}
                        className={styles.input}
                        onChange={(e) => {
                          if (emailErrorMsg) setEmailErrorMsg(null);
                          field.onChange(e);
                        }}
                      />
                    </Form.Item>
                  )}
                />
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={emailLoading}
              disabled={isEmailSubmitDisabled}
              className={styles.primaryBtn}
            >
              {t('auth.findId.sendEmail')}
            </Button>
          </Form>
        ) : (
          <Form
            key={`zalo-${locale}`}
            onFinish={zaloForm.handleSubmit(handleZaloConfirm)}
            autoComplete="off"
            layout="vertical"
            className={styles.form}
          >
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="findId_zalo_name" className={styles.label}>
                  {t('auth.findId.nameLabel')}
                </label>
                <Controller
                  name="name"
                  control={zaloForm.control}
                  rules={{ required: t('auth.findId.nameRequired') }}
                  render={({ field, fieldState }) => (
                    <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                      <Input
                        {...field}
                        id="findId_zalo_name"
                        placeholder={t('auth.findId.namePlaceholder')}
                        className={styles.input}
                        onChange={(e) => {
                          if (zaloErrorMsg) setZaloErrorMsg(null);
                          field.onChange(e);
                        }}
                      />
                    </Form.Item>
                  )}
                />
              </div>

              <div className={styles.verifySection}>
                <div className={styles.field}>
                  <label htmlFor="findId_phone" className={styles.label}>
                    {t('auth.findId.phoneLabel')}
                  </label>
                  <div className={styles.phoneRow}>
                    <Controller
                      name="countryCode"
                      control={zaloForm.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={COUNTRY_CODE_OPTIONS}
                          className={styles.countrySelect}
                          suffixIcon={<DownOutlined style={{ fontSize: 11, color: '#545c6d' }} />}
                        />
                      )}
                    />
                    <div className={styles.phoneInputWrap}>
                      <Controller
                        name="phoneNumber"
                        control={zaloForm.control}
                        rules={{ required: t('auth.findId.phoneRequired') }}
                        render={({ field, fieldState }) => (
                          <Form.Item
                            validateStatus={fieldState.error || zaloErrorMsg ? 'error' : ''}
                            help={fieldState.error?.message || zaloErrorMsg}
                          >
                            <Input
                              {...field}
                              id="findId_phone"
                              placeholder={t('auth.findId.phonePlaceholder')}
                              className={styles.input}
                              onChange={(e) => {
                                if (zaloErrorMsg) setZaloErrorMsg(null);
                                field.onChange(e);
                              }}
                            />
                          </Form.Item>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {codeSent && (
                  <>
                    <Button
                      type="default"
                      block
                      loading={zaloSendLoading}
                      disabled={secondsLeft > 0}
                      onClick={handleSendZaloCode}
                      className={secondsLeft > 0 ? styles.sentDisabledBtn : styles.primaryBtn}
                    >
                      {t('auth.findId.sendCode')}
                    </Button>

                    <div className={styles.codeRow}>
                      <div className={styles.codeInputWrap}>
                        <Controller
                          name="code"
                          control={zaloForm.control}
                          rules={{ required: t('auth.findId.codeRequired') }}
                          render={({ field, fieldState }) => (
                            <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                              <Input
                                {...field}
                                id="findId_code"
                                placeholder={t('auth.findId.codePlaceholder')}
                                className={styles.codeInput}
                              />
                            </Form.Item>
                          )}
                        />
                        <span className={styles.timer}>{formatCountdown(secondsLeft)}</span>
                      </div>

                      <Button
                        type="default"
                        onClick={handleVerifyCode}
                        className={styles.verifyBtn}
                      >
                        {t('auth.findId.verify')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!codeSent ? (
              <Button
                type="primary"
                block
                loading={zaloSendLoading}
                disabled={isZaloSendDisabled}
                onClick={handleSendZaloCode}
                className={styles.primaryBtn}
              >
                {t('auth.findId.sendCode')}
              </Button>
            ) : (
              <Button type="primary" htmlType="submit" block className={styles.primaryBtn}>
                {t('auth.findId.confirm')}
              </Button>
            )}
          </Form>
        )}
      </div>
    </div>
  );
}
