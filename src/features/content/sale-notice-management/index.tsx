import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** NPL Announcement > Sale Brokerage Notice — VPA07030201 / VPA070302P01 (menu A07030200). */
export default function SaleNoticeManagement() {
  return <PostBoard config={BOARDS.saleNotice} />;
}
