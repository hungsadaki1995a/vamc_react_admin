import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '@/features/auth/LoginPage/api';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { App } from 'antd';
export function useLogout() {
  const { modal } = App.useApp();

  const navigate = useNavigate();
  const logoutStore = useAuthStore((s) => s.logout);
  const { clearProjects } = useProjectStore();
  const { resetTabs } = useTabStore();
  const { clearServerMenus } = useMenuStore();

  const confirmLogout = () => {
    setTimeout(() => {
      modal.confirm({
        title: '로그아웃',
        content: '로그아웃 하시겠습니까?',
        okText: '로그아웃',
        cancelText: '취소',
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
