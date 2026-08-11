import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import { apiNotify } from '@/lib/api/apiNotify';
import { getLocaleText } from '@/lib/i18n/localeText';
import koKR from 'antd/locale/ko_KR';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/queryClient';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';
import { PopupDocumentContext } from '@/contexts/PopupDocumentContext';

export interface ExternalWindowProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  height?: number;
  children: ReactNode;
}

function copyStyles(target: Window): void {
  document
    .querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel=stylesheet], style')
    .forEach((node) => {
      target.document.head.appendChild(node.cloneNode(true));
    });
}

export function ExternalWindow({
  open,
  onClose,
  title,
  width = 900,
  height = 650,
  children,
}: ExternalWindowProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const winRef = useRef<Window | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const mode = useThemeStore((state) => state.mode);
  const locale = useLocaleStore((state) => state.locale);
  const resolvedTitle = title ?? getLocaleText(locale, {
    ko: '팝업',
    en: 'Popup',
    vn: 'Cửa sổ bật lên',
  });

  useEffect(() => {
    if (!open) return;

    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

    const popup = window.open(
      '',
      `ds_popup_${Date.now()}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    if (!popup) {
      console.warn('[ExternalWindow] Popup blocked.');
      queueMicrotask(() =>
        apiNotify.warning(
          getLocaleText(locale, {
            ko: '팝업이 차단되었습니다. 브라우저 주소창에서 팝업을 허용한 후 다시 시도해 주세요.',
            en: 'The popup was blocked. Allow popups in your browser and try again.',
            vn: 'Cửa sổ bật lên đã bị chặn. Hãy cho phép cửa sổ bật lên trong trình duyệt rồi thử lại.',
          }),
        ),
      );
      onCloseRef.current();
      return;
    }

    winRef.current = popup;
    copyStyles(popup);

    const observer = new MutationObserver((mutations) => {
      for (const { addedNodes } of mutations) {
        addedNodes.forEach((node) => {
          const element = node as HTMLElement;
          if (!element.tagName) return;
          const tagName = element.tagName.toUpperCase();
          if (tagName === 'STYLE' || (tagName === 'LINK' && (element as HTMLLinkElement).rel === 'stylesheet')) {
            popup.document.head.appendChild(node.cloneNode(true));
          }
        });
      }
    });
    observer.observe(document.head, { childList: true });

    popup.document.documentElement.setAttribute(
      'data-theme',
      document.documentElement.getAttribute('data-theme') ?? 'light',
    );
    popup.document.title = resolvedTitle;

    const mainFavicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const faviconHref = mainFavicon?.href ?? `${window.location.origin}/favicon.ico`;
    const faviconLink = popup.document.createElement('link');
    faviconLink.rel = 'icon';
    faviconLink.href = faviconHref;
    popup.document.head.appendChild(faviconLink);

    popup.document.body.style.cssText = 'margin:0;padding:0;height:100vh;overflow:auto;';

    const div = popup.document.createElement('div');
    div.style.cssText = 'min-height:100%; position:relative;';
    popup.document.body.appendChild(div);
    // window.open 으로 만든 외부 문서의 DOM 노드라 렌더 중에는 만들 수 없다.
    // createPortal 대상이 되려면 state 로 올려야 하므로 effect 내 setState 가 불가피하다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContainer(div);

    const handleClose = () => {
      setContainer(null);
      onCloseRef.current();
    };
    popup.addEventListener('beforeunload', handleClose);

    return () => {
      observer.disconnect();
      setContainer(null);
      if (winRef.current && !winRef.current.closed) {
        winRef.current.removeEventListener('beforeunload', handleClose);
        winRef.current.close();
      }
      winRef.current = null;
    };
  }, [height, locale, open, resolvedTitle, width]);

  useEffect(() => {
    const popup = winRef.current;
    if (!popup || popup.closed) return;
    popup.document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  if (!container) return null;

  const antLocale = locale === 'en' ? enUS : locale === 'vn' ? viVN : koKR;

  return createPortal(
    <QueryClientProvider client={queryClient}>
      <PopupDocumentContext.Provider value={container}>
        <ConfigProvider
          locale={antLocale}
          getPopupContainer={() => container}
          theme={{
            algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
            token: { colorPrimary: '#1677ff', borderRadius: 6 },
          }}
        >
          <AntApp style={{ height: '100%' }} message={{ transitionName: '' }}>
            {children}
          </AntApp>
        </ConfigProvider>
      </PopupDocumentContext.Provider>
    </QueryClientProvider>,
    container,
  );
}
