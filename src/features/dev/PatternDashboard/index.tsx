import { Tabs } from 'antd';
import TaskStats from '../TaskStats';
import ResourceStatus from '../ResourceStatus';
import SystemInfo from '../SystemInfo';

export default function PatternDashboard() {
  return (
    <div className="page-container page-scrollable">
      <Tabs
        defaultActiveKey="stats"
        destroyOnHidden
        className="ds-scrollable-tabs"
        items={[
          { key: 'stats',    label: '업무 통계',   children: <TaskStats /> },
          { key: 'resource', label: '리소스 현황', children: <ResourceStatus /> },
          { key: 'system',   label: '시스템 정보', children: <SystemInfo /> },
        ]}
      />
    </div>
  );
}
