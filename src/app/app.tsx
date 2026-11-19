import { useEffect } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import { apiNotify } from '@/lib/api/api-notify';
import { useRestoreSession } from '@/hooks/use-restore-session';
import { useAppSync } from '@/hooks/use-app-sync';
import GlobalLoadingBar from '@/components/common/feedback/global-loading-bar';
import AppRoutes from './app-routes';

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
    <ConfigProvider
      locale={antLocale}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
        components: {
          DatePicker: {
            colorPrimary: '#005be2',
            borderRadius: 4,
            cellHeight: 24,
            cellWidth: 24,
            withoutTimeCellHeight: 24,
            cellHoverBg: '#f6f6f9',
            cellActiveWithRangeBg: '#eaf8ff',
            cellHoverWithRangeBg: '#d5ebff',
          },
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
