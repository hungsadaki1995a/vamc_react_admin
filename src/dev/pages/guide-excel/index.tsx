import { useState } from 'react';
import { Alert, Button, Card, Divider, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import CodeSnippet from '@/components/common/CodeSnippet';
import { ExcelButton } from '@/components/excel';
import { ExcelErrorModal } from '@/components/excel';
import { useExcel } from '@/hooks/useExcel';
import type { ExcelColumnDef, ExcelUploadResult } from '@/types/excel';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

// ── ExcelColumnDef field table ────────────────────────────────────────────
type ColDefRow = { field: string; type: string; desc: string; key: string };
const colDefCols: TableColumnsType<ColDefRow> = [
  { title: 'Field',    dataIndex: 'field', width: 110, render: (v) => <Text code>{v}</Text> },
  { title: 'Type',     dataIndex: 'type',  width: 220, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Description', dataIndex: 'desc' },
];
const colDefRows: ColDefRow[] = [
  { key: '1', field: 'key',      type: 'string',                                    desc: 'Server map key (camelCase). Must match the column name in the mapper query' },
  { key: '2', field: 'header',   type: 'string',                                    desc: 'Excel header text. Columns are matched by this value on upload' },
  { key: '3', field: 'width',    type: 'number?',                                   desc: 'Column width in characters. Defaults to 15' },
  { key: '4', field: 'required', type: 'boolean?',                                  desc: 'Whether the value is required on upload. When true, an empty cell is an error; the template header gets a * and a red background' },
  { key: '5', field: 'format',   type: "'text'|'number'|'date'|'datetime'",          desc: 'Cell format. Also used to validate the value on upload (date: yyyy-MM-dd, datetime: yyyy-MM-dd HH:mm:ss)' },
  { key: '6', field: 'readOnly', type: 'boolean?',                                  desc: 'Ignored when parsing an upload. Use it for system-generated columns (ID, created date, …). Still included in downloads and templates' },
];

// ── ExcelButton props table ───────────────────────────────────────────────
type PropRow = { prop: string; type: string; required: string; desc: string; key: string };
const propCols: TableColumnsType<PropRow> = [
  { title: 'Prop',       dataIndex: 'prop',     width: 160, render: (v) => <Text code>{v}</Text> },
  { title: 'Type',       dataIndex: 'type',     width: 200, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Required',   dataIndex: 'required', width: 60,  render: (v) => <Tag color={v === '✅' ? 'red' : 'default'}>{v}</Tag> },
  { title: 'Description', dataIndex: 'desc' },
];
const propRows: PropRow[] = [
  { key: '1', prop: 'columns',         type: 'ExcelColumnDef[]',          required: '✅', desc: 'Per-screen column definitions, shared by download, upload and template' },
  { key: '2', prop: 'downloadUrl',     type: 'string?',                   required: '—',  desc: 'POST endpoint. The server streams back the Excel file. Omit it and the download menu is hidden' },
  { key: '3', prop: 'uploadUrl',       type: 'string?',                   required: '—',  desc: 'POST multipart endpoint. Omit it and the upload menu is hidden' },
  { key: '4', prop: 'fileName',        type: 'string?',                   required: '—',  desc: 'Download filename without the extension. Defaults to "download"' },
  { key: '5', prop: 'queryParams',     type: 'Record<string, unknown>?',  required: '—',  desc: 'Search conditions sent to the server on download' },
  { key: '6', prop: 'onUploadSuccess', type: '() => void',                required: '—',  desc: 'Callback fired after a successful upload (e.g. refetch)' },
  { key: '7', prop: 'disabled',        type: 'boolean?',                  required: '—',  desc: 'Disables the button. Normally driven by the canWrite permission' },
];

// ── Column definitions used by the demo ───────────────────────────────────
const DEMO_COLUMNS: ExcelColumnDef[] = [
  { key: 'prjId',   header: 'Project ID', width: 14, readOnly: true },
  { key: 'prjNm',   header: 'Project name', width: 28, required: true },
  { key: 'strtDt',  header: 'Start date', width: 14, format: 'date',   required: true },
  { key: 'endDt',   header: 'End date',   width: 14, format: 'date' },
  { key: 'budget',  header: 'Budget',     width: 16, format: 'number' },
  { key: 'mgrNm',   header: 'Manager',    width: 16 },
];

// ── Mock data for the error modal demo ────────────────────────────────────
const MOCK_ERROR_RESULT: ExcelUploadResult = {
  success: false,
  totalRows: 1500,
  failRows: 3,
  errors: [
    { row: 5,  col: 'prjNm',  header: 'Project name', value: '',       message: 'This field is required' },
    { row: 23, col: 'strtDt', header: 'Start date', value: 'abc',      message: 'Invalid date format (yyyy-MM-dd)' },
    { row: 89, col: 'budget', header: 'Budget',     value: '-100abc',  message: 'Invalid number format' },
  ],
};

// ── Demo: using the hook directly ────────────────────────────────────────
function HookDemo() {
  const { downloadTemplate, downloading, fileInputRef, handleFileChange, triggerUpload, uploading } =
    useExcel({ columns: DEMO_COLUMNS, fileName: 'project_list_demo' });

  return (
    <Card size="small" title="useExcel hook — building your own buttons" style={{ marginBottom: 12 }}>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
             style={{ display: 'none' }} onChange={handleFileChange} />
      <Space wrap>
        <Button icon={<FileExcelOutlined />} loading={downloading} onClick={downloadTemplate}>
          Download template
        </Button>
        <Button icon={<FileExcelOutlined />} loading={uploading} onClick={triggerUpload}>
          Choose a file (upload test)
        </Button>
      </Space>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        Note: the template download really works. The upload only tests file selection — no server call.
      </div>
    </Card>
  );
}

// ── Demo: error modal ─────────────────────────────────────────────────────
function ErrorModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" danger onClick={() => setOpen(true)}>
        Preview the upload error modal
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
      <DevPageHeader page="GuideExcel" />

      {/* ── Architecture overview ── */}
      <Alert
        type="info"
        style={{ marginBottom: 16 }}
        title="Architecture overview"
        description={
          <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 13 }}>
            <li><Text code>ExcelColumnDef[]</Text> — declared once per screen and shared by download, upload and template</li>
            <li><strong>Download</strong>: the server streams the file with Apache POI SXSSF (100-row window) and a MyBatis cursor</li>
            <li><strong>Upload</strong>: SAX event parsing (memory safe) → validation → saved only if every row passes (one failure rolls back everything)</li>
            <li><strong>Template</strong>: <Text code>POST /api/excel/template</Text> — a shared endpoint, nothing extra to implement</li>
            <li>Up to 100 errors are listed. Coexists with the older <Text code>ExcelUtil + @ExcelColumn</Text> approach</li>
          </ul>
        }
      />

      {/* ── ExcelColumnDef fields ── */}
      <Divider titlePlacement="left">ExcelColumnDef fields</Divider>
      <Table columns={colDefCols} dataSource={colDefRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

      {/* ── ExcelButton Props ── */}
      <Divider titlePlacement="left">ExcelButton Props</Divider>
      <Table columns={propCols} dataSource={propRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

      {/* ── Live demo ── */}
      <Divider titlePlacement="left">Live demo</Divider>

      <Card size="small" title="ExcelButton — dropdown button (download, upload, template)" style={{ marginBottom: 12 }}>
        <Space>
          <ExcelButton
            columns={DEMO_COLUMNS}
            fileName="project_list_demo"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            With no downloadUrl or uploadUrl, only the template entry shows. The template download really works.
          </Text>
        </Space>
      </Card>

      <HookDemo />

      <Card size="small" title="ExcelErrorModal — error list for a failed upload" style={{ marginBottom: 24 }}>
        <Space>
          <ErrorModalDemo />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Mock data: 3 bad rows out of 1,500
          </Text>
        </Space>
      </Card>

      {/* ── Code examples ── */}
      <Divider titlePlacement="left">Code examples</Divider>

      <CodeSnippet title="Basic usage — ExcelButton" code={`import { ExcelButton } from '@/components/excel';
import type { ExcelColumnDef } from '@/types/excel';
import { useMenuPermission } from '@/hooks/useMenuPermission';

// 1. Column definitions per screen (declared once, shared by download, upload and template)
const columns: ExcelColumnDef[] = [
  { key: 'prjId',  header: 'Project ID', width: 14, readOnly: true },  // readOnly: ignored on upload
  { key: 'prjNm',  header: 'Project name', width: 28, required: true }, // required: must be filled on upload
  { key: 'strtDt', header: 'Start date', width: 14, format: 'date', required: true },
  { key: 'budget', header: 'Budget',     width: 16, format: 'number' },
];

function MyPage() {
  const { canWrite } = useMenuPermission();
  const [filters, setFilters] = useState({ status: 'A' });

  return (
    <ExcelButton
      columns={columns}
      downloadUrl="/api/prj/excel"           // POST -> streamed by the server
      uploadUrl="/api/prj/excel/upload"      // POST multipart
      fileName="project_list"
      queryParams={{ status: filters.status }} // search conditions for the download
      onUploadSuccess={refetch}
      disabled={!canWrite}                   // wired to permissions
    />
  );
}`} />

      <CodeSnippet title="Using the hook directly — when you build your own buttons" code={`import { useExcel } from '@/hooks/useExcel';
import { ExcelErrorModal } from '@/components/excel';

function MyToolbar() {
  const {
    download, triggerUpload, downloadTemplate,
    downloading, uploading,
    fileInputRef, handleFileChange,   // binding the hidden input is required
    errorModalProps,
  } = useExcel({
    columns,
    downloadUrl: '/api/prj/excel',
    uploadUrl:   '/api/prj/excel/upload',
    fileName:    'project_list',
    queryParams: { status: filters.status },
    onUploadSuccess: refetch,
  });

  return (
    <>
      {/* hidden input — must be present in the JSX */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
             style={{ display: 'none' }} onChange={handleFileChange} />

      <Button onClick={download}          loading={downloading}>Download</Button>
      <Button onClick={triggerUpload}     loading={uploading}>Upload</Button>
      <Button onClick={downloadTemplate}>Template</Button>

      <ExcelErrorModal {...errorModalProps} />
    </>
  );
}`} />

      <CodeSnippet title="Backend — controller / service / mapper" code={`// ── Controller ─────────────────────────────────────────────────────────────
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
// @Transactional(readOnly = true) is required — without it the cursor closes early
@Transactional(readOnly = true)
public void downloadExcel(HttpServletResponse response, ExcelDownloadRequest req) throws IOException {
    try (Cursor<Map<String, Object>> cursor = mapper.selectForExcel(req.getQueryParams())) {
        DynamicExcelUtil.downloadWithCursor(response, req.getFileName(), req.getColumns(), cursor);
    }
}

// @Transactional — rolls everything back on error
@Transactional
public ExcelParseResult upload(MultipartFile file, List<ExcelColumnDef> columns) throws IOException {
    ExcelParseResult result = DynamicExcelUtil.parse(file, columns);
    if (!result.isSuccess()) return result;   // if there are errors, return without saving
    mapper.batchInsert(result.getData());
    return result;
}

// ── Mapper ── fetchSize is required (MariaDB cursor streaming)
@Select("SELECT prj_id, prj_nm, strt_dt, end_dt, budget, mgr_nm FROM t_prj WHERE ...")
@Options(fetchSize = Integer.MIN_VALUE, resultSetType = ResultSetType.FORWARD_ONLY)
Cursor<Map<String, Object>> selectForExcel(Map<String, Object> params);`} />

      <CodeSnippet title="Upload response shape (ExcelParseResult)" code={`// On success
{ success: true,  totalRows: 1500, failRows: 0, errors: null }

// On failure (everything rolled back, nothing saved)
{
  success: false,
  totalRows: 1500,
  failRows: 3,
  errors: [
    { row: 5,  col: "prjNm",  header: "Project name", value: "",    message: "This field is required" },
    { row: 23, col: "strtDt", header: "Start date", value: "abc",   message: "Invalid date format (yyyy-MM-dd)" },
    { row: 89, col: "budget", header: "Budget",     value: "-100abc", message: "Invalid number format" },
  ]
  // Up to 100 errors. Beyond that the modal shows a notice automatically
}`} />
    </div>
  );
}
