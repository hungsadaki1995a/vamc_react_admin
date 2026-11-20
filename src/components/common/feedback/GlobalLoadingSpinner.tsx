import { Spin } from 'antd';
import { useLoadingStore } from '@/stores/loading-store';

const spinnerIndicator = (
  <svg
    viewBox="0 0 48 48"
    className="w-12 h-12 animate-[global-spinner-rotate_0.8s_linear_infinite]"
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="22" fill="none" stroke="#EAEAF1" strokeWidth="4" />
    <circle
      cx="24"
      cy="24"
      r="22"
      fill="none"
      stroke="#1876FF"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="36 103"
    />
  </svg>
);

export default function GlobalLoadingSpinner() {
  const isLoading = useLoadingStore((s) => s.count > 0);

  return (
    <>
      <style>{`
        @keyframes global-spinner-rotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Spin spinning={isLoading} fullscreen indicator={spinnerIndicator} className="z-[9999]!" />
    </>
  );
}
