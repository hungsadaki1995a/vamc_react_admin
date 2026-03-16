import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
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
import styles from './index.module.css';

const { Title, Text } = Typography;

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

  const savedUsername = localStorage.getItem(SAVED_USERNAME_KEY);

  const onFinish = async (values: LoginRequest & { rememberUsername: boolean }) => {
    const { rememberUsername, ...loginReq } = values;

    // Save or clear remembered username
    if (rememberUsername) {
      localStorage.setItem(SAVED_USERNAME_KEY, loginReq.username);
    } else {
      localStorage.removeItem(SAVED_USERNAME_KEY);
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      // Step 1: Login — get accessToken + refreshToken
      const loginRes = await login(loginReq);
      if (loginRes.success && loginRes.data) {
        setAccessToken(loginRes.data.accessToken);

        // Step 2: Fetch user info using usrId (= JWT subject = username)
        const meRes = await getMe(loginReq.username);
        if (meRes.success && meRes.data) {
          setAuth(loginRes.data.accessToken, meRes.data, loginRes.data.refreshToken);

          // Always reset tabs on login and open only the home tab
          resetTabs();
          const homeMenu = findMenuByKey(menuConfig, homeMenuKey);
          if (homeMenu) openTab(homeMenu);

          // Fetch my projects, then load menus with the auto-selected project's ID
          useProjectStore.getState().fetchMyProjects().then(() => {
            fetchAuthMenuList().then(setServerMenus).catch(() => { /* silent */ });
          });

          navigate('/app', { replace: true });
        } else {
          setErrorMsg('사용자 정보를 불러오지 못했습니다.');
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>DS PMS</Title>
          <Text type="secondary">프로젝트 관리 시스템</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
          initialValues={{
            username: savedUsername ?? '',
            rememberUsername: !!savedUsername,
          }}
        >
          <Form.Item
            name="username"
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
