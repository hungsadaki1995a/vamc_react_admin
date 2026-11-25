import PostBoard from '../_shared/PostBoard';
import { BOARDS } from '../_shared/board-config';

/** NPL Announcement > Appraisal Notice — VPA07030101 / VPA070301P01 (menu A07030100). */
export default function AppraisalNoticeManagement() {
  return <PostBoard config={BOARDS.appraisalNotice} />;
}
