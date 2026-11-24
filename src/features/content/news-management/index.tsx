import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > News Management — VPA07020101 / VPA070201P01 (menu A07020100). */
export default function NewsManagement() {
  return <PostBoard config={BOARDS.news} />;
}
