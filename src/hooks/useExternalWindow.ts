import { useCallback, useMemo, useState } from 'react';

export interface UseExternalWindowReturn {
  open: boolean;
  openWindow: () => void;
  closeWindow: () => void;
}

/** ExternalWindow 컴포넌트의 열림/닫힘 상태를 관리하는 훅 */
export function useExternalWindow(): UseExternalWindowReturn {
  const [open, setOpen] = useState(false);

  const openWindow = useCallback(() => setOpen(true), []);
  const closeWindow = useCallback(() => setOpen(false), []);

  return useMemo(
    () => ({ open, openWindow, closeWindow }),
    [open, openWindow, closeWindow],
  );
}
