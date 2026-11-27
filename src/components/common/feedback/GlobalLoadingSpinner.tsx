import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useLoadingStore } from '@/stores/loading-store';
import styles from './global-loading.module.scss';

/** Overlay delay: a write that answers fast never flashes the screen. */
const OVERLAY_DELAY_MS = 300;

/**
 * Global request feedback. Reads (lists, lookups, refetches) only show a thin top bar — tables keep their own
 * `loading` — so the screen stays usable; writes and downloads block it with the spinner against double submits.
 */
export default function GlobalLoadingSpinner() {
  const busy = useLoadingStore((s) => s.background + s.blocking > 0);
  const blocking = useLoadingStore((s) => s.blocking > 0);

  return (
    <>
      <div className={styles.topBar} data-active={busy || undefined} role="progressbar" aria-hidden={!busy} aria-busy={busy} />
      <LoadingSpinner spinning={blocking} delay={OVERLAY_DELAY_MS} fullscreen size="large" className="z-[9999]!" />
    </>
  );
}
