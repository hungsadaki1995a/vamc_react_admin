import TaskStats from '../TaskStats';

/**
 * Dashboard pattern — stat cards, progress bars and status distribution on one screen.
 */
export default function PatternDashboard() {
  return (
    <div className="page-container page-scrollable">
      <TaskStats />
    </div>
  );
}
