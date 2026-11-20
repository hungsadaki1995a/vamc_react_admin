import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, Select, App } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useLocaleStore } from '@/stores/locale-store';
import { ApiError } from '@/lib/api/error';
import { useConfirmFindIdMutation, useFindIdMutation } from '../hooks/use-find-id';
import type { FindIdZaloVerificationFormProps } from '@/types/auth';
import styles from '../index.module.scss';

type ZaloFormValues = {
  name: string;
  countryCode: string;
  phoneNumber: string;
  code: string;
};

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

/** Zalo phone verification form for finding a user's login ID. */
export default function ZaloVerificationForm({ onConfirmSuccess }: FindIdZaloVerificationFormProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const locale = useLocaleStore((s) => s.locale);
  const { mutateAsync: requestFindId, isPending: isSendPending } = useFindIdMutation();
  const { mutateAsync: confirmFindId, isPending: isVerifyPending } = useConfirmFindIdMutation();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codeErrorMsg, setCodeErrorMsg] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [confirmedLoginId, setConfirmedLoginId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS);

  const form = useForm<ZaloFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', countryCode: '+84', phoneNumber: '', code: '' },
  });

  const [name, phoneNumber] = useWatch({ control: form.control, name: ['name', 'phoneNumber'] });
  const isSendDisabled = !name?.trim() || !phoneNumber?.trim();

  useEffect(() => {
    if (!codeSent || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeSent, secondsLeft]);

  const handleSendCode = async () => {
    const valid = await form.trigger(['name', 'phoneNumber']);
    if (!valid) return;

    const { name: fullName, countryCode, phoneNumber: rawPhone } = form.getValues();
    setErrorMsg(null);
    setCodeErrorMsg(null);
    try {
      const result = await requestFindId({
        channel: 'ZALO',
        fullName: fullName.trim(),
        phone: `${countryCode}${rawPhone.replace(/\s+/g, '')}`,
        urlCallback: `${window.location.origin}${window.location.pathname}`,
      });
      setRequestId(result?.requestId ?? null);
      setCodeSent(true);
      setCodeVerified(false);
      setConfirmedLoginId(null);
      setSecondsLeft(CODE_TTL_SECONDS);
      message.success(t('auth.findId.codeSentMsg'));
    } catch (err) {
      const apiErr = ApiError.from(err);
      setErrorMsg(apiErr.statusCode === 404 ? t('auth.findId.noAccountMatch') : apiErr.userMessage);
    }
  };

  const handleVerifyCode = async () => {
    const valid = await form.trigger('code');
    if (!valid || !requestId) return;

    setCodeErrorMsg(null);
    try {
      const result = await confirmFindId({
        channel: 'ZALO',
        requestId,
        code: form.getValues('code').trim(),
      });
      setConfirmedLoginId(result?.loginId ?? '');
      setCodeVerified(true);
      message.success(t('auth.findId.codeVerifiedMsg'));
    } catch (err) {
      const apiErr = ApiError.from(err);
      setCodeVerified(false);
      setConfirmedLoginId(null);
      setCodeErrorMsg(apiErr.userMessage);
    }
  };

  const handleConfirm = () => {
    if (!codeVerified || confirmedLoginId === null) {
      message.warning(t('auth.findId.verifyFirstMsg'));
      return;
    }
    onConfirmSuccess(confirmedLoginId);
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
        <div className={styles.field}>
          <label htmlFor="findId_zalo_name" className={styles.label}>
            {t('auth.findId.nameLabel')}
          </label>
          <Controller
            name="name"
            control={form.control}
            rules={{ required: t('auth.findId.nameRequired') }}
            render={({ field, fieldState }) => (
              <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                <Input
                  {...field}
                  id="findId_zalo_name"
                  placeholder={t('auth.findId.namePlaceholder')}
                  className={styles.input}
                  onChange={(e) => {
                    if (errorMsg) setErrorMsg(null);
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
                control={form.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={COUNTRY_CODE_OPTIONS}
                    className={styles.countrySelect}
                    suffixIcon={<DownOutlined className="text-[11px] text-gray-800!" />}
                  />
                )}
              />
              <div className={styles.phoneInputWrap}>
                <Controller
                  name="phoneNumber"
                  control={form.control}
                  rules={{ required: t('auth.findId.phoneRequired') }}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      validateStatus={fieldState.error || errorMsg ? 'error' : ''}
                      help={fieldState.error?.message || errorMsg}
                    >
                      <Input
                        {...field}
                        id="findId_phone"
                        placeholder={t('auth.findId.phonePlaceholder')}
                        className={styles.input}
                        onChange={(e) => {
                          if (errorMsg) setErrorMsg(null);
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
                loading={isSendPending}
                disabled={secondsLeft > 0}
                onClick={handleSendCode}
                className={secondsLeft > 0 ? styles.sentDisabledBtn : styles.primaryBtn}
              >
                {t('auth.findId.sendCode')}
              </Button>

              <div className={styles.codeRow}>
                <div className={styles.codeInputWrap}>
                  <Controller
                    name="code"
                    control={form.control}
                    rules={{ required: t('auth.findId.codeRequired') }}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        validateStatus={fieldState.error || codeErrorMsg ? 'error' : ''}
                        help={fieldState.error?.message || codeErrorMsg}
                      >
                        <Input
                          {...field}
                          id="findId_code"
                          placeholder={t('auth.findId.codePlaceholder')}
                          className={styles.codeInput}
                          onChange={(e) => {
                            if (codeErrorMsg) setCodeErrorMsg(null);
                            if (codeVerified) {
                              setCodeVerified(false);
                              setConfirmedLoginId(null);
                            }
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
                  loading={isVerifyPending}
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
          loading={isSendPending}
          disabled={isSendDisabled}
          onClick={handleSendCode}
          className={styles.primaryBtn}
        >
          {t('auth.findId.sendCode')}
        </Button>
      ) : (
        <Button type="primary" htmlType="submit" block disabled={!codeVerified} className={styles.primaryBtn}>
          {t('auth.findId.confirm')}
        </Button>
      )}
    </Form>
  );
}
