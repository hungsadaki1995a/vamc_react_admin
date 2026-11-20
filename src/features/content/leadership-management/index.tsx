import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC Introduction > Leadership Management (menu A04080100). */
export default function LeadershipManagement() {
  return <PostBoard config={BOARDS.leadership} />;
}
