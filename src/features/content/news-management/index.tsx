import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > News Management — VPA002401 / VPA0024P01 (menu A04020100). */
export default function NewsManagement() {
  return <PostBoard config={BOARDS.news} />;
}
