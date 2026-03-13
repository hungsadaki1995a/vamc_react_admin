import { useState, useMemo, useCallback } from 'react';
import { Input, Select, Tag, Descriptions, Avatar, Space, Button } from 'antd';
import { SearchOutlined, UserOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import GridTable from '@/components/grid/GridTable';
import SplitPanel from '@/components/layout/SplitPanel';
import GridToolbar from '@/components/layout/GridToolbar';
import RichTextEditor from '@/components/editors/RichTextEditor';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

type IssueStatus = 'open' | 'in_progress' | 'closed';
type IssueSeverity = 'critical' | 'major' | 'minor';

interface Issue {
  id: string;
  title: string;
  project: string;
  status: IssueStatus;
  severity: IssueSeverity;
  assignee: string;
  reporter: string;
  description: string;
  createdAt: string;
}

const statusColors: Record<IssueStatus, string> = { open: 'red', in_progress: 'blue', closed: 'green' };
const statusLabels: Record<IssueStatus, string> = { open: '오픈', in_progress: '진행중', closed: '완료' };
const severityColors: Record<IssueSeverity, string> = { critical: 'red', major: 'orange', minor: 'default' };
const severityLabels: Record<IssueSeverity, string> = { critical: '치명적', major: '주요', minor: '경미' };

const mockData: Issue[] = [
  { id: 'ISS-001', title: '로그인 시 세션 만료 오류', project: 'ERP 시스템 구축', status: 'open', severity: 'critical', assignee: '김철수', reporter: '이미영', description: '로그인 후 10분 이내에 세션이 만료되는 문제. JWT 토큰 갱신 로직을 점검해야 함.', createdAt: '2024-02-10' },
  { id: 'ISS-002', title: 'UI 정렬 문제', project: '모바일 앱 개발', status: 'in_progress', severity: 'minor', assignee: '이영희', reporter: '박지성', description: '대시보드 카드 정렬이 모바일에서 깨지는 현상.', createdAt: '2024-02-09' },
  { id: 'ISS-003', title: 'API 응답 속도 저하', project: 'ERP 시스템 구축', status: 'open', severity: 'major', assignee: '박지성', reporter: '김철수', description: '프로젝트 목록 API 응답이 3초 이상 소요. DB 쿼리 최적화 필요.', createdAt: '2024-02-08' },
  { id: 'ISS-004', title: '다국어 번역 누락', project: '웹사이트 리뉴얼', status: 'closed', severity: 'minor', assignee: '최민수', reporter: '정수진', description: '설정 메뉴 일부 항목이 번역되지 않음.', createdAt: '2024-02-07' },
  { id: 'ISS-005', title: '데이터베이스 연결 끊김', project: '데이터 마이그레이션', status: 'in_progress', severity: 'critical', assignee: '정수진', reporter: '강동원', description: '대량 데이터 처리 시 DB 커넥션 풀 고갈. 커넥션 풀 사이즈 조정 필요.', createdAt: '2025-02-06' },
  { id: 'ISS-006', title: '모바일 화면 깨짐', project: '모바일 앱 개발', status: 'open', severity: 'major', assignee: '강동원', reporter: '윤서연', description: 'iOS 16에서 상세 화면 스크롤 시 레이아웃 깨짐.', createdAt: '2025-02-05' },
  { id: 'ISS-007', title: '검색 기능 오작동', project: 'ERP 시스템 구축', status: 'closed', severity: 'major', assignee: '윤서연', reporter: '임하늘', description: '특수문자 포함 검색 시 에러 발생. XSS 방어 로직 점검 필요.', createdAt: '2025-02-04' },
  { id: 'ISS-008', title: '아이콘 디자인 수정 요청', project: '웹사이트 리뉴얼', status: 'in_progress', severity: 'minor', assignee: '임하늘', reporter: '송민호', description: '네비게이션 아이콘 사이즈 통일 필요. 24px → 20px.', createdAt: '2025-02-03' },
  { id: 'ISS-009', title: '파일 업로드 실패', project: '모바일 앱 개발', status: 'open', severity: 'critical', assignee: '송민호', reporter: '한지민', description: '10MB 이상 파일 업로드 시 타임아웃. Nginx 설정 변경 필요.', createdAt: '2025-02-02' },
  { id: 'ISS-010', title: '권한 설정 오류', project: 'ERP 시스템 구축', status: 'closed', severity: 'major', assignee: '한지민', reporter: '김철수', description: '뷰어 권한으로 수정 가능한 페이지 존재. 권한 체크 로직 보완 필요.', createdAt: '2025-02-01' },
  { id: 'ISS-011', title: 'SSO 연동 인증 실패', project: '보안 강화 프로젝트', status: 'open', severity: 'critical', assignee: '윤서연', reporter: '이미영', description: 'SSO 토큰 발급 후 내부 시스템 인증 실패. SAML assertion 검증 로직 점검 필요.', createdAt: '2025-02-12' },
  { id: 'ISS-012', title: '대용량 엑셀 내보내기 메모리 오류', project: '데이터 분석 플랫폼', status: 'in_progress', severity: 'major', assignee: '김영수', reporter: '송태현', description: '5만 건 이상 데이터 엑셀 내보내기 시 OutOfMemoryError 발생. 스트리밍 방식으로 전환 필요.', createdAt: '2025-02-13' },
  { id: 'ISS-013', title: '간트 차트 날짜 표시 오류', project: '차세대 ERP 시스템', status: 'open', severity: 'minor', assignee: '최수진', reporter: '박정호', description: '2월 말일 이후 날짜가 다음 달로 넘어가는 표시 오류. dayjs 타임존 설정 점검.', createdAt: '2025-02-14' },
  { id: 'ISS-014', title: 'React Query 캐시 무효화 누락', project: '차세대 ERP 시스템', status: 'closed', severity: 'major', assignee: '이미영', reporter: '김영수', description: '저장 후 목록 갱신이 되지 않는 현상. onSuccess에서 invalidateQueries 호출 누락.', createdAt: '2025-02-15' },
  { id: 'ISS-015', title: '실시간 알림 수신 지연', project: 'AI 챗봇 도입', status: 'in_progress', severity: 'major', assignee: '정민우', reporter: '오하늘', description: 'WebSocket 연결 후 알림 수신까지 평균 3초 지연. 서버 이벤트 처리 큐 점검 필요.', createdAt: '2025-02-16' },
  { id: 'ISS-016', title: 'Dockerfile 이미지 빌드 실패', project: '클라우드 마이그레이션', status: 'closed', severity: 'critical', assignee: '임재혁', reporter: '권도현', description: 'node_modules 캐시 레이어 충돌로 Docker 빌드 실패. .dockerignore 설정 수정으로 해결.', createdAt: '2025-02-17' },
  { id: 'ISS-017', title: '다크모드 색상 변수 미적용', project: '차세대 ERP 시스템', status: 'open', severity: 'minor', assignee: '한지은', reporter: '최수진', description: 'CSS 변수로 정의되지 않은 하드코딩 색상이 다크모드에서 가시성 저하.', createdAt: '2025-02-18' },
  { id: 'ISS-018', title: 'AG Grid 행 선택 해제 안 됨', project: '데이터 분석 플랫폼', status: 'open', severity: 'minor', assignee: '송태현', reporter: '김영수', description: 'multiRow 선택 모드에서 빈 영역 클릭 시 선택 해제가 되지 않는 문제.', createdAt: '2025-02-19' },
  { id: 'ISS-019', title: 'JWT 만료 시 무한 리다이렉트', project: '차세대 ERP 시스템', status: 'in_progress', severity: 'critical', assignee: '박정호', reporter: '이미영', description: 'AccessToken 만료 후 silent refresh 실패 시 /login 리다이렉트 루프 발생.', createdAt: '2025-02-20' },
  { id: 'ISS-020', title: '조직도 트리 노드 확장 성능', project: '차세대 ERP 시스템', status: 'closed', severity: 'minor', assignee: '강민준', reporter: '오하늘', description: '500개 이상 노드 펼칠 때 렌더링 지연. 가상화(Virtual Scrolling) 적용 완료.', createdAt: '2025-02-21' },
];

const mockIssueComments: Record<string, { author: string; content: string; createdAt: string }[]> = {
  'ISS-001': [
    { author: '김철수', content: 'JWT refresh token 만료 시간 확인 중입니다.', createdAt: '2024-02-10 15:30' },
    { author: '이미영', content: '서버 로그에서 401 에러 빈번하게 발생하고 있습니다.', createdAt: '2024-02-11 09:00' },
  ],
  'ISS-003': [
    { author: '박지성', content: 'EXPLAIN 분석 결과 풀스캔 발생. 인덱스 추가 예정.', createdAt: '2024-02-09 11:00' },
  ],
};

function StatusRenderer(params: ICellRendererParams<Issue, IssueStatus>) {
  if (!params.value) return null;
  return <Tag color={statusColors[params.value]}>{statusLabels[params.value]}</Tag>;
}

function SeverityRenderer(params: ICellRendererParams<Issue, IssueSeverity>) {
  if (!params.value) return null;
  return <Tag color={severityColors[params.value]}>{severityLabels[params.value]}</Tag>;
}

export default function IssueList() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const filteredData = useMemo(
    () =>
      mockData.filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.id.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [searchText, statusFilter],
  );

  const columnDefs = useMemo<ColDef<Issue>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 100, flex: 0 },
      { field: 'title', headerName: '제목', minWidth: 200 },
      { field: 'status', headerName: '상태', width: 90, flex: 0, cellRenderer: StatusRenderer },
      { field: 'severity', headerName: '심각도', width: 90, flex: 0, cellRenderer: SeverityRenderer },
      { field: 'assignee', headerName: '담당자', width: 90, flex: 0 },
      { field: 'createdAt', headerName: '등록일', width: 110, flex: 0 },
    ],
    [],
  );

  const handleRowClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue);
  }, []);

  const comments = selectedIssue ? (mockIssueComments[selectedIssue.id] ?? []) : [];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="ds-section-header">
        <h2>이슈 트래커</h2>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <SplitPanel
          direction="horizontal"
          primaryMinSize={400}
          secondaryMinSize={300}
          secondaryVisible={!!selectedIssue}
        >
          {/* Left: Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <GridToolbar
              totalCount={filteredData.length}
              left={
                <Space>
                  <Input
                    placeholder="이슈 검색"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                    size="small"
                  />
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 110 }}
                    size="small"
                    options={[
                      { label: '전체 상태', value: 'all' },
                      { label: '오픈', value: 'open' },
                      { label: '진행중', value: 'in_progress' },
                      { label: '완료', value: 'closed' },
                    ]}
                  />
                </Space>
              }
              actions={<Button size="small" type="primary" icon={<PlusOutlined />}>등록</Button>}
            />
            <div style={{ flex: 1 }}>
              <GridTable<Issue>
                columnDefs={columnDefs}
                rowData={filteredData}
                rowKey="id"
                onRowClick={handleRowClick}
                pagination={false}
              />
            </div>
          </div>

          {/* Right: Detail */}
          <div style={{ height: '100%', overflow: 'auto', padding: 16, borderLeft: '1px solid var(--border-color)', background: 'var(--content-header-bg)' }}>
            {selectedIssue && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Tag color={severityColors[selectedIssue.severity]}>{severityLabels[selectedIssue.severity]}</Tag>
                  <Tag color={statusColors[selectedIssue.status]}>{statusLabels[selectedIssue.status]}</Tag>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{selectedIssue.id}</span>
                  <Button size="small" style={{ marginLeft: 'auto' }} onClick={() => setSelectedIssue(null)}>닫기</Button>
                </div>

                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{selectedIssue.title}</h3>

                <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="프로젝트">{selectedIssue.project}</Descriptions.Item>
                  <Descriptions.Item label="담당자">{selectedIssue.assignee}</Descriptions.Item>
                  <Descriptions.Item label="보고자">{selectedIssue.reporter}</Descriptions.Item>
                  <Descriptions.Item label="등록일">{selectedIssue.createdAt}</Descriptions.Item>
                </Descriptions>

                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>설명</div>
                <RichTextEditor
                  value={`<p>${selectedIssue.description}</p>`}
                  readOnly
                  toolbar="minimal"
                  minHeight={80}
                  maxHeight={200}
                />

                <div style={{ fontWeight: 600, fontSize: 13, margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageOutlined /> 댓글 ({comments.length})
                </div>

                {comments.length > 0 ? (
                  <div>
                    {comments.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <Avatar icon={<UserOutlined />} size={28} style={{ flexShrink: 0 }} />
                        <div>
                          <Space>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{c.createdAt}</span>
                          </Space>
                          <div style={{ fontSize: 13 }}>{c.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', padding: '8px 0', fontSize: 13 }}>댓글이 없습니다.</div>
                )}
              </>
            )}
          </div>
        </SplitPanel>
      </div>
    </div>
  );
}
