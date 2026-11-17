import { useEffect } from 'react';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import { apiNotify } from '@/lib/api/apiNotify';
import { useRestoreSession } from '@/hooks/useRestoreSession';
import { useAppSync } from '@/hooks/useAppSync';
import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';
import AppRoutes from './AppRoutes';

// Registers axios interceptor error messages into the antd message context.
// Must be rendered inside <AntApp> to access App.useApp().
function ApiNotifyBridge() {
  const { message } = AntApp.useApp();
  useEffect(() => {
    apiNotify.setHandler((level, content) => message[level](content));
  }, [message]);
  return null;
}

export default function App() {
  useRestoreSession();
  const { mode, antLocale } = useAppSync();

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{
        algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <GlobalLoadingBar />
        <ApiNotifyBridge />
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}
