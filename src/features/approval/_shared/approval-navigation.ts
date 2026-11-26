import { useEffect, useState } from 'react';
import { useTabContext } from '@/contexts/tab-context';
import { useTabStore } from '@/stores/tab-store';
import type { ApprovalInboxItem } from '@/api/common/approval-api';

// Hand-off from Approval Management (VPA10000001) to the screen that owns an approval target: the inbox opens the
// target menu with the inbox row as tab parameter; the screen calls `useApprovalTargetHandoff` and opens its popup
// (application → processing popup, contract / report → contract popup, termination → its tab, member sign-up →
// MemberApprovalModal).

export const APPROVAL_TARGET_PARAM = 'approvalTarget';

export function readApprovalTarget(params?: Record<string, unknown>): ApprovalInboxItem | null {
  const value = params?.[APPROVAL_TARGET_PARAM];
  if (value && typeof value === 'object' && 'atrzHstryId' in value) return value as ApprovalInboxItem;
  return null;
}

/**
 * Calls `onTarget` once per hand-off (each [Open] from the inbox sets new tab params, even for the same row), then
 * removes the parameter from the tab so a reload of the persisted tabs does not open the popup again.
 */
export function useApprovalTargetHandoff(onTarget: (item: ApprovalInboxItem) => void): void {
  const tab = useTabContext()?.tab;
  const params = tab?.params;
  const [seen, setSeen] = useState<Record<string, unknown> | undefined | null>(null);
  const target = readApprovalTarget(params);

  // Adjusting state while rendering (React docs: "storing information from previous renders").
  if (params !== seen) {
    setSeen(params);
    if (target) onTarget(target);
  }

  const tabKey = tab?.key;
  useEffect(() => {
    if (!tabKey || !target) return;
    useTabStore.setState((state) => ({
      tabs: state.tabs.map((t) => (t.key === tabKey ? { ...t, params: undefined } : t)),
    }));
  }, [tabKey, target]);
}
