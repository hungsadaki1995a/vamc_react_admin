import { mockMenus } from '../data/menus';
import type { MnuResponse } from '@/api/menu';

// Mock data accessor for menu handlers.
// Used by setup.ts (axios-mock-adapter) via setupMocks().
export function getMockMenus(): MnuResponse[] {
  return mockMenus;
}
