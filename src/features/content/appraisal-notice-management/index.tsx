import PostBoard from '../_shared/post-board';
import { BOARDS } from '../_shared/board-config';

/** NPL Announcement > Appraisal Notice — VPA002701 / VPA0027P01 (menu A04030100). */
export default function AppraisalNoticeManagement() {
  return <PostBoard config={BOARDS.appraisalNotice} />;
}
