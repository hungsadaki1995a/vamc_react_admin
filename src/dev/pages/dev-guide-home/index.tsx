import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import type { LocaleKey } from '@/stores/localeStore';
import { SECTIONS, PAGE_TEXT } from './sections';
import styles from './index.module.css';
import { CONTENT_KO } from './content.ko';
import { CONTENT_EN } from './content.en';
import { CONTENT_VN } from './content.vn';

// ─────────────────────────────────────────────────────────────────────────────
// 신규 화면 개발 가이드 — 껍데기(목차·스크롤·로케일 선택)만 담는다.
//
// 본문은 content.{ko,en,vn}.tsx, 코드 예시는 snippets.ts, 공용 조각과 섹션 메타는
// parts.tsx 에 있다. 언어별로 페이지를 통째로 복제하지 않은 이유는 —
// 목차·앵커·스크롤 로직이 세 벌이 되면 한쪽만 고쳐지고 나머지가 조용히 낡기 때문이다.
//
// 이 화면의 문구는 DB 라벨을 쓰지 않는다. 개발 도구는 운영 번들에서 통째로 빠지는데
// `/api/lbl/bulk` 는 permitAll 전량 전송이라 라벨만 남아 모두에게 나간다.
// 판단 기준과 근거는 `@/config/devMenuLabels` 주석에 있다.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT: Record<LocaleKey, Record<string, React.ReactNode>> = {
  ko: CONTENT_KO,
  en: CONTENT_EN,
  vn: CONTENT_VN,
};

/**
 * 스크롤 컨테이너 기준의 섹션 위치(px).
 *
 * `offsetTop` 은 `offsetParent` 기준이라 스크롤 컨테이너와 다를 수 있어 쓰지 않는다 —
 * 컨테이너에 `position` 이 없으면 바깥 요소가 기준이 되어 그만큼 어긋난 위치에서 멈춘다.
 * 화면 좌표 차이로 구하면 조상 요소의 positioning 과 무관하게 항상 맞는다.
 */
function offsetWithin(container: HTMLElement, el: HTMLElement): number {
  return el.getBoundingClientRect().top
       - container.getBoundingClientRect().top
       + container.scrollTop;
}

export default function DevGuideHome() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const locale = useLocaleStore((s) => s.locale);
  const text = PAGE_TEXT[locale];
  const content = useMemo(() => CONTENT[locale] ?? CONTENT_KO, [locale]);

  const handleJump = useCallback((id: string) => {
    const body = bodyRef.current;
    const target = body?.querySelector<HTMLElement>(`#${id}`);
    if (!body || !target) return;
    // 제목 줄이 컨테이너 맨 위에 오도록 — 여백을 빼지 않는다
    body.scrollTo({ top: offsetWithin(body, target), behavior: 'smooth' });
    setActiveId(id);
  }, []);

  // 스크롤 위치로 현재 섹션을 표시한다 (본문이 스크롤 컨테이너라 window 가 아니다)
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const onScroll = () => {
      // 판정선을 제목 높이만큼 아래에 둔다 — 딱 맞춰 이동했을 때 반올림 오차로
      // 이전 섹션이 잡히지 않게 하려는 여유값이다.
      const line = body.scrollTop + 24;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = body.querySelector<HTMLElement>(`#${s.id}`);
        if (el && offsetWithin(body, el) <= line) current = s.id;
      }
      setActiveId(current);
    };

    body.addEventListener('scroll', onScroll, { passive: true });
    return () => body.removeEventListener('scroll', onScroll);
  }, []);

  // 언어를 바꿔도 스크롤 위치는 그대로 둔다 — 섹션 id 가 언어와 무관하게 같아서
  // 읽던 자리에 머무는 편이 낫다. 본문 높이가 달라진 만큼은 스크롤 감지가 바로 잡는다.

  return (
    <div className="page-container">
      <div className="ds-section-header">
        <h2>{text.title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          {text.desc}
        </p>
      </div>

      <div className={styles.root}>
        {/* ── 목차 */}
        <nav className={styles.toc}>
          <div className={styles.tocTitle}>{text.toc}</div>
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.tocItem} ${activeId === s.id ? styles.tocItemActive : ''}`}
              onClick={() => handleJump(s.id)}
            >
              <span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>
              <span>{s.title[locale]}</span>
            </button>
          ))}
        </nav>

        {/* ── 본문 */}
        <div className={styles.body} ref={bodyRef}>
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title[locale]}</h3>
              </div>
              {content[s.id]}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
