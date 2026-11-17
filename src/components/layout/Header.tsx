import {
  LogoutOutlined,
  UserOutlined,
  GlobalOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import vamcLogo from '@/assets/vamc_logo_login-28c7ab.png';
import {
  flagUkRound,
  flagVnRound,
  chevronDown,
  userCircleFill,
} from '@/assets/images';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';
import { useLogout } from '@/hooks/useLogout';
import { getLocaleShortLabel } from '@/utils/localeStorage';

const FLAG_ICON_MAP: Partial<Record<LocaleKey, string>> = {
  en: flagUkRound,
  vn: flagVnRound,
};

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const { locale, setLocale } = useLocaleStore();
  const confirmLogout = useLogout();

  const languageMenuItems: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <div className="flex items-center justify-between gap-4 min-w-[105px]">
          <span>English</span>
          <span className="typo-b2-regular text-text-tertiary">Eng</span>
        </div>
      ),
      icon: locale === 'en' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span className="inline-block w-[14px]" />,
    },
    {
      key: 'vn',
      label: (
        <div className="flex items-center justify-between gap-4 min-w-[105px]">
          <span>Tiếng Việt</span>
          <span className="typo-b2-regular text-text-tertiary">Vie</span>
        </div>
      ),
      icon: locale === 'vn' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span className="inline-block w-[14px]" />,
    },
    {
      key: 'ko',
      label: (
        <div className="flex items-center justify-between gap-4 min-w-[105px]">
          <span>한국어</span>
          <span className="typo-b2-regular text-text-tertiary">Kor</span>
        </div>
      ),
      icon: locale === 'ko' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span className="inline-block w-[14px]" />,
    },
  ];

  const profileItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: locale === 'ko' ? '로그아웃' : locale === 'vn' ? 'Đăng xuất' : 'Sign Out',
      danger: true,
      onClick: confirmLogout,
    },
  ];

  const flagSrc = FLAG_ICON_MAP[locale];

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
        <Dropdown
          menu={{
            items: languageMenuItems,
            selectedKeys: [locale],
            onClick: ({ key }) => setLocale(key as LocaleKey),
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button
            type="button"
            className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            {flagSrc ? (
              <img
                src={flagSrc}
                alt={getLocaleShortLabel(locale)}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-6 h-6 rounded-full inline-flex items-center justify-center bg-bg-secondary text-text-tertiary shrink-0">
                <GlobalOutlined className="text-sm" />
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="typo-b1-medium text-text-tertiary">
                {getLocaleShortLabel(locale)}
              </span>
              <img src={chevronDown} alt="" aria-hidden="true" className="w-[14px] h-[14px] shrink-0" />
            </span>
          </button>
        </Dropdown>

        <Dropdown menu={{ items: profileItems }} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
          >
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
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
