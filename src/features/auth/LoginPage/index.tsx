import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
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
import styles from './index.module.css';
import vamcLogo from '@/assets/vamc_logo.png';

const { Title, Text } = Typography;

const SAVED_USERNAME_KEY = 'vamc-saved-username';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { openTab, resetTabs } = useTabStore();
  const { setServerMenus } = useMenuStore();
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const savedUsername = localStorage.getItem(SAVED_USERNAME_KEY);

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
        setErrorMsg('로그인에 실패했습니다.');
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
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={vamcLogo} alt="VAMC" className={styles.logo} />
          <Title level={3} style={{ margin: 0 }}>VAMC NPL ADMIN</Title>
          <Text type="secondary">부실채권 관리 어드민</Text>
        </div>

        <Form
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
            rules={[{ required: true, message: '아이디를 입력해 주세요.' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="아이디" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
          </Form.Item>

          <Form.Item name="rememberUsername" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>아이디 저장</Checkbox>
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
              로그인
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
