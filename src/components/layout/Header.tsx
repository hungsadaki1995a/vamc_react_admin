import { UserOutlined } from '@ant-design/icons';
import vamcLogo from '@/assets/vamc-logo-login.png';
import { userCircleFill } from '@/assets/images';
import LanguageSelector from '@/components/common/LanguageSelector';
import { useAuthStore } from '@/stores/auth-store';

export default function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="app-header">
      <div className="flex items-center gap-4">
        <img
          src={vamcLogo}
          alt="VAMC"
          className="w-[42px] h-3 object-contain shrink-0"
        />
        <span className="typo-h4-semibold text-text-primary whitespace-nowrap">
          VAMC NPL Admin System
        </span>
      </div>

      <div className="flex items-center gap-4 h-7 shrink-0">
        <LanguageSelector />

        <div className="flex items-center gap-1.5">
          {userCircleFill ? (
            <img
              src={userCircleFill}
              alt=""
              aria-hidden="true"
              className="w-6 h-6 shrink-0"
            />
          ) : (
            <UserOutlined className="text-text-tertiary" />
          )}
          <span className="typo-b2-semibold text-text-tertiary whitespace-nowrap">
            {user?.usrNm ?? 'admin'}
          </span>
        </div>
      </div>
    </header>
  );
}
