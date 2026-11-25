import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** Service Guide Management (menu A07110000). */
export default function ServiceGuideManagement() {
  return <PostBoard config={BOARDS.serviceGuide} />;
}
