import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC Introduction > Leadership Management (menu A07100500). */
export default function LeadershipManagement() {
  return <PostBoard config={BOARDS.leadership} />;
}
