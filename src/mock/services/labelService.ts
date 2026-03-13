import { mockLabels } from '@/mock/labels';

export async function mockLoadLabels(): Promise<Record<string, string>> {
  return mockLabels;
}
