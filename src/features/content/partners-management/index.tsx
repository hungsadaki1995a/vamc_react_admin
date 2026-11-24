import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** VAMC Introduction > Partners Management (menu A07100600). */
export default function PartnersManagement() {
  return <PostBoard config={BOARDS.partners} />;
}
