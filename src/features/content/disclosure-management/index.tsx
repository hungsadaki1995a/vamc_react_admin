import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC News > Disclosure Management (menu A04020400). */
export default function DisclosureManagement() {
  return <PostBoard config={BOARDS.disclosure} />;
}
