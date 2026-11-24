import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** Notice Management — VPA07010001 / VPA070100P01 (menu A07010000). */
export default function NoticeManagement() {
  return <PostBoard config={BOARDS.notice} />;
}
