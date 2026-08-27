import { useState, useMemo } from 'react';
import { DatePicker, Select, Space, Tag } from 'antd';
import GridTable from '@/components/grid/GridTable';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

type ActivityType = '로그인' | '조회' | '수정' | '삭제';

interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  activity: ActivityType;
  target: string;
  ipAddress: string;
}

const activityColors: Record<ActivityType, string> = {
  '로그인': 'blue',
  '조회': 'green',
  '수정': 'orange',
  '삭제': 'red',
};

const mockLogs: AuditLogItem[] = [
  { id: '1', timestamp: '2024-02-12 14:35:22', user: '김철수', activity: '로그인', target: '시스템', ipAddress: '192.168.1.100' },
  { id: '2', timestamp: '2024-02-12 14:32:15', user: '이영희', activity: '수정', target: '프로젝트: 웹사이트 리뉴얼', ipAddress: '192.168.1.105' },
  { id: '3', timestamp: '2024-02-12 14:28:45', user: '박민수', activity: '조회', target: '보고서: 2월 진행현황', ipAddress: '192.168.1.110' },
  { id: '4', timestamp: '2024-02-12 14:25:33', user: '정수진', activity: '삭제', target: '작업: 테스트 작업', ipAddress: '192.168.1.115' },
  { id: '5', timestamp: '2024-02-12 14:20:18', user: '최동욱', activity: '로그인', target: '시스템', ipAddress: '192.168.1.120' },
  { id: '6', timestamp: '2024-02-12 14:15:50', user: '강지훈', activity: '수정', target: '직원정보: EMP003', ipAddress: '192.168.1.125' },
  { id: '7', timestamp: '2024-02-12 14:10:22', user: '윤서연', activity: '조회', target: '부서목록', ipAddress: '192.168.1.130' },
  { id: '8', timestamp: '2024-02-12 14:05:15', user: '임재현', activity: '로그인', target: '시스템', ipAddress: '192.168.1.135' },
  { id: '9', timestamp: '2024-02-12 14:00:45', user: '한예진', activity: '수정', target: '역할권한: 개발자', ipAddress: '192.168.1.140' },
  { id: '10', timestamp: '2024-02-12 13:55:30', user: '오태양', activity: '조회', target: '프로젝트: 모바일앱 개발', ipAddress: '192.168.1.145' },
  { id: '11', timestamp: '2024-02-12 13:50:12', user: '송미래', activity: '삭제', target: '파일: old_document.pdf', ipAddress: '192.168.1.150' },
  { id: '12', timestamp: '2024-02-12 13:45:28', user: '권도현', activity: '로그인', target: '시스템', ipAddress: '192.168.1.155' },
  { id: '13', timestamp: '2024-02-12 13:40:55', user: '장하늘', activity: '수정', target: '작업: UI 디자인 수정', ipAddress: '192.168.1.160' },
  { id: '14', timestamp: '2024-02-12 13:35:40', user: '신지우', activity: '조회', target: '감사로그', ipAddress: '192.168.1.165' },
  { id: '15', timestamp: '2024-02-12 13:30:15', user: '배성호', activity: '로그인', target: '시스템', ipAddress: '192.168.1.170' },
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
      { field: 'timestamp', headerName: '시간', width: 180, flex: 0 },
      { field: 'user', headerName: '사용자', width: 120, flex: 0 },
      { field: 'activity', headerName: '활동', width: 100, flex: 0, cellRenderer: ActivityRenderer },
      { field: 'target', headerName: '대상', minWidth: 200 },
      { field: 'ipAddress', headerName: 'IP주소', width: 150, flex: 0 },
    ],
    [],
  );

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>감사 로그</h2>
      </div>
      <Space style={{ marginBottom: 16 }} size="middle">
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          placeholder={['시작일', '종료일']}
        />
        <Select
          placeholder="활동 유형"
          style={{ width: 150 }}
          value={selectedActivity}
          onChange={setSelectedActivity}
          allowClear
          options={[
            { label: '로그인', value: '로그인' },
            { label: '조회', value: '조회' },
            { label: '수정', value: '수정' },
            { label: '삭제', value: '삭제' },
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
