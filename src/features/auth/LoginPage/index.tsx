import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox } from 'antd';
import { login } from './api';
import { getMe } from '@/api/user';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { menuConfig } from '@/config/menuConfig';
import { findMenuByKey } from '@/utils/menuUtils';
import { fetchAuthMenuList } from '@/api/menu';
import { ApiError } from '@/lib/api/error';
import type { LoginRequest } from '@/lib/api/types';
import InitChangePwModal from '@/features/auth/InitChangePwModal';
import styles from './index.module.css';

const SAVED_USERNAME_KEY = 'pms-saved-username';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const { openTab, resetTabs } = useTabStore();
  const { setServerMenus } = useMenuStore();
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [initPwModal, setInitPwModal] = useState<{ open: boolean; usrId: string }>({
    open: false,
    usrId: '',
  });

  const savedUsername = localStorage.getItem(SAVED_USERNAME_KEY);

  // Shared post-login navigation logic (called after login or after initial PW change)
  const proceedToApp = useCallback(async (accessToken: string, username: string, refreshToken?: string) => {
    const meRes = await getMe(username);
    if (meRes.success && meRes.data) {
      setAuth(accessToken, meRes.data, refreshToken);
      resetTabs();
      const homeMenu = findMenuByKey(menuConfig, homeMenuKey);
      if (homeMenu) openTab(homeMenu);
      useProjectStore.getState().fetchMyProjects().then(() => {
        fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });
      });
      navigate('/app', { replace: true });
    } else {
      setErrorMsg('사용자 정보를 불러오지 못했습니다.');
    }
  }, [setAuth, resetTabs, openTab, homeMenuKey, setServerMenus, navigate]);

  const onFinish = async (values: LoginRequest & { rememberUsername: boolean }) => {
    const { rememberUsername, ...loginReq } = values;

    if (rememberUsername) {
      localStorage.setItem(SAVED_USERNAME_KEY, loginReq.username);
    } else {
      localStorage.removeItem(SAVED_USERNAME_KEY);
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const loginRes = await login(loginReq);
      if (loginRes.success && loginRes.data) {
        setAccessToken(loginRes.data.accessToken);

        if (loginRes.data.mustChangePassword) {
          // Initial login — show password change modal before proceeding
          setInitPwModal({ open: true, usrId: loginReq.username });
        } else {
          await proceedToApp(loginRes.data.accessToken, loginReq.username, loginRes.data.refreshToken);
        }
      } else {
        setErrorMsg(loginRes.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      const apiErr = ApiError.from(err);
      setErrorMsg(apiErr.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInitPwSuccess = useCallback(() => {
    setInitPwModal({ open: false, usrId: '' });
    setAccessToken('');
    setErrorMsg(null);
  }, [setAccessToken]);

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Left: illustration */}
        <div className={styles.illustration}>
          <img src="/login_sol_friends.png" alt="One Shinhan" />
        </div>

        {/* Right: login card */}
        <div className={styles.card}>
          <div className={styles.logo}>
            <img src="/logo_harmony.svg" alt="HARMONY" />
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            initialValues={{
              username: savedUsername ?? '',
              rememberUsername: !!savedUsername,
            }}
          >
            <Form.Item
              name="username"
              style={{ marginBottom: 14 }}
              rules={[{ required: true, message: '아이디를 입력해 주세요.' }]}
            >
              <Input placeholder="아이디" />
            </Form.Item>

            <Form.Item
              name="password"
              style={{ marginBottom: 14 }}
              rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
            >
              <Input.Password placeholder="비밀번호" />
            </Form.Item>

            <Form.Item name="rememberUsername" valuePropName="checked" style={{ marginBottom: 14 }}>
              <Checkbox>아이디 저장</Checkbox>
            </Form.Item>

            {errorMsg && (
              <Form.Item style={{ marginBottom: 14 }}>
                <Alert type="error" title={errorMsg} showIcon />
              </Form.Item>
            )}

            <Form.Item style={{ marginBottom: 0 }}>
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

      <InitChangePwModal
        open={initPwModal.open}
        usrId={initPwModal.usrId}
        onSuccess={handleInitPwSuccess}
      />
    </div>
  );
}
