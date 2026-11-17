import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Form, Input, Button, Alert, Dropdown, App } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { login } from '@/api/generated/sdk.gen';
import { fetchPublicKey } from '@/api/common/authApi';
import { encryptPassword } from '@/lib/crypto';
import { useAuthStore } from '@/stores/authStore';
import { jwtToMeResponse } from '@/utils/jwtUtils';
import { setRefreshToken } from '@/utils/tokenStorage';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { menuConfig } from '@/config/menuConfig';
import { findMenuByKey } from '@/utils/menuUtils';
import { fetchAuthMenuList } from '@/api/common/myMenuApi';
import { ApiError } from '@/lib/api/error';
import type { LoginRequest } from '@/lib/api/types';
import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';
import { getLocaleShortLabel } from '@/utils/localeStorage';
import styles from './index.module.css';
import vamcLogoLogin from '@/assets/vamc_logo_login-28c7ab.png';

const LOGIN_I18N: Record<
  LocaleKey,
  {
    loginIdLabel: string;
    loginIdPlaceholder: string;
    loginIdRequired: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordRequired: string;
    submit: string;
    findLoginId: string;
    findPassword: string;
    findNotReady: string;
    defaultError: string;
  }
> = {
  en: {
    loginIdLabel: 'Login ID',
    loginIdPlaceholder: 'Enter email or phone number',
    loginIdRequired: 'Please enter your login ID.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    passwordRequired: 'Please enter your password.',
    submit: 'Log In',
    findLoginId: 'Find Login ID',
    findPassword: 'Find Password',
    findNotReady: 'Please contact your system administrator.',
    defaultError: 'Login failed.',
  },
  ko: {
    loginIdLabel: '아이디',
    loginIdPlaceholder: '이메일 또는 휴대폰 번호를 입력해 주세요',
    loginIdRequired: '아이디를 입력해 주세요.',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '비밀번호를 입력해 주세요',
    passwordRequired: '비밀번호를 입력해 주세요.',
    submit: '로그인',
    findLoginId: '아이디 찾기',
    findPassword: '비밀번호 찾기',
    findNotReady: '시스템 관리자에게 문의해 주세요.',
    defaultError: '로그인에 실패했습니다.',
  },
  vn: {
    loginIdLabel: 'Tên đăng nhập',
    loginIdPlaceholder: 'Nhập email hoặc số điện thoại',
    loginIdRequired: 'Vui lòng nhập tên đăng nhập.',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu',
    passwordRequired: 'Vui lòng nhập mật khẩu.',
    submit: 'Đăng nhập',
    findLoginId: 'Tìm tên đăng nhập',
    findPassword: 'Tìm mật khẩu',
    findNotReady: 'Vui lòng liên hệ quản trị viên hệ thống.',
    defaultError: 'Đăng nhập thất bại.',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { openTab, resetTabs } = useTabStore();
  const { setServerMenus } = useMenuStore();
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const { locale, setLocale } = useLocaleStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = LOGIN_I18N[locale] ?? LOGIN_I18N.en;
  const { control, handleSubmit } = useForm<LoginRequest>({
    defaultValues: { loginId: '', password: '' },
  });

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

        fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });

        navigate('/members', { replace: true });
      } else {
        setErrorMsg(t.defaultError);
      }
    } catch (err) {
      const apiErr = ApiError.from(err);
      setErrorMsg(apiErr.userMessage);
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
                {t.loginIdLabel}
              </label>
              <Controller
                name="loginId"
                control={control}
                rules={{ required: t.loginIdRequired }}
                render={({ field, fieldState }) => (
                  <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                    <Input
                      {...field}
                      id="login_loginId"
                      placeholder={t.loginIdPlaceholder}
                      className={styles.input}
                    />
                  </Form.Item>
                )}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="login_password" className={styles.label}>
                {t.passwordLabel}
              </label>
              <Controller
                name="password"
                control={control}
                rules={{ required: t.passwordRequired }}
                render={({ field, fieldState }) => (
                  <Form.Item validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                    <Input.Password
                      {...field}
                      id="login_password"
                      placeholder={t.passwordPlaceholder}
                      className={styles.passwordInput}
                    />
                  </Form.Item>
                )}
              />
            </div>
          </div>

          {errorMsg && (
            <Form.Item>
              <Alert type="error" title={errorMsg} showIcon />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className={styles.submitBtn}
            >
              {t.submit}
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.links}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => message.info(t.findNotReady)}
          >
            {t.findLoginId}
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => message.info(t.findNotReady)}
          >
            {t.findPassword}
          </button>
        </div>
      </div>
    </div>
  );
}
