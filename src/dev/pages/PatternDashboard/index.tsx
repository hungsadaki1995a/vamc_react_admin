import TaskStats from '../TaskStats';

/**
 * 대시보드 패턴 — 통계 카드 · 진행률 · 상태 분포를 한 화면에 배치하는 구성 예시.
 */
export default function PatternDashboard() {
  return (
    <div className="page-container page-scrollable">
      <TaskStats />
    </div>
  );
}
