import { useEffect, useRef, useState } from 'react';
import { useLoadingStore } from '@/stores/loadingStore';

export default function GlobalLoadingBar() {
  const count = useLoadingStore((s) => s.count);
  const isLoading = count > 0;

  // Track whether bar should still be visible (for fade-out after complete)
  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompleting(false);
      setVisible(true);
    } else if (visible) {
      setCompleting(true);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setCompleting(false);
      }, 400);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          background: 'var(--ant-color-primary, #1677ff)',
          transition: completing ? 'width 0.2s ease-out, opacity 0.2s ease-out 0.2s' : 'none',
          width: completing ? '100%' : undefined,
          opacity: completing ? 0 : 1,
          animation: completing ? 'none' : 'loading-bar-progress 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes loading-bar-progress {
          0%   { width: 0%;  margin-left: 0%; }
          50%  { width: 70%; margin-left: 15%; }
          100% { width: 0%;  margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
