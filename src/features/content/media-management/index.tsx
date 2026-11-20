import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > Media Management — VPA002501 / VPA0025P01 (menu A04020200). */
export default function MediaManagement() {
  return <PostBoard config={BOARDS.media} />;
}
