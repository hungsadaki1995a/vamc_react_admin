import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Typography, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GlobalOutlined,
  DownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
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
import vamcLogo from '@/assets/vamc_logo.png';

const { Title, Text } = Typography;

const SAVED_USERNAME_KEY = 'vamc-saved-username';

const LOGIN_I18N: Record<
  LocaleKey,
  {
    subtitle: string;
    username: string;
    usernameRequired: string;
    password: string;
    passwordRequired: string;
    rememberUsername: string;
    submit: string;
    defaultError: string;
  }
> = {
  en: {
    subtitle: 'NPL Management Admin',
    username: 'Username',
    usernameRequired: 'Please enter your username.',
    password: 'Password',
    passwordRequired: 'Please enter your password.',
    rememberUsername: 'Remember ID',
    submit: 'Sign In',
    defaultError: 'Login failed.',
  },
  ko: {
    subtitle: '부실채권 관리 어드민',
    username: '아이디',
    usernameRequired: '아이디를 입력해 주세요.',
    password: '비밀번호',
    passwordRequired: '비밀번호를 입력해 주세요.',
    rememberUsername: '아이디 저장',
    submit: '로그인',
    defaultError: '로그인에 실패했습니다.',
  },
  vn: {
    subtitle: 'Quản trị quản lý nợ xấu (NPL)',
    username: 'Tên đăng nhập',
    usernameRequired: 'Vui lòng nhập tên đăng nhập.',
    password: 'Mật khẩu',
    passwordRequired: 'Vui lòng nhập mật khẩu.',
    rememberUsername: 'Lưu tên đăng nhập',
    submit: 'Đăng nhập',
    defaultError: 'Đăng nhập thất bại.',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { openTab, resetTabs } = useTabStore();
  const { setServerMenus } = useMenuStore();
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const { locale, setLocale } = useLocaleStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = LOGIN_I18N[locale] ?? LOGIN_I18N.en;
  const savedUsername = localStorage.getItem(SAVED_USERNAME_KEY);

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

  const onFinish = async (values: LoginRequest & { rememberUsername: boolean }) => {
    const { rememberUsername, ...loginReq } = values;

    // Save or clear remembered username
    if (rememberUsername) {
      localStorage.setItem(SAVED_USERNAME_KEY, loginReq.loginId);
    } else {
      localStorage.removeItem(SAVED_USERNAME_KEY);
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      let password = loginReq.password;
      if (window.isSecureContext && window.crypto?.subtle) {
        const publicKey = await fetchPublicKey();
        if (publicKey) {
          password = await encryptPassword(publicKey, loginReq.password);
        }
      }

      // Step 1: Login — call API login in src/api/generated/sdk.gen.ts
      const loginRes = await login({
        body: {
          loginId: loginReq.loginId,
          password,
        },
        throwOnError: true,
      });

      if (loginRes.data?.accessToken) {
        // Step 2: Extract user info from JWT claims (no separate API call needed)
        const me = jwtToMeResponse(loginRes.data.accessToken);
        if (loginRes.data.employee) {
          if (loginRes.data.employee.empNm) me.usrNm = loginRes.data.employee.empNm;
          if (loginRes.data.employee.empEmlAddr) me.email = loginRes.data.employee.empEmlAddr;
          if (loginRes.data.employee.empMoblTelno) me.phnNo = loginRes.data.employee.empMoblTelno;
        }

        // Store refresh token if provided
        if (loginRes.data.refreshToken) {
          setRefreshToken(loginRes.data.refreshToken);
        }

        setAuth(loginRes.data.accessToken, me);

        // Always reset tabs on login and open home + member list tab
        resetTabs();
        const homeMenu = findMenuByKey(menuConfig, homeMenuKey);
        if (homeMenu) openTab(homeMenu);
        const memberMenu = findMenuByKey(menuConfig, 'members') || findMenuByKey(menuConfig, 'member.list');
        if (memberMenu) openTab(memberMenu);

        fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });

        // Step 3: Navigate to the members page
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
          <img src={vamcLogo} alt="VAMC" className={styles.logo} />
          <Title level={3} style={{ margin: 0 }}>VAMC NPL ADMIN</Title>
          <Text type="secondary">{t.subtitle}</Text>
        </div>

        <Form
          key={locale}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
          initialValues={{
            loginId: savedUsername ?? '',
            rememberUsername: !!savedUsername,
          }}
        >
          <Form.Item
            name="loginId"
            rules={[{ required: true, message: t.usernameRequired }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t.username} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t.passwordRequired }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t.password} />
          </Form.Item>

          <Form.Item name="rememberUsername" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>{t.rememberUsername}</Checkbox>
          </Form.Item>

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
            >
              {t.submit}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
