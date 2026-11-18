import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, App } from 'antd';
import { useLocaleStore } from '@/stores/locale-store';
import { useFindIdMutation } from '../hooks/use-find-id';
import styles from '../index.module.scss';

interface EmailFormValues {
  name: string;
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email verification form for finding a user's login ID. */
export default function EmailVerificationForm() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const locale = useLocaleStore((s) => s.locale);
  const { mutateAsync: requestFindId, isPending } = useFindIdMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<EmailFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', email: '' },
  });

  const [name, email] = useWatch({ control: form.control, name: ['name', 'email'] });
  const isSubmitDisabled = !name?.trim() || !email?.trim();

  const handleSendEmail = async (values: EmailFormValues) => {
    setErrorMsg(null);
    try {
      await requestFindId({
        channel: 'EMAIL',
        fullName: values.name.trim(),
        email: values.email.trim(),
        urlCallback: `${window.location.origin}${window.location.pathname}`,
      });
      message.success(t('auth.findId.emailSentMsg'));
    } catch (err) {
      const apiErr = err as { statusCode?: number; userMessage?: string };
      setErrorMsg(
        apiErr.statusCode === 404
          ? t('auth.findId.noAccountMatch')
          : (apiErr.userMessage ?? t('auth.findId.noAccountMatch')),
      );
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
          <label htmlFor="findId_email_name" className={styles.label}>
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
                  id="findId_email_name"
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

        <div className={styles.field}>
          <label htmlFor="findId_email" className={styles.label}>
            {t('auth.findId.emailLabel')}
          </label>
          <Controller
            name="email"
            control={form.control}
            rules={{
              required: t('auth.findId.emailRequired'),
              validate: (v) => EMAIL_REGEX.test(v.trim()) || t('auth.findId.emailInvalid'),
            }}
            render={({ field, fieldState }) => (
              <Form.Item
                validateStatus={fieldState.error || errorMsg ? 'error' : ''}
                help={fieldState.error?.message || errorMsg}
              >
                <Input
                  {...field}
                  id="findId_email"
                  type="email"
                  placeholder={t('auth.findId.emailPlaceholder')}
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

      <Button
        type="primary"
        htmlType="submit"
        block
        loading={isPending}
        disabled={isSubmitDisabled}
        className={styles.primaryBtn}
      >
        {t('auth.findId.sendEmail')}
      </Button>
    </Form>
  );
}
