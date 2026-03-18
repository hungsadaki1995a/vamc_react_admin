import { useState } from 'react';
import { Alert, Button, Card, Divider, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import CodeSnippet from '@/components/common/CodeSnippet';
import { ExcelButton } from '@/components/excel';
import { ExcelErrorModal } from '@/components/excel';
import { useExcel } from '@/hooks/useExcel';
import type { ExcelColumnDef, ExcelUploadResult } from '@/types/excel';

const { Text } = Typography;

// ── ExcelColumnDef 필드 테이블 ─────────────────────────────────────────────
type ColDefRow = { field: string; type: string; desc: string; key: string };
const colDefCols: TableColumnsType<ColDefRow> = [
  { title: '필드',     dataIndex: 'field', width: 110, render: (v) => <Text code>{v}</Text> },
  { title: '타입',     dataIndex: 'type',  width: 220, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '설명',     dataIndex: 'desc' },
];
const colDefRows: ColDefRow[] = [
  { key: '1', field: 'key',      type: 'string',                                    desc: '서버 Map 키 (camelCase). mapper 쿼리 컬럼명과 일치해야 함' },
  { key: '2', field: 'header',   type: 'string',                                    desc: '엑셀 헤더명. 업로드 시 이 값으로 컬럼 매핑' },
  { key: '3', field: 'width',    type: 'number?',                                   desc: '열 너비 (문자 단위). 기본값 15' },
  { key: '4', field: 'required', type: 'boolean?',                                  desc: '업로드 필수값 여부. true이면 빈값 시 에러 처리. 템플릿 헤더에 * 표시 및 빨간색 배경' },
  { key: '5', field: 'format',   type: "'text'|'number'|'date'|'datetime'",          desc: '셀 포맷. 업로드 시 형식 유효성 검사에도 사용 (date: yyyy-MM-dd, datetime: yyyy-MM-dd HH:mm:ss)' },
  { key: '6', field: 'readOnly', type: 'boolean?',                                  desc: '업로드 파싱 시 무시. 시스템 자동생성 컬럼(ID, 생성일 등)에 사용. 다운로드·템플릿에는 포함됨' },
];

// ── ExcelButton props 테이블 ───────────────────────────────────────────────
type PropRow = { prop: string; type: string; required: string; desc: string; key: string };
const propCols: TableColumnsType<PropRow> = [
  { title: 'Prop',       dataIndex: 'prop',     width: 160, render: (v) => <Text code>{v}</Text> },
  { title: '타입',       dataIndex: 'type',     width: 200, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '필수',       dataIndex: 'required', width: 60,  render: (v) => <Tag color={v === '✅' ? 'red' : 'default'}>{v}</Tag> },
  { title: '설명',       dataIndex: 'desc' },
];
const propRows: PropRow[] = [
  { key: '1', prop: 'columns',         type: 'ExcelColumnDef[]',          required: '✅', desc: '화면별 컬럼 정의 배열. 다운로드·업로드·템플릿 공유' },
  { key: '2', prop: 'downloadUrl',     type: 'string?',                   required: '—',  desc: 'POST 엔드포인트. 서버가 엑셀 파일을 스트리밍 반환. 없으면 다운로드 메뉴 미표시' },
  { key: '3', prop: 'uploadUrl',       type: 'string?',                   required: '—',  desc: 'POST multipart 엔드포인트. 없으면 업로드 메뉴 미표시' },
  { key: '4', prop: 'fileName',        type: 'string?',                   required: '—',  desc: '다운로드 파일명 (확장자 제외). 기본값 "download"' },
  { key: '5', prop: 'queryParams',     type: 'Record<string, unknown>?',  required: '—',  desc: '다운로드 시 서버로 전달할 조회 조건' },
  { key: '6', prop: 'onUploadSuccess', type: '() => void',                required: '—',  desc: '업로드 성공 후 콜백 (예: refetch)' },
  { key: '7', prop: 'disabled',        type: 'boolean?',                  required: '—',  desc: '버튼 비활성화. canWrite 권한 제어에 주로 사용' },
];

// ── 데모용 컬럼 정의 ──────────────────────────────────────────────────────
const DEMO_COLUMNS: ExcelColumnDef[] = [
  { key: 'prjId',   header: '프로젝트ID',  width: 14, readOnly: true },
  { key: 'prjNm',   header: '프로젝트명',  width: 28, required: true },
  { key: 'strtDt',  header: '시작일',      width: 14, format: 'date',   required: true },
  { key: 'endDt',   header: '종료일',      width: 14, format: 'date' },
  { key: 'budget',  header: '예산',        width: 16, format: 'number' },
  { key: 'mgrNm',   header: '담당자',      width: 16 },
];

// ── 에러 Modal 데모용 mock 데이터 ─────────────────────────────────────────
const MOCK_ERROR_RESULT: ExcelUploadResult = {
  success: false,
  totalRows: 1500,
  failRows: 3,
  errors: [
    { row: 5,  col: 'prjNm',  header: '프로젝트명', value: '',          message: '필수값입니다' },
    { row: 23, col: 'strtDt', header: '시작일',     value: 'abc',       message: '날짜 형식이 올바르지 않습니다 (yyyy-MM-dd)' },
    { row: 89, col: 'budget', header: '예산',       value: '-100abc',   message: '숫자 형식이 올바르지 않습니다' },
  ],
};

// ── 데모: 훅 직접 사용 예시 ──────────────────────────────────────────────
function HookDemo() {
  const { downloadTemplate, downloading, fileInputRef, handleFileChange, triggerUpload, uploading } =
    useExcel({ columns: DEMO_COLUMNS, fileName: '프로젝트목록_데모' });

  return (
    <Card size="small" title="useExcel 훅 — 개별 버튼 구성" style={{ marginBottom: 12 }}>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
             style={{ display: 'none' }} onChange={handleFileChange} />
      <Space wrap>
        <Button icon={<FileExcelOutlined />} loading={downloading} onClick={downloadTemplate}>
          템플릿 다운로드
        </Button>
        <Button icon={<FileExcelOutlined />} loading={uploading} onClick={triggerUpload}>
          파일 선택 (업로드 테스트)
        </Button>
      </Space>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        ※ 템플릿 다운로드는 실제 동작합니다. 업로드는 서버 연동 없이 파일 선택만 테스트.
      </div>
    </Card>
  );
}

// ── 데모: 에러 Modal ──────────────────────────────────────────────────────
function ErrorModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" danger onClick={() => setOpen(true)}>
        업로드 에러 Modal 미리보기
      </Button>
      <ExcelErrorModal
        open={open}
        result={MOCK_ERROR_RESULT}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GuideExcel() {
  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>엑셀 업로드 / 다운로드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          화면마다 <Text code>ExcelColumnDef[]</Text>를 선언하면
          <Text code>ExcelButton</Text> 하나로 다운로드·업로드·템플릿을 모두 처리합니다.
          최대 <strong>5만건</strong> 대응 (SAX 파싱 + MyBatis Cursor 스트리밍).
        </p>
      </div>

      {/* ── 아키텍처 개요 ── */}
      <Alert
        type="info"
        style={{ marginBottom: 16 }}
        title="아키텍처 개요"
        description={
          <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 13 }}>
            <li><Text code>ExcelColumnDef[]</Text> — 화면마다 한 번 선언 → 다운로드·업로드·템플릿 공유</li>
            <li><strong>다운로드</strong>: 서버가 Apache POI SXSSF(100행 윈도우) + MyBatis Cursor로 스트리밍 생성</li>
            <li><strong>업로드</strong>: SAX 이벤트 파싱 (메모리 안전) → 검증 → 전체 성공 시만 저장 (1건 실패 = 전체 롤백)</li>
            <li><strong>템플릿</strong>: <Text code>POST /api/excel/template</Text> — 공통 엔드포인트, 추가 구현 불필요</li>
            <li>에러 최대 100건 표시. 기존 <Text code>ExcelUtil + @ExcelColumn</Text> 방식과 공존</li>
          </ul>
        }
      />

      {/* ── ExcelColumnDef 필드 ── */}
      <Divider titlePlacement="left">ExcelColumnDef 필드</Divider>
      <Table columns={colDefCols} dataSource={colDefRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

      {/* ── ExcelButton Props ── */}
      <Divider titlePlacement="left">ExcelButton Props</Divider>
      <Table columns={propCols} dataSource={propRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

      {/* ── 라이브 데모 ── */}
      <Divider titlePlacement="left">라이브 데모</Divider>

      <Card size="small" title="ExcelButton — 드롭다운 버튼 (다운로드·업로드·템플릿)" style={{ marginBottom: 12 }}>
        <Space>
          <ExcelButton
            columns={DEMO_COLUMNS}
            fileName="프로젝트목록_데모"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            ※ downloadUrl·uploadUrl 미지정 → 템플릿만 표시. 템플릿 다운로드는 실제 동작.
          </Text>
        </Space>
      </Card>

      <HookDemo />

      <Card size="small" title="ExcelErrorModal — 업로드 실패 시 에러 목록" style={{ marginBottom: 24 }}>
        <Space>
          <ErrorModalDemo />
          <Text type="secondary" style={{ fontSize: 12 }}>
            mock 데이터: 총 1,500행 중 3행 오류
          </Text>
        </Space>
      </Card>

      {/* ── 코드 예시 ── */}
      <Divider titlePlacement="left">코드 예시</Divider>

      <CodeSnippet title="기본 사용법 — ExcelButton" code={`import { ExcelButton } from '@/components/excel';
import type { ExcelColumnDef } from '@/types/excel';
import { useMenuPermission } from '@/hooks/useMenuPermission';

// 1. 화면별 컬럼 정의 (한 번 선언 → 다운로드·업로드·템플릿 공유)
const columns: ExcelColumnDef[] = [
  { key: 'prjId',  header: '프로젝트ID', width: 14, readOnly: true },   // readOnly: 업로드 시 무시
  { key: 'prjNm',  header: '프로젝트명', width: 28, required: true },    // required: 업로드 필수
  { key: 'strtDt', header: '시작일',     width: 14, format: 'date', required: true },
  { key: 'budget', header: '예산',       width: 16, format: 'number' },
];

function MyPage() {
  const { canWrite } = useMenuPermission();
  const [filters, setFilters] = useState({ status: 'A' });

  return (
    <ExcelButton
      columns={columns}
      downloadUrl="/api/prj/excel"           // POST → 서버 스트리밍
      uploadUrl="/api/prj/excel/upload"      // POST multipart
      fileName="프로젝트목록"
      queryParams={{ status: filters.status }} // 다운로드 조회 조건
      onUploadSuccess={refetch}
      disabled={!canWrite}                   // 권한 연동
    />
  );
}`} />

      <CodeSnippet title="훅 직접 사용 — 버튼을 직접 구성할 때" code={`import { useExcel } from '@/hooks/useExcel';
import { ExcelErrorModal } from '@/components/excel';

function MyToolbar() {
  const {
    download, triggerUpload, downloadTemplate,
    downloading, uploading,
    fileInputRef, handleFileChange,   // hidden input 바인딩 필수
    errorModalProps,
  } = useExcel({
    columns,
    downloadUrl: '/api/prj/excel',
    uploadUrl:   '/api/prj/excel/upload',
    fileName:    '프로젝트목록',
    queryParams: { status: filters.status },
    onUploadSuccess: refetch,
  });

  return (
    <>
      {/* hidden input — JSX에 반드시 포함 */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
             style={{ display: 'none' }} onChange={handleFileChange} />

      <Button onClick={download}          loading={downloading}>다운로드</Button>
      <Button onClick={triggerUpload}     loading={uploading}>업로드</Button>
      <Button onClick={downloadTemplate}>템플릿</Button>

      <ExcelErrorModal {...errorModalProps} />
    </>
  );
}`} />

      <CodeSnippet title="백엔드 — Controller / Service / Mapper" code={`// ── Controller ─────────────────────────────────────────────────────────────
@PostMapping("/excel")
public void download(HttpServletResponse response,
                     @RequestBody ExcelDownloadRequest req) throws IOException {
    service.downloadExcel(response, req);
}

@PostMapping("/excel/upload")
public ApiResponse<ExcelParseResult> upload(
        @RequestPart MultipartFile file,
        @RequestPart String columns) throws IOException {
    List<ExcelColumnDef> cols = objectMapper.readValue(columns, new TypeReference<>() {});
    return ApiResponse.success(service.upload(file, cols));
}

// ── Service ─────────────────────────────────────────────────────────────────
// @Transactional(readOnly = true) 필수 — 없으면 Cursor 조기 종료
@Transactional(readOnly = true)
public void downloadExcel(HttpServletResponse response, ExcelDownloadRequest req) throws IOException {
    try (Cursor<Map<String, Object>> cursor = mapper.selectForExcel(req.getQueryParams())) {
        DynamicExcelUtil.downloadWithCursor(response, req.getFileName(), req.getColumns(), cursor);
    }
}

// @Transactional — 에러 시 전체 롤백
@Transactional
public ExcelParseResult upload(MultipartFile file, List<ExcelColumnDef> columns) throws IOException {
    ExcelParseResult result = DynamicExcelUtil.parse(file, columns);
    if (!result.isSuccess()) return result;   // 에러 있으면 저장 없이 반환
    mapper.batchInsert(result.getData());
    return result;
}

// ── Mapper ── fetchSize 필수 (MariaDB Cursor 스트리밍)
@Select("SELECT prj_id, prj_nm, strt_dt, end_dt, budget, mgr_nm FROM t_prj WHERE ...")
@Options(fetchSize = Integer.MIN_VALUE, resultSetType = ResultSetType.FORWARD_ONLY)
Cursor<Map<String, Object>> selectForExcel(Map<String, Object> params);`} />

      <CodeSnippet title="업로드 응답 구조 (ExcelParseResult)" code={`// 성공 시
{ success: true,  totalRows: 1500, failRows: 0, errors: null }

// 실패 시 (전체 롤백, 저장 없음)
{
  success: false,
  totalRows: 1500,
  failRows: 3,
  errors: [
    { row: 5,  col: "prjNm",  header: "프로젝트명", value: "",       message: "필수값입니다" },
    { row: 23, col: "strtDt", header: "시작일",     value: "abc",    message: "날짜 형식이 올바르지 않습니다 (yyyy-MM-dd)" },
    { row: 89, col: "budget", header: "예산",       value: "-100abc", message: "숫자 형식이 올바르지 않습니다" },
  ]
  // 에러 최대 100건. 초과 시 Modal에 안내 문구 자동 표시
}`} />
    </div>
  );
}
