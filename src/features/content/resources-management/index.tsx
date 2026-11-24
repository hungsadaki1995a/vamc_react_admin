import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > Resources Management — VPA07020301 / VPA070203P01 (menu A07020300). */
export default function ResourcesManagement() {
  return <PostBoard config={BOARDS.resources} />;
}
