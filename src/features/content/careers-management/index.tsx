import PostBoard from '../_shared/post-board';
import { BOARDS } from '../_shared/board-config';

/** Careers Management — VPA003401 / VPA0034P01 (menu A04090000). */
export default function CareersManagement() {
  return <PostBoard config={BOARDS.careers} />;
}
