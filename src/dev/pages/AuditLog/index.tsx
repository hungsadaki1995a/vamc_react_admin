import { useState, useMemo } from 'react';
import { DatePicker, Select, Space, Tag } from 'antd';
import GridTable from '@/components/grid/GridTable';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import DevPageHeader from '@/dev/DevPageHeader';

const { RangePicker } = DatePicker;

type ActivityType = 'Login' | 'View' | 'Update' | 'Delete';

interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  activity: ActivityType;
  target: string;
  ipAddress: string;
}

const activityColors: Record<ActivityType, string> = {
  'Login': 'blue',
  'View': 'green',
  'Update': 'orange',
  'Delete': 'red',
};

const mockLogs: AuditLogItem[] = [
  { id: '1', timestamp: '2024-02-12 14:35:22', user: 'Michael Chen', activity: 'Login', target: 'System', ipAddress: '192.168.1.100' },
  { id: '2', timestamp: '2024-02-12 14:32:15', user: 'Emily Park', activity: 'Update', target: 'Project: Website renewal', ipAddress: '192.168.1.105' },
  { id: '3', timestamp: '2024-02-12 14:28:45', user: 'David Kim', activity: 'View', target: 'Report: February progress', ipAddress: '192.168.1.110' },
  { id: '4', timestamp: '2024-02-12 14:25:33', user: 'Anna Brooks', activity: 'Delete', target: 'Task: Test task', ipAddress: '192.168.1.115' },
  { id: '5', timestamp: '2024-02-12 14:20:18', user: 'Peter Han', activity: 'Login', target: 'System', ipAddress: '192.168.1.120' },
  { id: '6', timestamp: '2024-02-12 14:15:50', user: 'Chris Kang', activity: 'Update', target: 'Employee record: EMP003', ipAddress: '192.168.1.125' },
  { id: '7', timestamp: '2024-02-12 14:10:22', user: 'Laura Yoon', activity: 'View', target: 'Department list', ipAddress: '192.168.1.130' },
  { id: '8', timestamp: '2024-02-12 14:05:15', user: 'Jason Lim', activity: 'Login', target: 'System', ipAddress: '192.168.1.135' },
  { id: '9', timestamp: '2024-02-12 14:00:45', user: 'Grace Han', activity: 'Update', target: 'Role permissions: Developer', ipAddress: '192.168.1.140' },
  { id: '10', timestamp: '2024-02-12 13:55:30', user: 'Ryan Oh', activity: 'View', target: 'Project: Mobile app development', ipAddress: '192.168.1.145' },
  { id: '11', timestamp: '2024-02-12 13:50:12', user: 'Mia Song', activity: 'Delete', target: 'File: old_document.pdf', ipAddress: '192.168.1.150' },
  { id: '12', timestamp: '2024-02-12 13:45:28', user: 'Kevin Kwon', activity: 'Login', target: 'System', ipAddress: '192.168.1.155' },
  { id: '13', timestamp: '2024-02-12 13:40:55', user: 'Daniel Jang', activity: 'Update', target: 'Task: UI design revision', ipAddress: '192.168.1.160' },
  { id: '14', timestamp: '2024-02-12 13:35:40', user: 'Olivia Shin', activity: 'View', target: 'Audit log', ipAddress: '192.168.1.165' },
  { id: '15', timestamp: '2024-02-12 13:30:15', user: 'Brian Bae', activity: 'Login', target: 'System', ipAddress: '192.168.1.170' },
];

function ActivityRenderer(params: ICellRendererParams<AuditLogItem, ActivityType>) {
  if (!params.value) return null;
  return <Tag color={activityColors[params.value]}>{params.value}</Tag>;
}

export default function AuditLog() {
  const [selectedActivity, setSelectedActivity] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const filteredLogs = useMemo(
    () => mockLogs.filter((log) => !selectedActivity || log.activity === selectedActivity),
    [selectedActivity],
  );

  const columnDefs = useMemo<ColDef<AuditLogItem>[]>(
    () => [
      { field: 'timestamp', headerName: 'Time', width: 180, flex: 0 },
      { field: 'user', headerName: 'User', width: 120, flex: 0 },
      { field: 'activity', headerName: 'Activity', width: 100, flex: 0, cellRenderer: ActivityRenderer },
      { field: 'target', headerName: 'Target', minWidth: 200 },
      { field: 'ipAddress', headerName: 'IP address', width: 150, flex: 0 },
    ],
    [],
  );

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="AuditLog" />
      <Space style={{ marginBottom: 16 }} size="middle">
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          placeholder={['Start date', 'End date']}
        />
        <Select
          placeholder="Activity type"
          style={{ width: 150 }}
          value={selectedActivity}
          onChange={setSelectedActivity}
          allowClear
          options={[
            { label: 'Login', value: 'Login' },
            { label: 'View', value: 'View' },
            { label: 'Update', value: 'Update' },
            { label: 'Delete', value: 'Delete' },
          ]}
        />
      </Space>
      <GridTable<AuditLogItem>
        columnDefs={columnDefs}
        rowData={filteredLogs}
        rowKey="id"
      />
    </div>
  );
}
