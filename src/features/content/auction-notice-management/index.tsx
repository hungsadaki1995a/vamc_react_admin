import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** NPL Announcement > Online Auction Notice — VPA07030301 / VPA070303P01 (menu A07030300). */
export default function AuctionNoticeManagement() {
  return <PostBoard config={BOARDS.auctionNotice} />;
}
