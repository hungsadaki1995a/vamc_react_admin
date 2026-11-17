import PostBoard from '../_shared/post-board';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > Resources Management — VPA002601 / VPA0026P01 (menu A04020300). */
export default function ResourcesManagement() {
  return <PostBoard config={BOARDS.resources} />;
}
