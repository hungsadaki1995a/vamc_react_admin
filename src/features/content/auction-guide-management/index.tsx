import PostBoard from '../_shared/post-board';
import { BOARDS } from '../_shared/board-config';

/** Auction Guide Management — AUC page of the service guide board (menu A04120000). */
export default function AuctionGuideManagement() {
  return <PostBoard config={BOARDS.auctionGuide} />;
}
