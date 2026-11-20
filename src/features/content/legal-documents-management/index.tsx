import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** Legal Documents Management — VPA003301 / VPA0033P01 (menu A04070000). */
export default function LegalDocumentsManagement() {
  return <PostBoard config={BOARDS.legal} />;
}
