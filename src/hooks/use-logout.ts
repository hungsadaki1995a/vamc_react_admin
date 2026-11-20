import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '@/api/common/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/project-store';
import { useTabStore } from '@/stores/tab-store';
import { useMenuStore } from '@/stores/menu-store';
import { useComponentLabel } from '@/hooks/use-component-label';
import { App } from 'antd';
export function useLogout() {
  const { modal } = App.useApp();
  const { tvh, tvb, tsm } = useComponentLabel();

  const navigate = useNavigate();
  const logoutStore = useAuthStore((s) => s.logout);
  const { clearProjects } = useProjectStore();
  const { resetTabs } = useTabStore();
  const { clearServerMenus } = useMenuStore();

  const confirmLogout = () => {
    setTimeout(() => {
      modal.confirm({
        title: tvh('logout', 'Log Out'),
        content: tsm('logoutConfirm', 'Are you sure you want to log out?'),
        okText: tvb('logout', 'Log Out'),
        cancelText: tvb('cancel', 'Cancel'),
        okButtonProps: { danger: true },
        onOk: async () => {
          try { await logoutApi(); } catch { /* ignore */ }
          logoutStore();
          clearProjects();
          resetTabs();
          clearServerMenus();
          navigate('/login', { replace: true });
        },
      });
    }, 0);
  };

  return confirmLogout;
}
