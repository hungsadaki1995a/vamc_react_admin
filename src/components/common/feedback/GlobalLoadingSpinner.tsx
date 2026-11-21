import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useLoadingStore } from '@/stores/loading-store';

export default function GlobalLoadingSpinner() {
  const isLoading = useLoadingStore((s) => s.count > 0);

  return <LoadingSpinner spinning={isLoading} fullscreen size="large" className="z-[9999]!" />;
}
