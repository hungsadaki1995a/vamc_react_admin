import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import ActionButton from '@/components/common/actions/ActionButton';
import TextInput from '@/components/inputs/TextInput';
import AuthHeader from '@/components/auth/AuthHeader';
import { login } from '@/api/generated/sdk.gen';
import { fetchPublicKey } from '@/api/common/auth-api';
import { encryptPassword } from '@/lib/crypto';
import { useAuthStore } from '@/stores/auth-store';
import { jwtToMeResponse } from '@/utils/jwt-utils';
import { setRefreshToken } from '@/utils/token-storage';
import { useTabStore } from '@/stores/tab-store';
import { useMenuStore } from '@/stores/menu-store';
import { useSettingsStore } from '@/stores/settings-store';
import { menuConfig } from '@/config/menu-config';
import { findMenuByKey } from '@/utils/menu-utils';
import { fetchAuthMenuList } from '@/api/common/my-menu-api';
import { ApiError } from '@/lib/api/error';
import type { LoginRequest } from '@/lib/api/types';
import { useLocaleStore } from '@/stores/locale-store';
import { REDIRECT_QUERY_KEY, getSafeRedirectPath } from '@/app/route-constants';
import styles from './index.module.scss';
import vamcLogoLogin from '@/assets/vamc-logo-login.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{8,15}$/;

function isValidEmailOrPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return EMAIL_REGEX.test(trimmed) || PHONE_REGEX.test(trimmed.replace(/[\s-]/g, ''));
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { openTab, resetTabs } = useTabStore();
  const { setMenuTrees, setServerMenus } = useMenuStore();
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const locale = useLocaleStore((s) => s.locale);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const { control, handleSubmit } = useForm<LoginRequest>({
    mode: 'onTouched',
    defaultValues: { loginId: '', password: '' },
  });
  const [loginIdValue, passwordValue] = useWatch({ control, name: ['loginId', 'password'] });
  const isSubmitDisabled = !loginIdValue?.trim() || !passwordValue;

  const onFinish = async (values: LoginRequest) => {
    setErrorMsg(null);
    try {
      let password = values.password;
      if (window.isSecureContext && window.crypto?.subtle) {
        const publicKey = await fetchPublicKey();
        if (publicKey) {
          password = await encryptPassword(publicKey, values.password);
        }
      }

      const loginRes = await login({
        body: {
          loginId: values.loginId,
          password,
        },
        throwOnError: true,
      });

      if (loginRes.data?.accessToken) {
        const me = jwtToMeResponse(loginRes.data.accessToken);
        if (loginRes.data.employee) {
          if (loginRes.data.employee.empNm) me.usrNm = loginRes.data.employee.empNm;
          if (loginRes.data.employee.empEmlAddr) me.email = loginRes.data.employee.empEmlAddr;
          if (loginRes.data.employee.empMoblTelno) me.phnNo = loginRes.data.employee.empMoblTelno;
        }

        if (loginRes.data.refreshToken) {
          setRefreshToken(loginRes.data.refreshToken);
        }

        setAuth(loginRes.data.accessToken, me);

        const redirectTarget = getSafeRedirectPath(searchParams.get(REDIRECT_QUERY_KEY));

        resetTabs();
        const homeMenu = findMenuByKey(menuConfig, homeMenuKey);
        if (homeMenu) openTab(homeMenu);
        if (!redirectTarget) {
          const memberMenu = findMenuByKey(menuConfig, 'members') || findMenuByKey(menuConfig, 'member.list');
          if (memberMenu) openTab(memberMenu);
        }

        if (loginRes.data.menuTrees?.length) {
          setMenuTrees(loginRes.data.menuTrees);
        } else {
          fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });
        }

        setFailedAttempts(0);
        navigate(redirectTarget ?? '/members', { replace: true });
      } else {
        setErrorMsg(t('auth.login.defaultError'));
      }
    } catch (err) {
      const apiErr = ApiError.from(err);
      if (apiErr.statusCode === 400 || apiErr.statusCode === 401) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setErrorMsg(nextAttempts <= 4 ? t('auth.login.invalidCredentials') : apiErr.userMessage);
      } else {
        setErrorMsg(apiErr.userMessage);
      }
    }
  };

  return (
    <div className={styles.container}>
      <AuthHeader />

      <main className={styles.content}>
        <div className={styles.card}>
        <div className={styles.header}>
          <img src={vamcLogoLogin} alt="VAMC" className={styles.logo} />
          <h1 className={styles.title}>VAMC NPL Admin System</h1>
        </div>

        <Form
          key={locale}
          name="login"
          onFinish={handleSubmit(onFinish)}
          autoComplete="off"
          layout="vertical"
          className={styles.form}
        >
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="login_loginId" className={styles.label}>
                {t('auth.login.loginIdLabel')}
              </label>
              <Controller
                name="loginId"
                control={control}
                rules={{
                  required: t('auth.login.loginIdRequired'),
                  validate: (value) => isValidEmailOrPhone(value) || t('auth.login.loginIdInvalid'),
                }}
                render={({ field, fieldState }) => (
                  <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                    <TextInput
                      {...field}
                      id="login_loginId"
                      placeholder={t('auth.login.loginIdPlaceholder')}
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
              <label htmlFor="login_password" className={styles.label}>
                {t('auth.login.passwordLabel')}
              </label>
              <Controller
                name="password"
                control={control}
                rules={{ required: t('auth.login.passwordRequired') }}
                render={({ field, fieldState }) => (
                  <Form.Item
                    validateStatus={fieldState.error || errorMsg ? 'error' : ''}
                    help={fieldState.error?.message || errorMsg}
                  >
                    <TextInput
                      {...field}
                      variant="password"
                      id="login_password"
                      placeholder={t('auth.login.passwordPlaceholder')}
                      className={styles.passwordInput}
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

          <Form.Item>
            <ActionButton
              intent="primary"
              appearance="filled"
              htmlType="submit"
              block
              disabled={isSubmitDisabled}
              className={styles.submitBtn}
            >
              {t('auth.login.submit')}
            </ActionButton>
          </Form.Item>
        </Form>

        <div className={styles.links}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate('/find-id')}
          >
            {t('auth.login.findLoginId')}
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate('/find-password')}
          >
            {t('auth.login.findPassword')}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}
