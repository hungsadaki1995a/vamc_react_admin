import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { useLocaleStore, type LocaleKey } from '@/stores/locale-store';
import { getLocaleShortLabel } from '@/utils/locale-storage';

interface LanguageOption {
  key: LocaleKey;
  name: string;
  shortName: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { key: 'en', name: 'English', shortName: 'Eng' },
  { key: 'ko', name: '한국어', shortName: 'Kor' },
  { key: 'vn', name: 'Tiếng Việt', shortName: 'Vie' },
];

export interface LanguageSelectorProps {
  className?: string;
}

/** Dropdown selector for switching the active UI locale. */
export default function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale } = useLocaleStore();

  const menuItems: MenuProps['items'] = LANGUAGE_OPTIONS.map((opt) => ({
    key: opt.key,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
        <span>{opt.name}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>{opt.shortName}</span>
      </div>
    ),
    icon: locale === opt.key ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
  }));

  return (
    <div className={className}>
      <Dropdown
        menu={{
          items: menuItems,
          selectedKeys: [locale],
          onClick: ({ key }) => setLocale(key as LocaleKey),
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', userSelect: 'none' }}>
          <GlobalOutlined style={{ fontSize: 13, color: 'var(--text-secondary, #666)' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
            {getLocaleShortLabel(locale)}
          </span>
          <DownOutlined style={{ fontSize: 9, opacity: 0.65, color: 'var(--text-tertiary, #999)' }} />
        </div>
      </Dropdown>
    </div>
  );
}
