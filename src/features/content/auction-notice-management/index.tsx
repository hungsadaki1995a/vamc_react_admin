import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** NPL Announcement > Online Auction Notice — VPA002901 / VPA0029P01 (menu A04030300). */
export default function AuctionNoticeManagement() {
  return <PostBoard config={BOARDS.auctionNotice} />;
}
