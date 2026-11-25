import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** Legal Documents Management — VPA07070001 / VPA070700P01 (menu A07070000). */
export default function LegalDocumentsManagement() {
  return <PostBoard config={BOARDS.legal} />;
}
