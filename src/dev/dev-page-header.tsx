import { useLocaleStore } from '@/stores/localeStore';
import { DEV_PAGE_TEXT } from './devPageText';

/**
 * 개발 도구 화면의 제목 줄.
 *
 * <p>화면마다 `ds-section-header` 마크업을 복사해 두던 것을 한 곳으로 모았다.
 * 문구는 `devPageText.ts` 가 언어별로 들고 있어 로케일을 바꾸면 따라 바뀐다.</p>
 *
 * <p>사전에 키가 없으면 아무것도 그리지 않는다 — 화면을 새로 만들고 사전 등록을
 * 잊었을 때, 한국어 제목이 남아 번역된 척하는 것보다 비어 있는 편이 눈에 띈다.</p>
 *
 * @example
 * <DevPageHeader page="GuideAgGrid" />
 */
export default function DevPageHeader({ page }: { page: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const text = DEV_PAGE_TEXT[page]?.[locale] ?? DEV_PAGE_TEXT[page]?.ko;
  if (!text) return null;

  return (
    <div className="ds-section-header">
      <h2>{text.title}</h2>
      {text.desc && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          {text.desc}
        </p>
      )}
    </div>
  );
}
