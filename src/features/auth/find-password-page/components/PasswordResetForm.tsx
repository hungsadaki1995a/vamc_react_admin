import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, App } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { PUBLIC_ROUTES } from '@/app/route-constants';
import { useLocaleStore } from '@/stores/locale-store';
import { ApiError } from '@/lib/api/error';
import { useResetPasswordMutation } from '../hooks/use-find-password';
import styles from '../../find-id-page/index.module.scss';

interface PasswordResetFormValues {
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetFormProps {
  token: string;
  maskedLoginId?: string;
  onTokenExpired: () => void;
}

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

/** Password reset form shown after email link or Zalo verification. */
export default function PasswordResetForm({
  token,
  maskedLoginId,
  onTokenExpired,
}: PasswordResetFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const locale = useLocaleStore((s) => s.locale);
  const { mutateAsync: submitReset, isPending } = useResetPasswordMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<PasswordResetFormValues>({
    mode: 'onTouched',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const [newPassword, confirmPassword] = useWatch({
    control: form.control,
    name: ['newPassword', 'confirmPassword'],
  });
  const isSubmitDisabled = !newPassword || !confirmPassword;

  const handleSubmit = async (values: PasswordResetFormValues) => {
    setErrorMsg(null);
    try {
      await submitReset({ token, newPassword: values.newPassword });
      sessionStorage.removeItem('findPassword_email');
      message.success(t('auth.findPassword.resetSuccessMsg'));
      navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const apiErr = ApiError.from(err);
      if (apiErr.errorCode === 'RCV003') {
        onTokenExpired();
        return;
      }
      setErrorMsg(apiErr.userMessage);
    }
  };

  return (
    <Form
      key={`reset-${locale}`}
      onFinish={form.handleSubmit(handleSubmit)}
      autoComplete="off"
      layout="vertical"
      className={styles.form}
    >
      <div className={styles.fields}>
        {maskedLoginId && (
          <div className={styles.field}>
            <label htmlFor="resetPassword_loginId" className={styles.label}>
              {t('auth.findPassword.loginIdLabel')}
            </label>
            <Input
              id="resetPassword_loginId"
              readOnly
              value={maskedLoginId}
              className={styles.readonlyInput}
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="resetPassword_new" className={styles.label}>
            {t('auth.findPassword.newPasswordLabel')}
          </label>
          <Controller
            name="newPassword"
            control={form.control}
            rules={{
              required: t('auth.findPassword.newPasswordRequired'),
              pattern: {
                value: PASSWORD_REGEX,
                message: t('auth.findPassword.newPasswordRule'),
              },
            }}
            render={({ field, fieldState }) => (
              <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                <Input.Password
                  {...field}
                  id="resetPassword_new"
                  placeholder={t('auth.findPassword.newPasswordPlaceholder')}
                  className={styles.input}
                  iconRender={(visible) => (visible ? <EyeInvisibleOutlined /> : <EyeOutlined />)}
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
          <label htmlFor="resetPassword_confirm" className={styles.label}>
            {t('auth.findPassword.confirmPasswordLabel')}
          </label>
          <Controller
            name="confirmPassword"
            control={form.control}
            rules={{
              required: t('auth.findPassword.confirmPasswordRequired'),
              validate: (v) => v === form.getValues('newPassword') || t('auth.findPassword.passwordMismatch'),
            }}
            render={({ field, fieldState }) => (
              <Form.Item
                validateStatus={fieldState.error || errorMsg ? 'error' : ''}
                help={fieldState.error?.message || errorMsg}
              >
                <Input.Password
                  {...field}
                  id="resetPassword_confirm"
                  placeholder={t('auth.findPassword.confirmPasswordPlaceholder')}
                  className={styles.input}
                  iconRender={(visible) => (visible ? <EyeInvisibleOutlined /> : <EyeOutlined />)}
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
        {t('auth.findPassword.changePassword')}
      </Button>
    </Form>
  );
}
