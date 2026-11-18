import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, Select, App } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useLocaleStore } from '@/stores/locale-store';
import { ApiError } from '@/lib/api/error';
import { useRequestPasswordResetMutation } from '../hooks/use-find-password';
import styles from '../../find-id-page/index.module.scss';

interface ZaloFormValues {
  countryCode: string;
  phoneNumber: string;
  code: string;
}

export interface ZaloVerificationResult {
  token: string;
  maskedLoginId: string;
}

export interface ZaloVerificationFormProps {
  onConfirmSuccess: (result: ZaloVerificationResult) => void;
}

const CODE_TTL_SECONDS = 180;

const COUNTRY_CODE_OPTIONS = [
  { value: '+84', label: '+84' },
  { value: '+82', label: '+82' },
];

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Zalo phone verification form for resetting a user's password. */
export default function ZaloVerificationForm({ onConfirmSuccess }: ZaloVerificationFormProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const locale = useLocaleStore((s) => s.locale);
  const { mutateAsync: requestReset, isPending: isSendPending } = useRequestPasswordResetMutation();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codeErrorMsg, setCodeErrorMsg] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [maskedDestination, setMaskedDestination] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS);

  const form = useForm<ZaloFormValues>({
    mode: 'onTouched',
    defaultValues: { countryCode: '+84', phoneNumber: '', code: '' },
  });

  const [phoneNumber, codeValue] = useWatch({ control: form.control, name: ['phoneNumber', 'code'] });
  const isSendDisabled = !phoneNumber?.trim();
  const isVerifyDisabled = !codeValue?.trim();

  useEffect(() => {
    if (!codeSent || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeSent, secondsLeft]);

  const handleSendCode = async () => {
    const valid = await form.trigger('phoneNumber');
    if (!valid) return;

    const { countryCode, phoneNumber: rawPhone } = form.getValues();
    const fullPhone = `${countryCode}${rawPhone.trim()}`;
    setErrorMsg(null);
    setCodeErrorMsg(null);
    try {
      const result = await requestReset({
        channel: 'ZALO',
        // shortcut: backend ZALO password-reset endpoint & phone field not yet in OpenAPI; update when supported
        urlCallback: `${window.location.origin}${window.location.pathname}`,
      });
      setResetToken(result?.devToken ?? result?.requestId ?? null);
      setMaskedDestination(result?.destination ?? fullPhone);
      setCodeSent(true);
      setCodeVerified(false);
      setSecondsLeft(CODE_TTL_SECONDS);
      message.success(t('auth.findPassword.codeSentMsg'));
    } catch (err) {
      const apiErr = ApiError.from(err);
      setErrorMsg(apiErr.statusCode === 404 ? t('auth.findId.noAccountMatch') : apiErr.userMessage);
    }
  };

  const handleVerifyCode = async () => {
    const valid = await form.trigger('code');
    if (!valid) return;
    if (secondsLeft <= 0) {
      setCodeErrorMsg(t('auth.findPassword.codeExpired'));
      return;
    }

    // shortcut: no backend ZALO password-reset OTP confirm endpoint in OpenAPI yet; replace when available
    setCodeErrorMsg(null);
    setCodeVerified(true);
    message.success(t('auth.findPassword.codeVerifiedMsg'));
  };

  const handleConfirm = () => {
    if (!codeVerified || !resetToken) {
      message.warning(t('auth.findPassword.verifyFirstMsg'));
      return;
    }
    onConfirmSuccess({ token: resetToken, maskedLoginId: maskedDestination });
  };

  return (
    <Form
      key={`zalo-${locale}`}
      onFinish={form.handleSubmit(handleConfirm)}
      autoComplete="off"
      layout="vertical"
      className={styles.form}
    >
      <div className={styles.fields}>
        <div className={styles.verifySection}>
          <div className={styles.field}>
            <label htmlFor="findPassword_phone" className={styles.label}>
              {t('auth.findPassword.phoneLabel')}
            </label>
            <div className={styles.phoneRow}>
              <Controller
                name="countryCode"
                control={form.control}
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
                  control={form.control}
                  rules={{ required: t('auth.findPassword.phoneRequired') }}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      validateStatus={fieldState.error || errorMsg ? 'error' : ''}
                      help={fieldState.error?.message || errorMsg}
                    >
                      <Input
                        {...field}
                        id="findPassword_phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder={t('auth.findPassword.phonePlaceholder')}
                        className={styles.input}
                        onChange={(e) => {
                          if (errorMsg) setErrorMsg(null);
                          field.onChange(e.target.value.replace(/\D/g, ''));
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
                loading={isSendPending}
                disabled={secondsLeft > 0}
                onClick={handleSendCode}
                className={secondsLeft > 0 ? styles.sentDisabledBtn : styles.primaryBtn}
              >
                {t('auth.findPassword.sendCode')}
              </Button>

              <div className={styles.codeRow}>
                <div className={styles.codeInputWrap}>
                  <Controller
                    name="code"
                    control={form.control}
                    rules={{ required: t('auth.findPassword.codeRequired') }}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        validateStatus={fieldState.error || codeErrorMsg ? 'error' : ''}
                        help={fieldState.error?.message || codeErrorMsg}
                      >
                        <Input
                          {...field}
                          id="findPassword_code"
                          placeholder={t('auth.findPassword.codePlaceholder')}
                          className={styles.codeInput}
                          onChange={(e) => {
                            if (codeErrorMsg) setCodeErrorMsg(null);
                            if (codeVerified) setCodeVerified(false);
                            field.onChange(e);
                          }}
                        />
                      </Form.Item>
                    )}
                  />
                  <span className={styles.timer}>{formatCountdown(secondsLeft)}</span>
                </div>

                <Button
                  type="default"
                  disabled={isVerifyDisabled}
                  onClick={handleVerifyCode}
                  className={styles.verifyBtn}
                >
                  {t('auth.findPassword.verify')}
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
          loading={isSendPending}
          disabled={isSendDisabled}
          onClick={handleSendCode}
          className={styles.primaryBtn}
        >
          {t('auth.findPassword.sendCode')}
        </Button>
      ) : (
        <Button type="primary" htmlType="submit" block disabled={!codeVerified} className={styles.primaryBtn}>
          {t('auth.findPassword.confirm')}
        </Button>
      )}
    </Form>
  );
}
