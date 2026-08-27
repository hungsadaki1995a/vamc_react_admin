import { Tabs, Tag, Space, Card, Alert, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { useMenuPermission } from '@/hooks/useMenuPermission';
import { useLocaleStore } from '@/stores/localeStore';

const { Text } = Typography;

// ─── useScreenLabel 함수 목록 ─────────────────────────────────────────────────
const helperCols: TableColumnsType<{ fn: string; context: string; pattern: string; desc: string }> = [
  { title: '함수', dataIndex: 'fn', key: 'fn', width: 150, render: (v) => <Text code>{v}</Text> },
  { title: '컨텍스트', dataIndex: 'context', key: 'context', width: 90 },
  { title: '키 패턴', dataIndex: 'pattern', key: 'pattern', width: 300, render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
  { title: '용도', dataIndex: 'desc', key: 'desc' },
];
const helperRows = [
  { fn: 'tvt(field)', context: 'VIEW', pattern: '{sceId}.VIEW.TEXT_{field}', desc: '폼/필드 레이블' },
  { fn: 'tvb(field)', context: 'VIEW', pattern: '{sceId}.VIEW.BTN_{field}', desc: '버튼 텍스트' },
  { fn: 'tvh(field)', context: 'VIEW', pattern: '{sceId}.VIEW.TITLE_{field}', desc: '제목/섹션 헤딩' },
  { fn: 'tvp(field)', context: 'VIEW', pattern: '{sceId}.VIEW.PHOLDER_{field}', desc: '입력 플레이스홀더 (placeholder)' },
  { fn: 'tvo(field)', context: 'VIEW', pattern: '{sceId}.VIEW.OPT_{field}', desc: '셀렉트 옵션 레이블' },
  { fn: 'tsg(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.GRID_{field}', desc: '그리드 컬럼 헤더' },
  { fn: 'tsm(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.MSG_{field}', desc: '성공/오류/확인 메시지' },
  { fn: 'tsb(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.BTN_{field}', desc: '다이얼로그 버튼' },
  { fn: 'tss(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.STATUS_{field}', desc: '상태 레이블 (그리드 태그, 뱃지)' },
  { fn: 'tsr(field)', context: 'SCRIPT', pattern: '{sceId}.SCRIPT.RULE_{field}', desc: '유효성 검사 오류 메시지' },
  { fn: 'tmc(code)', context: 'MESSAGE', pattern: 'MESSAGE.CONFIRM.TEXT_{code}', desc: '전역 확인 메시지 (화면 무관)' },
  { fn: 'tmi(code)', context: 'MESSAGE', pattern: 'MESSAGE.INFO.TEXT_{code}', desc: '전역 정보 메시지 (화면 무관)' },
  { fn: 'tme(code)', context: 'MESSAGE', pattern: 'MESSAGE.ERROR.TEXT_{code}', desc: '전역 에러 메시지 (화면 무관)' },
  { fn: 't(key)', context: '—', pattern: '(full key)', desc: '전체 키 직접 조회 (폴백: key 자체 반환)' },
  { fn: 'labels', context: '—', pattern: '—', desc: 'useMemo deps 전용 — 언어 변경 시 재계산 트리거' },
];

// ─── 라벨 키 패턴 예시 ────────────────────────────────────────────────────────
const exampleCols: TableColumnsType<{ key: string; ko: string; en: string }> = [
  { title: 'LABEL_KEY', dataIndex: 'key', key: 'key', render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
  { title: '한국어', dataIndex: 'ko', key: 'ko' },
  { title: '영어', dataIndex: 'en', key: 'en' },
];
const exampleRows = [
  { key: 'CCO101001SC.VIEW.TEXT_usrId', ko: '사용자ID', en: 'User ID' },
  { key: 'CCO101001SC.VIEW.BTN_save', ko: '저장', en: 'Save' },
  { key: 'CCO101001SC.VIEW.TITLE_inputPanel', ko: '입력 패널', en: 'Input Panel' },
  { key: 'CCO101001SC.SCRIPT.GRID_usrId', ko: '사용자ID', en: 'User ID' },
  { key: 'CCO101001SC.SCRIPT.MSG_updateSuccess', ko: '수정되었습니다.', en: 'Updated successfully.' },
  { key: 'CCO101001SC.SCRIPT.BTN_delete', ko: '삭제', en: 'Delete' },
];

export default function GuideI18nPermission() {
  const { t } = useScreenLabel();
  const { permType, canRead, canWrite } = useMenuPermission();
  const { locale } = useLocaleStore();

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header"><h2>다국어(i18n) & 권한(Permission) 가이드</h2></div>

      <Tabs
        items={[
          {
            key: 'useScreenLabel',
            label: 'useScreenLabel',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>useScreenLabel 훅</h3>
                  <p>
                    화면 ID(sceId)를 기반으로 라벨 키를 자동 조합하는 단축 함수 모음.
                    <code>TabContext</code>에서 <code>sceId</code>를 자동으로 읽으므로 별도 전달 불필요.
                    <strong> 하드코딩 문자열 대신 반드시 사용하세요.</strong>
                  </p>
                </div>

                <Table
                  columns={helperCols}
                  dataSource={helperRows.map((r, i) => ({ ...r, key: i }))}
                  size="small"
                  pagination={false}
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet
                  title="기본 사용"
                  code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

export default function CCO101001SC() {
  // 모든 라벨 헬퍼를 단일 훅 호출로 사용
  const { t, tvt, tvb, tvh, tsg, tsm, tsb, tmc, tmi, tme, labels } = useScreenLabel();
  // sceId는 TabContext에서 자동 파생 → 'CCO101001SC'

  // JSX 레이블
  return (
    <Form.Item label={tvt('usrId')}>   {/* CCO101001SC.VIEW.TEXT_usrId */}
      <Input />
    </Form.Item>
    <Button>{tvb('save')}</Button>      {/* CCO101001SC.VIEW.BTN_save */}
  );
}`}
                />

                <CodeSnippet
                  title="그리드 컬럼 헤더 (SCRIPT 컨텍스트)"
                  code={`const { tsg, labels } = useScreenLabel();

// labels를 deps에 포함 → 언어 변경 시 헤더 자동 갱신
const columnDefs = useMemo<ColDef<Employee>[]>(() => [
  { field: 'empNo', headerName: tsg('usrId'),  width: 130 },
  { field: 'empNm', headerName: tsg('usrNm'),  width: 140 },
  { field: 'orgNm', headerName: tsg('orgNm'),  width: 130 },
  { field: 'gdCd',  headerName: tsg('gdCd'),   width: 90  },
], [labels]); // ← labels 필수`}
                />

                <CodeSnippet
                  title="메시지 / 다이얼로그 (이벤트 핸들러)"
                  code={`const { tsm, tsb, tmc, tme } = useScreenLabel();
const { message, modal } = App.useApp();

const handleSave = useCallback(() => {
  form.validateFields().then(() => {
    message.success(tsm('updateSuccess'));  // SCRIPT.MSG_updateSuccess
  }).catch(() => {
    message.error(tsm('requiredCheck'));
  });
}, [form, tsm]);

const handleDelete = useCallback(() => {
  modal.confirm({
    title: tsm('deleteConfirmTitle'),
    content: tmc('C100007'),               // MESSAGE.CONFIRM.TEXT_C100007 (전역)
    okText: tsb('delete'),                 // SCRIPT.BTN_delete
    cancelText: tsb('cancel'),
    onOk: () => { /* ... */ },
  });
}, [modal, tsm, tsb, tmc]);

// 전역 메시지 예시
message.info(tmi('I100008'));    // MESSAGE.INFO.TEXT_I100008
message.error(tme('E100001'));   // MESSAGE.ERROR.TEXT_E100001`}
                />

                <CodeSnippet
                  title="TabPanel 외부 (sceId 명시)"
                  code={`// TabContext가 없는 환경에서는 sceId를 직접 전달
const { tvt } = useScreenLabel('CCO101001SC');`}
                />
              </div>
            ),
          },
          {
            key: 'labelStore',
            label: 'labelStore',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>labelStore</h3>
                  <p>
                    서버에서 라벨을 일괄 로드해 메모리에 보관. 컴포넌트에서는 <code>useScreenLabel()</code>을 통해
                    <code>t</code>를 비롯한 모든 헬퍼를 사용. 키가 없으면 key 자체를 반환하므로 빈 화면이 생기지 않음.
                  </p>
                </div>

                <Alert
                  type="info"
                  title="API 정보"
                  description="GET /api/lbl/bulk — 인증 불필요 (permitAll). X-Project-Id, X-Lang 헤더 자동 주입."
                  style={{ marginBottom: 16 }}
                />

                <Card title="현재 상태" size="small" style={{ marginBottom: 16 }}>
                  <Space>
                    <Text>현재 언어: <Tag color="blue">{locale}</Tag></Text>
                    <Text><Text code>t('SAVE')</Text> → <Text strong>{t('SAVE') || '(없음)'}</Text></Text>
                    <Text><Text code>t('CANCEL')</Text> → <Text strong>{t('CANCEL') || '(없음)'}</Text></Text>
                    <Text><Text code>t('SEARCH')</Text> → <Text strong>{t('SEARCH') || '(없음)'}</Text></Text>
                  </Space>
                </Card>

                <CodeSnippet
                  title="useScreenLabel — 단일 훅으로 모든 라벨 접근"
                  code={`import { useScreenLabel } from '@/hooks/useScreenLabel';

function MyComponent() {
  // t, tmc/tmi/tme, tvt/tvb/tsg/tsm 등 모두 여기서
  const { t, tmc, tmi, tme, tvt, tsm } = useScreenLabel();

  return <Button>{t('SAVE')}</Button>;
}

// 키 없을 때 폴백: key 자체 반환 (빈 문자열 아님)
t('NON_EXISTENT') // → 'NON_EXISTENT'

// 비 React 컨텍스트 (axios 인터셉터, 유틸 함수 등)
import { useLabelStore } from '@/stores/labelStore';
useLabelStore.getState().tme('E100001')`}
                />

                <CodeSnippet
                  title="로딩 타이밍 (App.tsx에서 자동 호출)"
                  code={`// App.tsx — labelStore 로딩 트리거 (직접 수정 불필요, 참고용)
useEffect(() => {
  labelStore.loadLabels();
}, [activeProjectId, locale]); // 프로젝트/언어 변경 시 자동 재로드

// fetchBulkLabels 내부 (src/api/lbl.ts)
export async function fetchBulkLabels(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/api/lbl/bulk');
  if (data.status !== 200 || !data.data) return {};
  return data.data;
}`}
                />
              </div>
            ),
          },
          {
            key: 'keyPattern',
            label: '키 네이밍',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>라벨 키 네이밍 패턴</h3>
                  <p>
                    모든 화면별 라벨 키는 <code>{`{sceId}.{CONTEXT}.{TYPE}_{field}`}</code> 구조를 따릅니다.
                  </p>
                </div>

                <CodeSnippet
                  title="키 구조"
                  code={`{sceId}.{CONTEXT}.{TYPE}_{field}

sceId   : 화면 ID          e.g. CCO101001SC
CONTEXT : VIEW | SCRIPT
  VIEW   → JSX 템플릿 안 (label, button text, title)
  SCRIPT → 이벤트 핸들러, 그리드 헤더 (JS 코드 안)
TYPE    : TEXT | BTN | TITLE | GRID | MSG
field   : camelCase 필드명  e.g. usrId, save`}
                />

                <Table
                  columns={exampleCols}
                  dataSource={exampleRows}
                  size="small"
                  pagination={false}
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet
                  title="CONTEXT 판별 기준"
                  code={`// VIEW — JSX return 블록 안
<Form.Item label={tvt('usrId')}>    // ← VIEW.TEXT_usrId
<Button>{tvb('save')}</Button>       // ← VIEW.BTN_save
<h3>{tvh('inputPanel')}</h3>         // ← VIEW.TITLE_inputPanel

// SCRIPT — JS 영역 (헤더, 핸들러)
headerName: tsg('usrId'),            // ← SCRIPT.GRID_usrId
message.success(tsm('saved')),       // ← SCRIPT.MSG_saved
okText: tsb('confirm'),              // ← SCRIPT.BTN_confirm`}
                />

                <CodeSnippet
                  title="DB 라벨 등록 (t_cco_lbl_m + t_cco_lbl_trn)"
                  code={`-- 마스터 등록
INSERT INTO t_cco_lbl_m (LABEL_KEY, SCREEN_ID, SECTION, TYPE, DETAIL, DEFAULT_TEXT)
VALUES ('CCO101001SC.VIEW.TEXT_usrId', 'CCO101001SC', 'VIEW', 'TEXT', 'usrId', '사용자ID');

-- 한국어 번역
INSERT INTO t_cco_lbl_trn (LABEL_KEY, LANG_CODE, TRANSLATED_TEXT)
VALUES ('CCO101001SC.VIEW.TEXT_usrId', 'ko', '사용자ID');

-- 영어 번역
INSERT INTO t_cco_lbl_trn (LABEL_KEY, LANG_CODE, TRANSLATED_TEXT)
VALUES ('CCO101001SC.VIEW.TEXT_usrId', 'en', 'User ID');

-- 프로젝트 오버라이드 (특정 프로젝트에서만 다른 번역)
INSERT INTO t_cco_lbl_prj_trn (LABEL_KEY, PROJECT_ID, LANG_CODE, TRANSLATED_TEXT)
VALUES ('CCO101001SC.VIEW.TEXT_usrId', 'PJ001', 'ko', '직원ID');`}
                />
              </div>
            ),
          },
          {
            key: 'permission',
            label: '권한 제어',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>useMenuPermission</h3>
                  <p>현재 활성 탭의 메뉴 권한을 반환. 서버 응답 <code>permType</code>을 기반으로 canRead/canWrite를 계산.</p>
                </div>

                <Card title="현재 탭 권한" size="small" style={{ marginBottom: 16 }}>
                  <Space>
                    <Text>permType: <Tag color={permType === 'AL' ? 'green' : permType === 'WT' ? 'cyan' : permType === 'RD' ? 'blue' : 'default'}>{permType || '없음'}</Tag></Text>
                    <Text>canRead: <Tag color={canRead ? 'green' : 'red'}>{String(canRead)}</Tag></Text>
                    <Text>canWrite: <Tag color={canWrite ? 'green' : 'red'}>{String(canWrite)}</Tag></Text>
                  </Space>
                </Card>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <table className="demo-props-table">
                    <thead>
                      <tr><th>permType</th><th>의미</th><th>canRead</th><th>canWrite</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><Tag color="green">AL</Tag></td><td>전체(읽기 + 수정)</td><td>✅</td><td>✅</td></tr>
                      <tr><td><Tag color="cyan">WT</Tag></td><td>쓰기 (읽기 포함)</td><td>✅</td><td>✅</td></tr>
                      <tr><td><Tag color="blue">RD</Tag></td><td>읽기만</td><td>✅</td><td>❌</td></tr>
                      <tr><td><Tag>없음</Tag></td><td>권한 없음</td><td>❌</td><td>❌</td></tr>
                    </tbody>
                  </table>
                </Card>

                <CodeSnippet
                  title="버튼 표시/숨김"
                  code={`import { useMenuPermission } from '@/hooks/useMenuPermission';

function MyPage() {
  const { canWrite } = useMenuPermission();

  return (
    <GridToolbar
      totalCount={data.length}
      actions={
        <>
          <Button icon={<DownloadOutlined />}>엑셀</Button>
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />}>등록</Button>
          )}
        </>
      }
    />
  );
}`}
                />

                <CodeSnippet
                  title="입력 폼 읽기 전용 처리"
                  code={`function MyPage() {
  const { canWrite } = useMenuPermission();
  const { tvt, tvb } = useScreenLabel(); // 또는 필요한 것만 구조분해

  return (
    <Form>
      <Form.Item label={tvt('usrId')} name="empNo">
        <Input readOnly={!canWrite} />
      </Form.Item>
      {canWrite && (
        <Button type="primary" onClick={handleSave}>{tvb('save')}</Button>
      )}
    </Form>
  );
}`}
                />

                <CodeSnippet
                  title="동작 원리"
                  code={`// 서버 응답 (GET /api/common/menus/all)
//   └─ MnuResponse.permType ('M' | 'S' | '')
//        └─ buildServerMenuTree() → MenuItem.permType 보존
//             └─ menuStore.serverMenus에 저장

// useMenuPermission 내부 동작
const activeTabKey = useTabStore((s) => s.activeTabKey);
const serverMenus  = useMenuStore((s) => s.serverMenus);
const menu         = findMenuByKey(serverMenus, activeTabKey);
const permType     = menu?.permType ?? '';

return {
  permType,
  canRead:  ['RD', 'WT', 'AL'].includes(permType),
  canWrite: ['WT', 'AL'].includes(permType),
};`}
                />
              </div>
            ),
          },
          {
            key: 'tabContext',
            label: 'TabContext',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>TabContext & PageHeader</h3>
                  <p>
                    <code>TabContent.tsx</code>의 <code>TabPanel</code>이 현재 탭 데이터를 Context로 주입.
                    <code>PageHeader</code>는 자동 렌더링되므로 <strong>페이지 컴포넌트에서 직접 추가 금지.</strong>
                  </p>
                </div>

                <Alert
                  type="warning"
                  title="PageHeader 중복 금지"
                  description="TabContent가 이미 PageHeader를 렌더링합니다. 각 페이지 컴포넌트에서 직접 추가하면 중복됩니다."
                  style={{ marginBottom: 16 }}
                />

                <CodeSnippet
                  title="TabContext 사용 (컴포넌트 트리 내부)"
                  code={`import { useTabContext } from '@/contexts/TabContext';

function MyComponent() {
  const ctx = useTabContext(); // null if rendered outside TabPanel
  const sceId = ctx?.tab.sceId;        // e.g. 'CCO101001SC'
  const title = ctx?.tab.title;        // 탭 제목
  const labelKey = ctx?.tab.labelKey;  // 다국어 키
}`}
                />

                <CodeSnippet
                  title="PageHeader 자동 렌더링 구조 (참고용)"
                  code={`// TabContent.tsx 내부 (수정 불필요, 참고용)
function TabPanel({ tab, visible }) {
  return (
    <TabContext.Provider value={{ tab }}>
      <PageHeader />         {/* ← 자동 렌더링 */}
      <Component {...tab} /> {/* ← 실제 페이지 */}
    </TabContext.Provider>
  );
}

// PageHeader가 표시하는 정보
// [CCO101001SC] 사용자관리
//  └─ tab.sceId → tab.componentKey  : [코드]
//  └─ t(tab.labelKey) → tab.title   : 제목`}
                />

                <CodeSnippet
                  title="개발 체크리스트"
                  code={`// 새 화면 개발 시 확인
□ page-master 또는 page-container 클래스 사용
□ <PageHeader /> 직접 추가 금지
□ useScreenLabel() 사용 — 하드코딩 문자열 금지
□ 그리드 headerName: tsg() 사용
□ 메시지/confirm: tsm(), tsb() 사용
□ 저장/삭제 버튼: canWrite 조건부 렌더링
□ columnDefs useMemo deps에 [labels] 포함`}
                />
              </div>
            ),
          },
          {
            key: 'locale',
            label: '언어 전환',
            children: (
              <div className="demo-section">
                <div className="demo-desc">
                  <h3>언어 전환 (localeStore)</h3>
                  <p>
                    <code>setLocale</code> 호출 → <code>App.tsx</code>의 useEffect가 감지 → <code>loadLabels()</code> 자동 재호출.
                    지원 언어: <code>ko</code> / <code>en</code> / <code>vi</code>
                  </p>
                </div>

                <Card title="현재 언어" size="small" style={{ marginBottom: 16 }}>
                  <Tag color="blue">{locale}</Tag>
                </Card>

                <CodeSnippet
                  title="LocaleSelector 컴포넌트"
                  code={`import { useLocaleStore } from '@/stores/localeStore';
import type { LocaleKey } from '@/stores/localeStore';

function LocaleSelector() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <Select
      value={locale}
      onChange={(v) => setLocale(v as LocaleKey)}
      options={[
        { label: '한국어', value: 'ko' },
        { label: 'English', value: 'en' },
        { label: 'Tiếng Việt', value: 'vn' },
      ]}
    />
  );
}

// 변경 감지 흐름:
// setLocale('en')
//   → useLocaleStore 업데이트 (persist → localStorage)
//   → App.tsx useEffect([locale]) 트리거
//   → labelStore.loadLabels() 호출
//   → X-Lang: 'en' 헤더로 GET /api/lbl/bulk
//   → labels 업데이트 → 전체 UI 갱신`}
                />

                <CodeSnippet
                  title="axios 헤더 자동 주입 (client.ts)"
                  code={`// src/lib/api/client.ts — 인터셉터 (참고용)
apiClient.interceptors.request.use((config) => {
  const locale = useLocaleStore.getState().locale;
  const activeProject = useProjectStore.getState().activeProject;

  config.headers['X-Lang'] = locale;               // 언어
  if (activeProject) {
    config.headers['X-Project-Id'] = activeProject.id;  // 프로젝트
  }
  return config;
});

// → GET /api/lbl/bulk 요청 시 헤더 자동 포함
//   X-Lang: ko
//   X-Project-Id: PJ001`}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
