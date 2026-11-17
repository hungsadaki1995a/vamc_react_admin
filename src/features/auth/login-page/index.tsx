import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Form, Input, Button, Dropdown, App } from 'antd';
import type { MenuProps } from 'antd';
import {
  GlobalOutlined,
  DownOutlined,
  CheckOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
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
import { useLocaleStore, type LocaleKey } from '@/stores/locale-store';
import { getLocaleShortLabel } from '@/utils/locale-storage';
import styles from './index.module.scss';
import vamcLogoLogin from '@/assets/vamc_logo_login-28c7ab.png';

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
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { openTab, resetTabs } = useTabStore();
  const { setMenuTrees, setServerMenus } = useMenuStore();
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const { locale, setLocale } = useLocaleStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const { control, handleSubmit } = useForm<LoginRequest>({
    mode: 'onTouched',
    defaultValues: { loginId: '', password: '' },
  });
  const [loginIdValue, passwordValue] = useWatch({ control, name: ['loginId', 'password'] });
  const isSubmitDisabled = !loginIdValue?.trim() || !passwordValue;

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

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
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

        resetTabs();
        const homeMenu = findMenuByKey(menuConfig, homeMenuKey);
        if (homeMenu) openTab(homeMenu);
        const memberMenu = findMenuByKey(menuConfig, 'members') || findMenuByKey(menuConfig, 'member.list');
        if (memberMenu) openTab(memberMenu);

        if (loginRes.data.menuTrees?.length) {
          setMenuTrees(loginRes.data.menuTrees);
        } else {
          fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });
        }

        setFailedAttempts(0);
        navigate('/members', { replace: true });
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
    } finally {
      setLoading(false);
    }
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
                    <Input
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
                    <Input.Password
                      {...field}
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
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              disabled={isSubmitDisabled}
              className={styles.submitBtn}
            >
              {t('auth.login.submit')}
            </Button>
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
            onClick={() => message.info(t('auth.login.findNotReady'))}
          >
            {t('auth.login.findPassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
