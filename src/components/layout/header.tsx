import {
  UserOutlined,
  GlobalOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import vamcLogo from '@/assets/vamc-logo-login.png';
import {
  flagUkRound,
  flagVnRound,
  chevronDown,
  userCircleFill,
} from '@/assets/images';
import { useAuthStore } from '@/stores/auth-store';
import { useLocaleStore, type LocaleKey } from '@/stores/locale-store';
import { LOCALE_OPTIONS, getLocaleShortLabel } from '@/utils/locale-storage';

const FLAG_ICON_MAP: Partial<Record<LocaleKey, string>> = {
  en: flagUkRound,
  vn: flagVnRound,
};

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const { locale, setLocale } = useLocaleStore();

  const languageMenuItems: MenuProps['items'] = LOCALE_OPTIONS.map((option) => {
    const isSelected = locale === option.value;
    const itemFlagSrc = FLAG_ICON_MAP[option.value];

    return {
      key: option.value,
      icon: itemFlagSrc ? (
        <img
          src={itemFlagSrc}
          alt={option.shortLabel}
          className="w-4 h-4 rounded-full object-cover shrink-0"
        />
      ) : (
        <GlobalOutlined className="text-sm text-text-tertiary" />
      ),
      label: (
        <div className="flex items-center justify-between gap-4 min-w-[120px]">
          <span className={isSelected ? 'typo-b2-semibold text-text-brand' : 'typo-b2-regular text-text-primary'}>
            {option.label}
          </span>
          <span className="flex items-center gap-2">
            <span className="typo-b2-regular text-text-tertiary">{option.shortLabel}</span>
            {isSelected ? (
              <CheckOutlined className="text-text-brand text-xs" />
            ) : (
              <span className="inline-block w-3" />
            )}
          </span>
        </div>
      ),
    };
  });

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
