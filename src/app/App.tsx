import { useEffect } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import { APP_THEME } from '@/config/theme-config';
import { apiNotify } from '@/lib/api/api-notify';
import { useRestoreSession } from '@/hooks/use-restore-session';
import { useAppSync } from '@/hooks/use-app-sync';
import GlobalLoadingSpinner from '@/components/common/feedback/GlobalLoadingSpinner';
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
  const { antLocale } = useAppSync();

  return (
    <ConfigProvider locale={antLocale} theme={APP_THEME}>
      <AntApp>
        <GlobalLoadingSpinner />
        <ApiNotifyBridge />
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}
