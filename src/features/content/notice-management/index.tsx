import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** Notice Management — VPA002301 / VPA0023P01 (menu A04010000). */
export default function NoticeManagement() {
  return <PostBoard config={BOARDS.notice} />;
}
