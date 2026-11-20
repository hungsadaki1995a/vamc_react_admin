import type { MemberItem } from '@/features/member/member-list/member.types';

export type MemberFormModalProps = {
  visible: boolean;
  mode?: 'register' | 'edit';
  member?: MemberItem | null;
  onClose: () => void;
  onSuccess?: () => void;
};
