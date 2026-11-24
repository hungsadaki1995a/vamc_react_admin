import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > Media Management — VPA07020201 / VPA070202P01 (menu A07020200). */
export default function MediaManagement() {
  return <PostBoard config={BOARDS.media} />;
}
