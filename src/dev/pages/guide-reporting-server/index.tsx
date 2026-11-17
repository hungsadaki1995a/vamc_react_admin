import { useState } from 'react';
import { Alert, Button, Card, Divider, Space, Table, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { FilePdfOutlined, EyeOutlined } from '@ant-design/icons';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text, Paragraph } = Typography;

// ── Reporting server address ───────────────────────────────────────────────
// In real screens, don't hardcode this — move it to an env var (VITE_REPORT_BASE in .env).
// The address differs per environment (local / dev server / production).
const RS_BASE = 'http://13.209.218.138:8080/ReportingServer';
const SERVICE_URL = `${RS_BASE}/service`;   // entry point that runs a report
const DOWNLOAD_URL = `${RS_BASE}/download`; // where the exported result file is fetched from
const DEMO_PAGE = `${RS_BASE}/html5/sample/sample.html`; // demo page shipped by the vendor

// ── Endpoint table ─────────────────────────────────────────────────────────
type EpRow = { key: string; path: string; use: string };
const epCols: TableColumnsType<EpRow> = [
  { title: 'Path', dataIndex: 'path', width: 260, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Purpose', dataIndex: 'use' },
];
const epRows: EpRow[] = [
  { key: '1', path: '/ReportingServer/service',  use: 'Entry point that runs a report. Both the viewer and the Invoker call this' },
  { key: '2', path: '/ReportingServer/download', use: 'Where the result file produced by export (2) is downloaded from' },
  { key: '3', path: '/ReportingServer/information', use: 'Health check — open it in a browser; HTTP 200 means the server is up' },
  { key: '4', path: '/ReportingServer/html5/js/jquery-3.5.1.min.js', use: 'jQuery, required by the viewer. Must load before the viewer script' },
  { key: '5', path: '/ReportingServer/html5/js/crownix-viewer.min.js', use: '(1) Viewer library (m2soft.crownix.Viewer)' },
  { key: '6', path: '/ReportingServer/html5/css/crownix-viewer.min.css', use: '(1) Viewer stylesheet' },
  { key: '7', path: '/ReportingServer/html5/js/invoker/crownix-invoker.min.js', use: '(2) Invoker library (m2soft.crownix.ReportingServerInvoker)' },
];

// ── (2) Invoker parameter table ────────────────────────────────────────────
type ParamRow = { key: string; name: string; ex: string; desc: string };
const paramCols: TableColumnsType<ParamRow> = [
  { title: 'Parameter', dataIndex: 'name', width: 130, render: (v) => <Text code>{v}</Text> },
  { title: 'Example', dataIndex: 'ex', width: 170, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Description', dataIndex: 'desc' },
];
const paramRows: ParamRow[] = [
  { key: '1', name: 'opcode',      ex: '500',              desc: 'Operation type. 500 = "export to a file"' },
  { key: '2', name: 'mrd_path',    ex: 'sample.mrd',       desc: 'Which report to run — the filename of the report definition uploaded to the server' },
  { key: '3', name: 'mrd_param',   ex: '/rfn [sample.txt]', desc: 'Values passed to the report. See the "Report parameters" section below' },
  { key: '4', name: 'export_type', ex: 'pdf',              desc: 'Output format — pdf / excel / word / csv / png (pdf is verified)' },
  { key: '5', name: 'protocol',    ex: 'sync',             desc: 'sync = wait until generation finishes, then get the response (simplest)' },
];

// ── (1) Viewer API table ───────────────────────────────────────────────────
type ApiRow = { key: string; api: string; desc: string };
const apiCols: TableColumnsType<ApiRow> = [
  { title: 'Call', dataIndex: 'api', width: 330, render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: 'Description', dataIndex: 'desc' },
];
const apiRows: ApiRow[] = [
  { key: '1', api: "new m2soft.crownix.Viewer(serviceUrl, divId)", desc: 'Create the viewer. serviceUrl = the /service address, divId = id of the empty <div> to render into' },
  { key: '2', api: "viewer.openFile(mrdPath, mrdParam)", desc: 'Renders the report inside that <div>' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function GuideReportingServer() {
  const [exporting, setExporting] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);

  // (2) Live demo that runs an export with fetch alone (no jQuery needed).
  const runExportDemo = async () => {
    setExporting(true);
    setLastFile(null);
    try {
      const body = new URLSearchParams({
        opcode: '500',
        mrd_path: 'sample.mrd',
        mrd_param: '/rfn [sample.txt]',
        export_type: 'pdf',
        protocol: 'sync',
      });
      const res = await fetch(SERVICE_URL, { method: 'POST', body });
      const text = await res.text();               // "1|2026/09/14/.../xxxx.pdf"
      const [code, msg] = text.split('|');
      if (code !== '1') { message.error(`Failed: ${msg}`); return; }
      const rdid = res.headers.get('crownix-rdid') ?? '';
      const url = `${DOWNLOAD_URL}?attachment=true&filename=${encodeURIComponent(msg)}&rdid=${rdid}`;
      setLastFile(url);
      window.open(url, '_blank');                   // actually downloads the PDF
    } catch {
      message.error('Reporting server call failed — check the server status, CORS and address.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideReportingServer" />

      {/* ── Overview ── */}
      <Alert
        type="info"
        style={{ marginBottom: 16 }}
        title="Scope of this document"
        description={
          <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 13 }}>
            <li>Reports are produced by the <strong>M2Soft Crownix reporting server</strong>. The front end only has to <strong>make the call</strong> — "run this report this way".</li>
            <li>There are two ways to call it — <strong>(1) render it in the page (viewer)</strong> and <strong>(2) export and download a file (Invoker export)</strong>.</li>
            <li><strong>Authoring the report layout file (<Text code>.mrd</Text>) is out of scope</strong> — the development team builds it with the vendor's own tool and uploads it to the server. The front end only passes the filename.</li>
          </ul>
        }
      />

      {/* ── Prerequisites ── */}
      <Divider titlePlacement="left">Addresses you call</Divider>
      <Paragraph style={{ fontSize: 13, marginBottom: 8 }}>
        These are the endpoints the reporting server exposes. The <Text code>{RS_BASE}</Text> prefix is the server location;
        it differs between local, dev and production, so keep it in an env var rather than hardcoding it.
      </Paragraph>
      <Table columns={epCols} dataSource={epRows} size="small" pagination={false} style={{ marginBottom: 24 }} />

      {/* ── Quickest sanity check ── */}
      <Divider titlePlacement="left">Check this works first</Divider>
      <Card size="small" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text>
            Before writing any code, open the vendor's demo page in a new tab and confirm a report renders.
          </Text>
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => window.open(DEMO_PAGE, '_blank')}>
              Open the demo report page
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>{DEMO_PAGE}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            If no report appears here, it is a server / address / network problem, not a front-end one. Fix that first.
          </Text>
        </Space>
      </Card>

      {/* ── (1) Viewer ── */}
      <Divider titlePlacement="left">(1) Render it in the page (viewer)</Divider>
      <Paragraph style={{ fontSize: 13 }}>
        Use this when users should view the report on screen and be able to zoom, print and save it.
        Put an empty <Text code>&lt;div&gt;</Text> on the page and mount the viewer inside it.
      </Paragraph>
      <Table columns={apiCols} dataSource={apiRows} size="small" pagination={false} style={{ marginBottom: 16 }} />

      <CodeSnippet title="(1) Simplest form (plain HTML)" code={`<!-- 1) Load the libraries the viewer needs — jQuery first! -->
<script src="${RS_BASE}/html5/js/jquery-3.5.1.min.js"></script>
<script src="${RS_BASE}/html5/js/crownix-viewer.min.js"></script>
<link  rel="stylesheet" href="${RS_BASE}/html5/css/crownix-viewer.min.css">

<!-- 2) Empty slot the report is drawn into -->
<div id="report" style="width:100%;height:600px"></div>

<script>
  // 3) Create the viewer (server URL, div id)
  var viewer = new m2soft.crownix.Viewer('${SERVICE_URL}', 'report');
  // 4) Open the report (layout file, parameters)
  viewer.openFile('sample.mrd', '/rfn [sample.txt]');
</script>`} />

      <CodeSnippet title="(1) Wrapped in a React component (how this project does it)" code={`import { useEffect, useRef } from 'react';

const RS_BASE = import.meta.env.VITE_REPORT_BASE;          // e.g. http://.../ReportingServer
const SERVICE_URL = RS_BASE + '/service';

// Helper that loads an external script only once
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) return resolve();
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadCss(href: string) {
  if (document.querySelector('link[href="' + href + '"]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
}

export function ReportViewer({ mrd, param }: { mrd: string; param: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      loadCss(RS_BASE + '/html5/css/crownix-viewer.min.css');
      await loadScript(RS_BASE + '/html5/js/jquery-3.5.1.min.js');   // order matters
      await loadScript(RS_BASE + '/html5/js/crownix-viewer.min.js');
      if (cancelled || !ref.current) return;
      ref.current.id = 'crownix-report';
      // m2soft is a global injected on window by an external script, so it has no types
      const viewer = new (window as any).m2soft.crownix.Viewer(SERVICE_URL, 'crownix-report');
      viewer.openFile(mrd, param);
    })();
    return () => { cancelled = true; };
  }, [mrd, param]);

  return <div ref={ref} style={{ width: '100%', height: 600 }} />;
}

// Usage: <ReportViewer mrd="sample.mrd" param="/rfn [sample.txt]" />`} />

      {/* ── (2) Invoker ── */}
      <Divider titlePlacement="left">(2) Export and download a file (Invoker export)</Divider>
      <Paragraph style={{ fontSize: 13 }}>
        Use this when you want a PDF or Excel file directly instead of an on-screen view. It is a two-step flow —
        <strong> (a) ask /service to generate the file, (b) fetch the returned file path from /download.</strong>
      </Paragraph>
      <Table columns={paramCols} dataSource={paramRows} size="small" pagination={false} style={{ marginBottom: 16 }} />

      <Alert
        type="warning"
        style={{ marginBottom: 16 }}
        title="Mind the response format"
        description={
          <div style={{ fontSize: 13 }}>
            <p style={{ margin: '2px 0' }}>The response body of request (a) is a single line shaped like <Text code>resultCode|message</Text>.</p>
            <ul style={{ margin: '2px 0', paddingLeft: 20 }}>
              <li>Success: <Text code>1|2026/09/14/.../20260914....pdf</Text> → what follows <Text code>|</Text> is <strong>the path of the generated file</strong></li>
              <li>Failure: <Text code>0|error message</Text> → treat anything but a leading <Text code>1</Text> as a failure</li>
            </ul>
            <p style={{ margin: '2px 0' }}>The <Text code>crownix-rdid</Text> response header that comes with it must be attached to download request (b).</p>
          </div>
        }
      />

      <CodeSnippet title="(2) With the Invoker library (vendor's way)" code={`<script src="${RS_BASE}/html5/js/invoker/crownix-invoker.min.js"></script>
<script>
  var invoker = new m2soft.crownix.ReportingServerInvoker('${SERVICE_URL}');
  invoker.addParameter('opcode', '500');            // 500 = export
  invoker.addParameter('mrd_path', 'sample.mrd');
  invoker.addParameter('mrd_param', '/rfn [sample.txt]');
  invoker.addParameter('export_type', 'pdf');
  invoker.addParameter('protocol', 'sync');

  invoker.invoke(function (response, xhr) {
    var parts = response.split('|');               // ["1", "2026/09/14/.../xxx.pdf"]
    if (parts[0] !== '1') { alert('Failed: ' + parts[1]); return; }
    var filePath = parts[1];
    var rdid = xhr.getResponseHeader('crownix-rdid');
    // (b) download the result file
    var url = '${DOWNLOAD_URL}?attachment=true'
            + '&filename=' + encodeURIComponent(filePath)
            + '&rdid=' + rdid;
    location.href = url;                            // or assign it to an <iframe>.src
  });
</script>`} />

      <CodeSnippet title="(2) With fetch alone, no library (how this project does it)" code={`const RS_BASE = import.meta.env.VITE_REPORT_BASE;

export async function exportReport(mrd: string, param: string, exportType = 'pdf') {
  // (a) ask for the export — POST as form data
  const body = new URLSearchParams({
    opcode: '500',
    mrd_path: mrd,
    mrd_param: param,
    export_type: exportType,
    protocol: 'sync',
  });
  const res = await fetch(RS_BASE + '/service', { method: 'POST', body });
  const [code, msg] = (await res.text()).split('|');
  if (code !== '1') throw new Error('Report generation failed: ' + msg);

  // (b) download the generated file
  const rdid = res.headers.get('crownix-rdid') ?? '';
  const url = RS_BASE + '/download?attachment=true'
            + '&filename=' + encodeURIComponent(msg)
            + '&rdid=' + rdid;
  window.open(url, '_blank');   // receive the file in a new tab
}

// Usage: exportReport('sample.mrd', '/rfn [sample.txt]', 'pdf');`} />

      {/* ── Live demo ── */}
      <Divider titlePlacement="left">Live demo</Divider>
      <Card size="small" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text>This is the "fetch alone" code above actually running. Pressing the button asks the dev server to export and returns a PDF.</Text>
          <Space wrap>
            <Button type="primary" icon={<FilePdfOutlined />} loading={exporting} onClick={runExportDemo}>
              Export sample.mrd as PDF
            </Button>
            {lastFile && (
              <a href={lastFile} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                Reopen the downloaded file
              </a>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Note: the dev reporting server must be running. If it fails, see the troubleshooting table below.
          </Text>
        </Space>
      </Card>

      {/* ── Report parameters ── */}
      <Divider titlePlacement="left">What report parameters (mrd_param) are</Divider>
      <Paragraph style={{ fontSize: 13 }}>
        <Text code>mrd_param</Text> is where values are passed into the report. Options are written as <Text code>/name [value]</Text>.
        In the example, <Text code>/rfn [sample.txt]</Text> means "fill the report from this data file".
        Screen conditions (date range, status, …) are carried here too — which names are accepted is decided by
        the team that authored the report layout.
      </Paragraph>

      {/* ── Troubleshooting ── */}
      <Divider titlePlacement="left">Troubleshooting</Divider>
      <Table
        size="small"
        pagination={false}
        style={{ marginBottom: 24 }}
        columns={[
          { title: 'Symptom', dataIndex: 'sym', width: 240, render: (v) => <Text strong>{v}</Text> },
          { title: 'Cause / fix', dataIndex: 'fix' },
        ]}
        dataSource={[
          { key: '1', sym: 'm2soft is not defined', fix: 'Called before the viewer / Invoker script finished loading. Call it after the jQuery → viewer load order completes (after the awaits in useEffect).' },
          { key: '2', sym: 'CORS error (red line in the console)', fix: 'The server must allow the front-end origin. The dev server currently allows every origin (allow.origin=*). If production narrows this, add the front-end origin to the server\'s access.properties.' },
          { key: '3', sym: 'Report does not render / file not found', fix: 'The layout file named by mrd_path is not on the server. The front end only passes a filename; the actual .mrd must be uploaded. Use "Open the demo report page" above to confirm the server itself is healthy first.' },
          { key: '4', sym: 'Works locally but not after deployment', fix: 'The server address was hardcoded to localhost. Move it to an env var (VITE_REPORT_BASE) and set the deployment value.' },
          { key: '5', sym: 'Download is empty or corrupted', fix: 'Download URL (b) is missing crownix-rdid, or filename was not encodeURIComponent-ed. Attach the rdid from the response header as-is.' },
        ]}
      />

      <Alert
        type="success"
        showIcon
        title="Summary"
        description={
          <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 13 }}>
            <li>To show it on screen → <strong>(1) viewer</strong> (<Text code>Viewer.openFile</Text>)</li>
            <li>To get a file → <strong>(2) Invoker export</strong> (<Text code>/service</Text> request → <Text code>/download</Text>)</li>
            <li>All the front end needs to know is <strong>the server address, the layout filename (mrd) and the parameters</strong>.</li>
          </ul>
        }
      />
    </div>
  );
}
