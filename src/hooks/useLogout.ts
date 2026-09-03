import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '@/api/common/authApi';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { useComponentLabel } from '@/hooks/useComponentLabel';
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
        title: tvh('logout', '로그아웃'),
        content: tsm('logoutConfirm', '로그아웃 하시겠습니까?'),
        okText: tvb('logout', '로그아웃'),
        cancelText: tvb('cancel', '취소'),
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
