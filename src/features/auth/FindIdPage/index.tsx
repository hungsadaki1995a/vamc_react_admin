import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Form, Input, Button, Select, Dropdown, App } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';
import { getLocaleShortLabel } from '@/utils/localeStorage';
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

const FIND_ID_I18N: Record<
  LocaleKey,
  {
    title: string;
    emailTab: string;
    zaloTab: string;
    nameLabel: string;
    namePlaceholder: string;
    nameRequired: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailRequired: string;
    emailInvalid: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneRequired: string;
    codePlaceholder: string;
    codeRequired: string;
    sendEmail: string;
    sendCode: string;
    verify: string;
    confirm: string;
    emailSentMsg: string;
    codeSentMsg: string;
    codeVerifiedMsg: string;
    confirmSuccessMsg: string;
    verifyFirstMsg: string;
  }
> = {
  en: {
    title: 'Find Login ID',
    emailTab: 'Email Verification',
    zaloTab: 'Zalo Verification',
    nameLabel: 'Name',
    namePlaceholder: 'Enter name',
    nameRequired: 'Please enter your name.',
    emailLabel: 'Email',
    emailPlaceholder: 'example@email.com',
    emailRequired: 'Please enter your email.',
    emailInvalid: 'Please enter a valid email address.',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '090 123 5678',
    phoneRequired: 'Please enter your phone number.',
    codePlaceholder: 'Enter code',
    codeRequired: 'Please enter the verification code.',
    sendEmail: 'Send Verification Email',
    sendCode: 'Send Verification Code',
    verify: 'Verify',
    confirm: 'Confirm',
    emailSentMsg: 'Verification email has been sent.',
    codeSentMsg: 'Verification code has been sent via Zalo.',
    codeVerifiedMsg: 'Verification code verified.',
    confirmSuccessMsg: 'Your login ID information has been sent.',
    verifyFirstMsg: 'Please verify your code first.',
  },
  ko: {
    title: '아이디 찾기',
    emailTab: '이메일 인증',
    zaloTab: 'Zalo 인증',
    nameLabel: '이름',
    namePlaceholder: '이름을 입력해 주세요',
    nameRequired: '이름을 입력해 주세요.',
    emailLabel: '이메일',
    emailPlaceholder: 'example@email.com',
    emailRequired: '이메일을 입력해 주세요.',
    emailInvalid: '올바른 이메일 주소를 입력해 주세요.',
    phoneLabel: '휴대폰 번호',
    phonePlaceholder: '090 123 5678',
    phoneRequired: '휴대폰 번호를 입력해 주세요.',
    codePlaceholder: '인증번호 입력',
    codeRequired: '인증번호를 입력해 주세요.',
    sendEmail: '인증 메일 발송',
    sendCode: '인증번호 발송',
    verify: '확인',
    confirm: '확인',
    emailSentMsg: '인증 메일이 발송되었습니다.',
    codeSentMsg: 'Zalo로 인증번호가 발송되었습니다.',
    codeVerifiedMsg: '인증번호가 확인되었습니다.',
    confirmSuccessMsg: '아이디 안내가 발송되었습니다.',
    verifyFirstMsg: '먼저 인증번호 확인을 진행해 주세요.',
  },
  vn: {
    title: 'Tìm tên đăng nhập',
    emailTab: 'Xác thực Email',
    zaloTab: 'Xác thực Zalo',
    nameLabel: 'Họ tên',
    namePlaceholder: 'Nhập họ tên',
    nameRequired: 'Vui lòng nhập họ tên.',
    emailLabel: 'Email',
    emailPlaceholder: 'example@email.com',
    emailRequired: 'Vui lòng nhập email.',
    emailInvalid: 'Vui lòng nhập địa chỉ email hợp lệ.',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: '090 123 5678',
    phoneRequired: 'Vui lòng nhập số điện thoại.',
    codePlaceholder: 'Nhập mã',
    codeRequired: 'Vui lòng nhập mã xác thực.',
    sendEmail: 'Gửi email xác thực',
    sendCode: 'Gửi mã xác thực',
    verify: 'Xác thực',
    confirm: 'Xác nhận',
    emailSentMsg: 'Email xác thực đã được gửi.',
    codeSentMsg: 'Mã xác thực đã được gửi qua Zalo.',
    codeVerifiedMsg: 'Đã xác thực mã thành công.',
    confirmSuccessMsg: 'Thông tin tên đăng nhập đã được gửi.',
    verifyFirstMsg: 'Vui lòng xác thực mã trước.',
  },
};

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function FindIdPage() {
  const { message } = App.useApp();
  const { locale, setLocale } = useLocaleStore();
  const t = FIND_ID_I18N[locale] ?? FIND_ID_I18N.en;

  const [activeTab, setActiveTab] = useState<VerificationTab>('email');
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

  const handleSendEmail = () => {
    message.success(t.emailSentMsg);
  };

  const handleSendZaloCode = async () => {
    const valid = await zaloForm.trigger(['name', 'phoneNumber']);
    if (!valid) return;
    setCodeSent(true);
    setCodeVerified(false);
    setSecondsLeft(CODE_TTL_SECONDS);
    message.success(t.codeSentMsg);
  };

  const handleVerifyCode = async () => {
    const valid = await zaloForm.trigger('code');
    if (!valid) return;
    setCodeVerified(true);
    message.success(t.codeVerifiedMsg);
  };

  const handleZaloConfirm = () => {
    if (!codeVerified) {
      message.warning(t.verifyFirstMsg);
      return;
    }
    message.success(t.confirmSuccessMsg);
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
          <h1 className={styles.title}>{t.title}</h1>
        </div>

        <div className={styles.tabs} role="tablist" aria-label={t.title}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'email'}
            className={`${styles.tabBtn} ${activeTab === 'email' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('email')}
          >
            {t.emailTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'zalo'}
            className={`${styles.tabBtn} ${activeTab === 'zalo' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('zalo')}
          >
            {t.zaloTab}
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
                  {t.nameLabel}
                </label>
                <Controller
                  name="name"
                  control={emailForm.control}
                  rules={{ required: t.nameRequired }}
                  render={({ field, fieldState }) => (
                    <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                      <Input
                        {...field}
                        id="findId_email_name"
                        placeholder={t.namePlaceholder}
                        className={styles.input}
                      />
                    </Form.Item>
                  )}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="findId_email" className={styles.label}>
                  {t.emailLabel}
                </label>
                <Controller
                  name="email"
                  control={emailForm.control}
                  rules={{
                    required: t.emailRequired,
                    validate: (v) => EMAIL_REGEX.test(v.trim()) || t.emailInvalid,
                  }}
                  render={({ field, fieldState }) => (
                    <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                      <Input
                        {...field}
                        id="findId_email"
                        placeholder={t.emailPlaceholder}
                        className={styles.input}
                      />
                    </Form.Item>
                  )}
                />
              </div>
            </div>

            <Button type="primary" htmlType="submit" block className={styles.primaryBtn}>
              {t.sendEmail}
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
                  {t.nameLabel}
                </label>
                <Controller
                  name="name"
                  control={zaloForm.control}
                  rules={{ required: t.nameRequired }}
                  render={({ field, fieldState }) => (
                    <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                      <Input
                        {...field}
                        id="findId_zalo_name"
                        placeholder={t.namePlaceholder}
                        className={styles.input}
                      />
                    </Form.Item>
                  )}
                />
              </div>

              <div className={styles.verifySection}>
                <div className={styles.field}>
                  <label htmlFor="findId_phone" className={styles.label}>
                    {t.phoneLabel}
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
                        rules={{ required: t.phoneRequired }}
                        render={({ field, fieldState }) => (
                          <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                            <Input
                              {...field}
                              id="findId_phone"
                              placeholder={t.phonePlaceholder}
                              className={styles.input}
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
                      disabled={secondsLeft > 0}
                      onClick={handleSendZaloCode}
                      className={secondsLeft > 0 ? styles.sentDisabledBtn : styles.primaryBtn}
                    >
                      {t.sendCode}
                    </Button>

                    <div className={styles.codeRow}>
                      <div className={styles.codeInputWrap}>
                        <Controller
                          name="code"
                          control={zaloForm.control}
                          rules={{ required: t.codeRequired }}
                          render={({ field, fieldState }) => (
                            <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                              <Input
                                {...field}
                                id="findId_code"
                                placeholder={t.codePlaceholder}
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
                        {t.verify}
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
                onClick={handleSendZaloCode}
                className={styles.primaryBtn}
              >
                {t.sendCode}
              </Button>
            ) : (
              <Button type="primary" htmlType="submit" block className={styles.primaryBtn}>
                {t.confirm}
              </Button>
            )}
          </Form>
        )}
      </div>
    </div>
  );
}
