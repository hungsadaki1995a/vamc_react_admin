import PostBoard from '../_shared/post-board';
import { BOARDS } from '../_shared/board-config';

/** NPL Announcement > Sale Brokerage Notice — VPA002801 / VPA0028P01 (menu A04030200). */
export default function SaleNoticeManagement() {
  return <PostBoard config={BOARDS.saleNotice} />;
}
