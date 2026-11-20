import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC Introduction > Partners Management (menu A04080200). */
export default function PartnersManagement() {
  return <PostBoard config={BOARDS.partners} />;
}
