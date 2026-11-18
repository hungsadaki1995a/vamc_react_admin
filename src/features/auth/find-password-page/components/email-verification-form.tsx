import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, App } from 'antd';
import { useLocaleStore } from '@/stores/locale-store';
import { ApiError } from '@/lib/api/error';
import { useRequestPasswordResetMutation } from '../hooks/use-find-password';
import styles from '../../find-id-page/index.module.scss';

interface EmailFormValues {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_STORAGE_KEY = 'findPassword_email';

/** Email verification form for requesting a password reset link. */
export default function EmailVerificationForm() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const locale = useLocaleStore((s) => s.locale);
  const { mutateAsync: requestReset, isPending } = useRequestPasswordResetMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<EmailFormValues>({
    mode: 'onTouched',
    defaultValues: { email: sessionStorage.getItem(EMAIL_STORAGE_KEY) ?? '' },
  });

  const email = useWatch({ control: form.control, name: 'email' });
  const isSubmitDisabled = !email?.trim();

  const handleSendEmail = async (values: EmailFormValues) => {
    setErrorMsg(null);
    const trimmedEmail = values.email.trim();
    try {
      await requestReset({
        channel: 'EMAIL',
        email: trimmedEmail,
        urlCallback: `${window.location.origin}${window.location.pathname}`,
      });
      message.success(t('auth.findPassword.emailSentMsg'));
    } catch (err) {
      const apiErr = ApiError.from(err);
      setErrorMsg(apiErr.statusCode === 404 ? t('auth.findPassword.noAccountEmail') : apiErr.userMessage);
    }
  };

  return (
    <Form
      key={`email-${locale}`}
      onFinish={form.handleSubmit(handleSendEmail)}
      autoComplete="off"
      layout="vertical"
      className={styles.form}
    >
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="findPassword_email" className={styles.label}>
            {t('auth.findPassword.emailLabel')}
          </label>
          <Controller
            name="email"
            control={form.control}
            rules={{
              required: t('auth.findPassword.emailRequired'),
              validate: (v) => EMAIL_REGEX.test(v.trim()) || t('auth.findPassword.emailInvalid'),
            }}
            render={({ field, fieldState }) => (
              <Form.Item
                validateStatus={fieldState.error || errorMsg ? 'error' : ''}
                help={fieldState.error?.message || errorMsg}
              >
                <Input
                  {...field}
                  id="findPassword_email"
                  type="email"
                  placeholder={t('auth.findPassword.emailPlaceholder')}
                  className={styles.input}
                  onChange={(e) => {
                    if (errorMsg) setErrorMsg(null);
                    sessionStorage.setItem(EMAIL_STORAGE_KEY, e.target.value);
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
        loading={isPending}
        disabled={isSubmitDisabled}
        className={styles.primaryBtn}
      >
        {t('auth.findPassword.sendEmail')}
      </Button>
    </Form>
  );
}
