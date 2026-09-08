import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import styles from './index.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// 신규 화면 개발 가이드
//
// 실습 예시는 IA 에 이미 등록돼 있으나 화면이 없는 메뉴 하나를 그대로 쓴다 —
// 컨텐츠 관리 > 공지사항 관리(A04010000). 메뉴 행과 다국어 라벨이 이미 있어
// MENU_URL_ADDR 만 채우면 되므로, 처음 따라 하는 사람이 SQL 을 최소로 만진다.
// ─────────────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
}

const SECTIONS: Section[] = [
  { id: 'prepare',  title: '준비하기' },
  { id: 'sceid',    title: '화면ID 정하기' },
  { id: 'menu',     title: '메뉴 등록' },
  { id: 'empty',    title: '빈 화면 만들기' },
  { id: 'api',      title: 'API 파일 만들기' },
  { id: 'list',     title: '목록 조회 화면' },
  { id: 'crud',     title: '등록·수정·삭제' },
  { id: 'perm',     title: '권한 연결' },
  { id: 'label',    title: '다국어 라벨' },
  { id: 'state',    title: '상태 관리' },
  { id: 'check',    title: '마무리 체크리스트' },
];

// ── 코드 블록 ────────────────────────────────────────────────────────────────

function Code({ file, children }: { file?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.code}>
      <div className={styles.codeHead}>
        <span className={styles.codeFile}>{file ?? ''}</span>
        <button type="button" className={styles.codeCopy} onClick={handleCopy}>
          {copied ? <><CheckOutlined /> 복사됨</> : <><CopyOutlined /> 복사</>}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function Note({ type = 'info', title, children }: {
  type?: 'info' | 'warn' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const cls = [
    styles.note,
    type === 'warn' ? styles.noteWarn : '',
    type === 'danger' ? styles.noteDanger : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {title && <span className={styles.noteTitle}>{title}</span>}
      {children}
    </div>
  );
}

// ── 코드 예시 ────────────────────────────────────────────────────────────────

const SQL_ROLE = `-- 내 역할(ADMIN)에 전체 권한 부여 — 이걸 넣어야 메뉴가 보인다
INSERT INTO MENU_ROLE_MPNG
  (MENU_CD, ROLE_GROUP_ID, ROLE_ID, MENU_AUTHRT, CRT_DT, CRT_BY)
VALUES
  ('A04070000', 'RG09999', 'ADMIN', 'AL', NOW(), 'SYSTEM');
--                역할그룹     역할ID   권한
--                                    RD 읽기 / WT 쓰기 / AL 전체

-- 다른 역할에도 보이게 하려면 행을 더 넣는다
-- ('A04070000', 'RG00001', 'OPERATOR', 'WT', NOW(), 'SYSTEM');

-- 확인
SELECT MENU_CD, ROLE_ID, MENU_AUTHRT
  FROM MENU_ROLE_MPNG
 WHERE MENU_CD = 'A04070000';`;

const CODE_EMPTY = `export default function CNT010001SC() {
  return (
    <div className="page-container">
      <h2>공지사항 관리</h2>
    </div>
  );
}`;

const CODE_API = `import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 서버 DTO 와 1:1 인 타입은 이 파일에 같이 둔다.
export interface Notice {
  ntcId:   number;
  ntcTtl:  string;   // 제목
  ntcCntn: string;   // 내용
  useYn:   string;
  crtDt?:  string;
}

export interface NoticeListParams {
  ntcTtl?: string;   // 제목 부분일치
  useYn?:  string;
}

// 목록
export async function getNoticeList(
  params: NoticeListParams,
): Promise<ApiResponse<Notice[]>> {
  const { data } = await apiClient.get<ApiResponse<Notice[]>>('/api/notice', { params });
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

// 등록·수정 (ntcId 유무로 서버가 갈라도 되고, 화면에서 나눠도 된다)
export async function saveNotice(item: Notice): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/notice', item);
  return { success: data.status === 200, message: data.message, data: null };
}

// 삭제
export async function deleteNotice(ntcId: number): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(\`/api/notice/\${ntcId}\`);
  return { success: data.status === 200, message: data.message, data: null };
}`;

const CODE_LIST = `import { useState, useMemo, useCallback, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { Input } from 'antd';
import FilterPanel from '@/components/layout/FilterPanel';
import GridPanel from '@/components/grid/GridPanel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getNoticeList } from '@/api/cnt/noticeApi';
import type { Notice, NoticeListParams } from '@/api/cnt/noticeApi';

export default function CNT010001SC() {
  // 검색 입력값과 "적용된 조건"은 나눈다 — 타이핑할 때마다 조회하지 않기 위해서다.
  const [filterTtl, setFilterTtl] = useState('');
  const [applied, setApplied] = useState<NoticeListParams | null>(null);

  const gridRef = useRef<AgGridReact<Notice>>(null);

  // enabled 로 막아 두면 탭을 열어도 조회하지 않는다. 조회 버튼에서 시작한다.
  const { data: rows = [], isLoading } = useApiQuery<Notice[]>(
    ['notice', 'list', applied],
    () => getNoticeList(applied ?? {}),
    { enabled: applied !== null },
  );

  const handleSearch = useCallback(() => {
    setApplied({ ntcTtl: filterTtl.trim() || undefined });
  }, [filterTtl]);

  // 초기화는 입력만 비운다 — 보고 있던 결과를 지우지 않는다.
  const handleReset = useCallback(() => setFilterTtl(''), []);

  const columnDefs = useMemo<ColDef<Notice>[]>(() => [
    { field: 'ntcId',  headerName: '번호',   width: 90, flex: 0 },
    { field: 'ntcTtl', headerName: '제목',   minWidth: 240 },
    { field: 'useYn',  headerName: '사용',   width: 80, flex: 0 },
    { field: 'crtDt',  headerName: '등록일', width: 150, flex: 0 },
  ], []);

  return (
    <div className="page-container">
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleReset}
        activeFilterCount={filterTtl ? 1 : 0}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">제목</span>
          <Input
            value={filterTtl}
            onChange={(e) => setFilterTtl(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* page-body 가 남은 높이를 그리드에 넘긴다 — flex 를 직접 짜지 않는다 */}
      <div className="page-body">
        <GridPanel<Notice>
          totalCount={rows.length}
          columnDefs={columnDefs}
          rowData={rows}
          rowKey="ntcId"
          gridRef={gridRef}
          loading={isLoading}
          height="100%"
          pagination={false}
        />
      </div>
    </div>
  );
}`;

const CODE_CRUD = `import { Form, Row, Col, Input } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import FormPanel from '@/components/layout/FormPanel';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import TipInput from '@/components/inputs/TipInput';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useNotify } from '@/hooks/useNotify';
import { saveNotice, deleteNotice } from '@/api/cnt/noticeApi';

// ── 위 목록 화면 안에 이어서 넣는다 ──────────────────────────────
const { notify, dialog } = useNotify();
const queryClient = useQueryClient();
const [form] = Form.useForm<Notice>();
const [selected, setSelected] = useState<Notice | null>(null);
const isEditMode = selected !== null;

const saveMutation   = useApiMutation<void, Notice>(saveNotice);
const deleteMutation = useApiMutation<void, number>(deleteNotice);

// 저장 후에는 접두 무효화. refetch() 는 지금 조건의 캐시만 갱신해서,
// 조건을 바꿔 다시 조회하면 낡은 결과가 나온다.
const invalidate = useCallback(() => {
  queryClient.invalidateQueries({ queryKey: ['notice', 'list'] });
}, [queryClient]);

// 그리드 행 클릭 → 폼에 채우기
const handleRowClick = useCallback((row: Notice) => {
  setSelected(row);
  form.setFieldsValue(row);
}, [form]);

const handleFormReset = useCallback(() => {
  setSelected(null);
  form.resetFields();
  gridRef.current?.api?.deselectAll();
}, [form]);

const handleSave = useCallback(() => {
  form.validateFields().then((values) => {
    dialog.confirm({
      content: isEditMode ? '수정하시겠습니까?' : '등록하시겠습니까?',
      // onError 는 달지 않는다 — 에러 토스트는 apiClient 인터셉터가 이미 띄운다.
      onOk: () => saveMutation.mutate({ ...selected, ...values }, {
        onSuccess: () => {
          notify.success(isEditMode ? '수정되었습니다.' : '등록되었습니다.');
          handleFormReset();
          invalidate();
        },
      }),
    });
  });
}, [form, isEditMode, selected, dialog, saveMutation, notify, handleFormReset, invalidate]);

const handleDelete = useCallback(() => {
  if (!selected) return;
  dialog.confirm({
    content: '삭제하시겠습니까?',
    okButtonProps: { danger: true },
    onOk: () => deleteMutation.mutate(selected.ntcId, {
      onSuccess: () => {
        notify.success('삭제되었습니다.');
        handleFormReset();
        invalidate();
      },
    }),
  });
}, [selected, dialog, deleteMutation, notify, handleFormReset, invalidate]);

// ── JSX — 그리드 아래에 붙인다 ──────────────────────────────────
<FormPanel
  title="공지사항 정보"
  editMode={isEditMode}
  actions={
    <ActionButtonGroup
      preset="formEdit"
      canWrite={canWrite}
      items={[
        { key: 'reset',  action: 'reset',       label: '초기화', onClick: handleFormReset },
        { key: 'delete', action: 'deleteRow',   label: '삭제',   onClick: handleDelete, disabled: !isEditMode },
        { key: 'save',   action: 'saveChanges', label: '저장',   onClick: handleSave },
      ]}
    />
  }
>
  <Form form={form} layout="horizontal" labelCol={{ style: { width: 80 } }}>
    <Row gutter={[12, 4]}>
      <Col span={8}>
        <Form.Item label="번호" name="ntcId">
          <TipInput readOnly />
        </Form.Item>
      </Col>
      <Col span={16}>
        <Form.Item label="제목" name="ntcTtl" rules={[{ required: true, message: '' }]}>
          <TipInput maxLength={200} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="내용" name="ntcCntn">
          <Input.TextArea rows={3} maxLength={2000} />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</FormPanel>`;

const CODE_PERM = `import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

// ActionButtonGroup 에 넘기면 쓰기 계열 버튼이 자동으로 비활성된다.
// (addRow / deleteRow / saveChanges / register / excelUpload / upload)
<ActionButtonGroup preset="formEdit" canWrite={canWrite} items={[ ... ]} />

// 그리드 인라인 편집도 같이 막는다
<GridPanel editable={canWrite} ... />`;

const CODE_LABEL = `import { useScreenLabel } from '@/hooks/useScreenLabel';

// sceId 는 탭에서 자동으로 들어온다 — 인자로 넘길 필요가 없다.
const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();

<span>{tvt('ntcTtl', '제목')}</span>              // CNT010001SC.VIEW.TEXT_ntcTtl
<FormPanel title={tvh('info', '공지사항 정보')} /> // CNT010001SC.VIEW.TITLE_info
{ headerName: tsg('ntcTtl', '제목') }             // CNT010001SC.SCRIPT.GRID_ntcTtl

dialog.confirm({ content: tmc('C100001') });      // 전역: 등록하시겠습니까?
notify.success(tmi('I100002'));                   // 전역: 등록되었습니다.
notify.error(tme('E100001'));                     // 전역: 필수 항목을 입력해 주세요.

// 값이 들어가는 문장은 쪼개지 말고 자리표시자를 쓴다
import { formatLabel } from '@/lib/i18n/formatLabel';
formatLabel(tsm('deleteConfirm', '{0}을(를) 삭제하시겠습니까?'), row.ntcTtl);`;

const CODE_STATE = `// ① 서버 데이터 → React Query. 직접 useState 에 담지 않는다.
const { data: rows = [] } = useApiQuery<Notice[]>(['notice', 'list', applied], ...);

// ② 이 화면에서만 쓰는 상태 → useState.
const [selected, setSelected] = useState<Notice | null>(null);

// ③ 화면 밖에서도 공유하는 상태 → Zustand.
//    이미 만들어진 스토어가 있다 (authStore / tabStore / labelStore / comcdStore …).
//    새로 만들 일은 드물다. 필요하면 이 형태로 만든다.
import { create } from 'zustand';

interface NoticeFilterStore {
  keyword: string;
  setKeyword: (v: string) => void;
}

export const useNoticeFilterStore = create<NoticeFilterStore>()((set) => ({
  keyword: '',
  setKeyword: (keyword) => set({ keyword }),
}));

// 사용 — 필요한 값만 골라 구독한다. 통째로 구독하면 무관한 변경에도 다시 그린다.
const keyword = useNoticeFilterStore((s) => s.keyword);`;

// ── 본문 ─────────────────────────────────────────────────────────────────────

/**
 * 스크롤 컨테이너 기준의 섹션 위치(px).
 *
 * `offsetTop` 은 `offsetParent` 기준이라 스크롤 컨테이너와 다를 수 있어 쓰지 않는다 —
 * 컨테이너에 `position` 이 없으면 바깥 요소가 기준이 되어 그만큼 어긋난 위치에서 멈춘다.
 * 화면 좌표 차이로 구하면 조상 요소의 positioning 과 무관하게 항상 맞는다.
 */
function offsetWithin(container: HTMLElement, el: HTMLElement): number {
  return el.getBoundingClientRect().top
       - container.getBoundingClientRect().top
       + container.scrollTop;
}

export default function DevGuideHome() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const handleJump = useCallback((id: string) => {
    const body = bodyRef.current;
    const target = body?.querySelector<HTMLElement>(`#${id}`);
    if (!body || !target) return;
    // 제목 줄이 컨테이너 맨 위에 오도록 — 여백을 빼지 않는다
    body.scrollTo({ top: offsetWithin(body, target), behavior: 'smooth' });
    setActiveId(id);
  }, []);

  // 스크롤 위치로 현재 섹션을 표시한다 (본문이 스크롤 컨테이너라 window 가 아니다)
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const onScroll = () => {
      // 판정선을 제목 높이만큼 아래에 둔다 — 딱 맞춰 이동했을 때 반올림 오차로
      // 이전 섹션이 잡히지 않게 하려는 여유값이다.
      const line = body.scrollTop + 24;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = body.querySelector<HTMLElement>(`#${s.id}`);
        if (el && offsetWithin(body, el) <= line) current = s.id;
      }
      setActiveId(current);
    };

    body.addEventListener('scroll', onScroll, { passive: true });
    return () => body.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="page-container">
      <div className="ds-section-header">
        <h2>신규 화면 개발 가이드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          메뉴 등록부터 CRUD 화면까지, 위에서부터 순서대로 따라가면 됩니다.
          예시는 <span className={styles.path}>컨텐츠 관리 &gt; 공지사항 관리</span> 화면을 만듭니다.
        </p>
      </div>

      <div className={styles.root}>
        {/* ── 목차 */}
        <nav className={styles.toc}>
          <div className={styles.tocTitle}>목차</div>
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.tocItem} ${activeId === s.id ? styles.tocItemActive : ''}`}
              onClick={() => handleJump(s.id)}
            >
              <span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </nav>

        {/* ── 본문 */}
        <div className={styles.body} ref={bodyRef}>

          {/* 1. 준비하기 */}
          <section id="prepare" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>01</span>
              <h3>준비하기</h3>
            </div>
            <p className={styles.lead}>
              화면을 만들려면 <b>백엔드와 Redis가 떠 있어야 합니다.</b> 프론트만 띄우면 로그인부터 실패합니다.
            </p>

            <Code file="터미널">{`# 1) 로컬 인프라 — Redis (둘 중 아무 백엔드 폴더에서나 한 번만)
cd vamc-npl-admin-backend
docker compose -f docker-compose.local.yml up -d

# 2) 관리자 API (:8080)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 3) 관리자 화면 (:3000)
cd ../vamc-npl-admin-frontend
npm install
npm run dev`}</Code>

            <p>
              브라우저에서 <span className={styles.path}>http://localhost:3000</span> 접속 후
              <b> user01 / user123$</b> 로 로그인합니다.
            </p>

            <Note type="warn" title="Redis는 반드시 로컬 것을 씁니다.">
              개발서버 Redis를 바라보면 로컬에서 로그인을 몇 번 실패했을 때
              <b> 개발서버의 실제 계정이 30분 잠깁니다.</b>
            </Note>

            <Note title="백엔드 API 주소">
              <span className={styles.path}>.env.local</span> 의 <code>VITE_API_BASE_URL</code> 을 비워 두면
              Vite 프록시가 <code>/api</code> 요청을 <code>http://127.0.0.1:8080</code> 으로 넘깁니다. 기본값이므로 보통 건드릴 일이 없습니다.
            </Note>
          </section>

          {/* 2. 화면ID */}
          <section id="sceid" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>02</span>
              <h3>화면ID 정하기</h3>
            </div>
            <p className={styles.lead}>
              화면ID 하나가 <b>폴더명 · DB의 MENU_URL_ADDR · 라벨 키 접두</b>로 동시에 쓰입니다.
              그래서 코드를 짜기 전에 먼저 정합니다.
            </p>

            <p>형식은 <code>{'{도메인3}{중분류2}{소분류2}{일련2}{유형2}'}</code> 11자이고, 메뉴코드에서 그대로 유도합니다.</p>

            <Code>{`메뉴코드   A04  01  00  00     컨텐츠 관리 > 공지사항 관리
            │    │   │
도메인 3자 ──┘    │   │       A04 → CNT
중분류 2자 ───────┘   │
소분류 2자 ───────────┘
일련 2자 = 01, 유형 2자 = SC

→ 화면ID = CNT010001SC`}</Code>

            <table className={styles.table}>
              <thead>
                <tr><th>대분류 메뉴</th><th>메뉴코드</th><th>도메인</th></tr>
              </thead>
              <tbody>
                <tr><td>회원관리</td><td><code>A01</code></td><td><code>MBR</code></td></tr>
                <tr><td>거래 관리</td><td><code>A02</code></td><td><code>TRD</code></td></tr>
                <tr><td>NPL정보 관리</td><td><code>A03</code></td><td><code>NPL</code></td></tr>
                <tr><td>컨텐츠 관리</td><td><code>A04</code></td><td><code>CNT</code></td></tr>
                <tr><td>통계</td><td><code>A05</code></td><td><code>STT</code></td></tr>
                <tr><td>시스템 운영 관리</td><td><code>A06</code></td><td><code>SYS</code></td></tr>
                <tr><td>경매 관리</td><td><code>A07</code></td><td><code>AUC</code></td></tr>
              </tbody>
            </table>

            <p>
              유형은 <code>SC</code>(메뉴에 걸리는 화면) / <code>1P</code>·<code>2P</code>(팝업, 부모 화면ID + 순번)입니다.
            </p>

            <Note type="danger" title="한 번 정하면 바꾸지 않습니다.">
              메뉴가 다른 그룹으로 옮겨가도 화면ID는 그대로 둡니다.
              바꾸면 그 화면의 <b>라벨 키가 통째로 어긋나</b> 다국어가 전부 깨집니다.
            </Note>
          </section>

          {/* 3. 메뉴 등록 */}
          <section id="menu" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>03</span>
              <h3>메뉴 등록</h3>
            </div>
            <p className={styles.lead}>
              메뉴는 코드가 아니라 <b>DB가 정본</b>입니다. 하지만 SQL을 직접 쓸 필요는 없습니다 —
              <span className={styles.path}>시스템 운영 관리 &gt; Admin 메뉴 관리</span> 화면에서 등록·수정·삭제합니다.
            </p>

            <h4>먼저 확인 — 메뉴가 이미 있는지</h4>
            <p>
              기획 IA로 만든 메뉴 56개가 이미 들어가 있습니다. 대부분 <b>컴포넌트경로가 비어 있어</b>
              클릭하면 미구현 안내가 뜹니다. 내가 만들 화면의 메뉴가 이미 있다면 그 칸만 채우면 됩니다.
            </p>
            <p>
              메뉴코드 <code>A04010000</code> 으로 검색해 <b>공지사항 관리</b> 행을 클릭하면 아래 폼에 값이 채워집니다.
              <b> 컴포넌트경로</b>에 앞에서 정한 화면ID <code>CNT010001SC</code> 를 넣고 저장합니다.
            </p>

            <h4>메뉴 자체가 없다면 — 신규 등록</h4>
            <p>폼을 비운 상태(초기화)에서 아래 값을 넣고 저장합니다.</p>

            <table className={styles.table}>
              <thead>
                <tr><th>항목</th><th>넣는 값</th><th>비고</th></tr>
              </thead>
              <tbody>
                <tr><td>메뉴코드</td><td><code>A04070000</code></td><td>등록 후 변경 불가</td></tr>
                <tr><td>메뉴명(KR)</td><td>샘플 관리</td><td>번역이 없는 언어의 폴백</td></tr>
                <tr><td>다국어 메뉴명</td><td>Sample Mgmt</td><td><b>조회 언어</b>의 이름으로 저장된다</td></tr>
                <tr><td>상위메뉴코드</td><td><code>A04000000</code></td><td>필수</td></tr>
                <tr><td>메뉴순서</td><td>7</td><td>형제 메뉴 사이 정렬</td></tr>
                <tr><td>메뉴레벨</td><td>—</td><td><b>서버가 상위 메뉴에서 계산</b>한다</td></tr>
                <tr><td>컴포넌트경로</td><td><code>CNT070001SC</code></td><td>화면ID. 비우면 미구현 안내</td></tr>
                <tr><td>라벨코드</td><td>—</td><td>비우면 <code>lbl.menu.{'{'}메뉴코드{'}'}</code> 로 채워진다</td></tr>
              </tbody>
            </table>

            <Note title="저장 한 번에 메뉴와 이름이 함께 들어갑니다.">
              메뉴 행(<code>MENU_MNG</code>)과 메뉴 이름 라벨(<code>LANG_LBL</code> + <code>LANG_LBL_TRSL</code>)을
              서버가 한 트랜잭션에서 처리합니다. 라벨이 없으면 메뉴 이름이 <code>lbl.menu.…</code> 로 보이기 때문에
              나눠서 넣지 않습니다.
            </Note>

            <h4>다른 언어 이름 넣기</h4>
            <p>
              <b>다국어 메뉴명은 조회 조건의 언어로 저장</b>됩니다. 영어 이름을 넣으려면
              검색 영역의 <b>언어</b>를 <code>EN</code> 으로 바꿔 조회한 뒤, 그 행을 클릭해 다국어 메뉴명을 고치고 저장합니다.
              베트남어도 같은 방식입니다.
            </p>

            <h4>삭제</h4>
            <p>
              행을 선택하고 삭제하면 메뉴·역할 매핑·규약 라벨이 함께 지워집니다.
              <b> 하위 메뉴가 있으면 거부</b>됩니다 — 부모를 잃은 하위 메뉴는 어느 화면에도 나오지 않는 행으로 남기 때문입니다.
              하위부터 지웁니다.
            </p>

            <h4>신규 등록이면 한 단계 더 — 권한 부여 (SQL)</h4>
            <p>
              메뉴를 저장해도 <b>바로 보이지 않습니다.</b> 메뉴 트리는 역할 권한
              (<code>MENU_ROLE_MPNG</code>)을 조인해서 가져오는데, 신규 메뉴에는 아직 매핑이 없기 때문입니다.
            </p>
            <p>
              권한 부여는 <span className={styles.path}>시스템 운영 관리 &gt; Admin 관리 &gt; Admin 메뉴 권한 관리</span>
              (<code>A06030400</code>) 화면의 몫인데, <b>이 화면은 아직 구현되지 않았습니다.</b>
              그때까지는 SQL로 넣습니다.
            </p>

            <Code file="SQL — 역할 권한 부여">{SQL_ROLE}</Code>

            <Note type="warn" title="기존 메뉴에 화면만 연결하는 경우는 필요 없습니다.">
              IA로 들어온 메뉴 56개에는 ADMIN 권한이 이미 있습니다.
              이 단계는 <b>메뉴를 새로 만들었을 때만</b> 해당합니다.
            </Note>

            <Note title="Admin 메뉴 권한 관리 화면이 만들어지면">
              이 SQL은 그 화면에서 하면 됩니다. 메뉴 등록 화면은 권한을 건드리지 않습니다 —
              권한을 주는 곳이 두 군데로 갈라지면, 나중에 <b>누가 준 권한인지 설명할 수 없게 되기</b> 때문입니다.
              (참고: 그 화면을 만드는 것 자체가 이 가이드의 좋은 실습 과제입니다.)
            </Note>

            <Note type="warn" title="바로 안 보이면 캐시입니다.">
              저장하면 서버 메뉴 캐시가 비워지지만, 좌측 레일은 브라우저에도 캐시가 있습니다.
              <b> 로그아웃 후 다시 로그인</b>하면 확실합니다.
            </Note>

            <Note type="danger" title="개발자 DB 계정은 DML만 가능합니다.">
              <code>CREATE / ALTER / DROP</code> 은 서버에서 막혀 있습니다.
              <code> CREATE command denied</code> 는 고장이 아니라 정상입니다.
              테이블이 필요하면 DA에게 요청합니다.
            </Note>
          </section>

          {/* 4. 빈 화면 */}
          <section id="empty" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>04</span>
              <h3>빈 화면 만들기</h3>
            </div>
            <p className={styles.lead}>
              <b>폴더명을 화면ID로 만들면 끝입니다.</b> 어딘가에 등록하는 절차가 없습니다 —
              <code> componentRegistry</code> 가 <code>src/features/*/*/index.tsx</code> 를 자동으로 찾습니다.
            </p>

            <Code file="src/features/cnt/CNT010001SC/index.tsx">{CODE_EMPTY}</Code>

            <p>
              저장하고 메뉴를 클릭하면 탭이 열리고 이 화면이 뜹니다. 여기까지가 배선 확인입니다.
            </p>

            <table className={styles.table}>
              <thead>
                <tr><th>규칙</th><th>이유</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>폴더는 <code>features/{'{도메인}'}/{'{화면ID}'}/</code> 2단계</td>
                  <td>글롭이 2단계 고정. 더 깊으면 발견되지 않는다</td>
                </tr>
                <tr>
                  <td>팝업은 자식 폴더 <code>{'{화면ID}'}/{'{화면ID}'}1P/</code></td>
                  <td>3단계라 자동 제외 — 메뉴로 열리지 않게 하려는 의도</td>
                </tr>
                <tr>
                  <td>데모·샘플은 <code>src/dev/pages/</code></td>
                  <td>운영 빌드에서 통째로 빠진다</td>
                </tr>
              </tbody>
            </table>

            <Note type="warn" title="화면이 안 뜨고 미구현 안내가 나온다면">
              폴더명과 <code>MENU_URL_ADDR</code> 이 <b>글자 단위로 같은지</b> 확인합니다.
              대소문자도 구분합니다.
            </Note>
          </section>

          {/* 5. API */}
          <section id="api" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>05</span>
              <h3>API 파일 만들기</h3>
            </div>
            <p className={styles.lead}>
              API 호출 코드는 <b>예외 없이</b> <code>src/api/{'{도메인}'}/{'{업무}'}Api.ts</code> 에 둡니다.
              화면 폴더 안에 <code>api.ts</code> 를 만들지 않습니다 — 다른 화면이 같은 API를 쓸 때
              화면끼리 import하게 되고, 그때부터 어느 쪽이 원본인지 알 수 없게 됩니다.
            </p>

            <Code file="src/api/cnt/noticeApi.ts">{CODE_API}</Code>

            <Note type="danger" title="status → success 변환을 빠뜨리지 마세요.">
              서버는 <code>{'{ status, message, data }'}</code> 만 내려주고 <code>success</code> 필드가 없습니다.
              <code> useApiQuery / useApiMutation</code> 은 <code>success === true</code> 로 성패를 판단하므로,
              변환을 빠뜨리면 <b>정상 응답도 실패로 처리됩니다.</b>
            </Note>

            <Note title="경로에 /api 접두를 꼭 붙입니다.">
              <code>baseURL</code> 이 비어 있어 Vite 프록시가 <code>/api</code> 로 시작하는 요청만 백엔드로 넘깁니다.
            </Note>

            <h4>파일 이름 규칙</h4>
            <ul>
              <li><code>Api</code> 접미사를 붙여 <b>파일명만 보고 API 파일임을</b> 알 수 있게 합니다.</li>
              <li>앞부분은 화면ID가 아니라 <b>업무명</b>입니다 — <code>noticeApi.ts</code>, <code>lblMngApi.ts</code>.</li>
              <li><code>usr.ts</code>·<code>lbl.ts</code> 같은 <b>한 단어 축약은 금지</b>입니다. 같은 자원의 조회용/관리용 파일이 생기는 순간 구분되지 않습니다.</li>
            </ul>

            <h4>서버 엔드포인트가 아직 없다면</h4>
            <p>
              화면은 빈 목록으로 뜨고 404 토스트가 납니다. 관리자 API(<code>vamc-npl-admin-backend</code>)에
              아래 순서로 추가합니다. 자세한 규칙은 그 저장소의 <code>README.md</code> 에 있습니다.
            </p>
            <Code>{`1. dto/        요청·응답 DTO (validation 어노테이션 포함)
2. domain/     Entity
3. mapper/     Mapper 인터페이스 + XML
4. service/    Service (@Transactional)
5. controller/ Controller (Swagger 어노테이션 + @Valid)
   → 성공 응답은 ApiResponse<T> 래핑 필수
   → 쓰기 API 는 permissionGuard.assertMenuWrite(authentication, "A04010000")`}</Code>
          </section>

          {/* 6. 목록 */}
          <section id="list" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>06</span>
              <h3>목록 조회 화면</h3>
            </div>
            <p className={styles.lead}>
              화면 골격은 <b>위에서부터 검색 → 그리드 → 입력폼</b> 세 덩어리입니다.
              레이아웃은 공용 컴포넌트가 담당하므로 화면에서 flex를 직접 짜지 않습니다.
            </p>

            <Code file="src/features/cnt/CNT010001SC/index.tsx">{CODE_LIST}</Code>

            <table className={styles.table}>
              <thead>
                <tr><th>컴포넌트</th><th>역할</th></tr>
              </thead>
              <tbody>
                <tr><td><code>FilterPanel</code></td><td>검색 영역. 조회·초기화 버튼을 자체 제공</td></tr>
                <tr><td><code>{'<div className="page-body">'}</code></td><td>남은 높이를 본문에 넘기는 표준 클래스</td></tr>
                <tr><td><code>GridPanel</code></td><td>툴바(건수·버튼) + AG Grid</td></tr>
                <tr><td><code>useApiQuery</code></td><td><code>ApiResponse</code> 를 벗겨 <code>data</code> 만 돌려줌</td></tr>
              </tbody>
            </table>

            <Note title="검색은 서버에서 합니다.">
              전건을 받아 화면에서 <code>filter()</code> 하지 않습니다. 지금은 데이터가 적어 돌아가도,
              건수가 늘면 그대로 사고가 됩니다. 조건은 <code>queryKey</code> 에 실어 보냅니다 —
              조건이 바뀌면 React Query가 알아서 다시 조회합니다.
            </Note>

            <Note title="좌우로 그리드를 나누고 싶다면">
              <code>SplitPanel</code> 을 씁니다. 드래그 리사이즈가 딸려 있고,
              영역 제목은 <code>GridPanel</code> 의 <code>title</code> 로 넣습니다.
            </Note>
          </section>

          {/* 7. CRUD */}
          <section id="crud" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>07</span>
              <h3>등록·수정·삭제</h3>
            </div>
            <p className={styles.lead}>
              그리드 아래 <code>FormPanel</code> 을 붙이고, 행을 클릭하면 폼에 채웁니다.
              <b> 등록과 수정은 같은 폼</b>이고 선택된 행이 있는지로 갈립니다.
            </p>

            <Code file="src/features/cnt/CNT010001SC/index.tsx (이어서)">{CODE_CRUD}</Code>

            <h4>꼭 지킬 것 세 가지</h4>
            <table className={styles.table}>
              <thead>
                <tr><th>항목</th><th>이유</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>저장 후 <code>invalidateQueries</code> (접두)</td>
                  <td><code>refetch()</code> 는 지금 조건의 캐시만 갱신한다. 조건을 바꿔 조회하면 낡은 결과가 나온다</td>
                </tr>
                <tr>
                  <td><code>onError</code> 를 달지 않는다</td>
                  <td>에러 토스트는 <code>apiClient</code> 인터셉터가 이미 띄운다. 달면 두 번 뜬다</td>
                </tr>
                <tr>
                  <td>버튼은 <code>ActionButtonGroup</code></td>
                  <td>버튼 순서·아이콘·권한 연동이 프리셋으로 통일된다</td>
                </tr>
              </tbody>
            </table>

            <Note title="화면 고유 에러 문구가 필요하면">
              요청에 <code>{'{ skipErrorToast: true }'}</code> 를 주고 <code>onError</code> 에서 직접 처리합니다.
            </Note>
          </section>

          {/* 8. 권한 */}
          <section id="perm" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>08</span>
              <h3>권한 연결</h3>
            </div>
            <p className={styles.lead}>
              권한은 <code>MENU_ROLE_MPNG.MENU_AUTHRT</code> 가 정합니다.
              <b> 읽기 권한만 있는 사용자에게 저장 버튼이 눌리면 안 됩니다.</b>
            </p>

            <table className={styles.table}>
              <thead>
                <tr><th>값</th><th>의미</th><th>canRead</th><th>canWrite</th></tr>
              </thead>
              <tbody>
                <tr><td><code>RD</code></td><td>읽기</td><td>O</td><td>X</td></tr>
                <tr><td><code>WT</code></td><td>쓰기 (읽기 포함)</td><td>O</td><td>O</td></tr>
                <tr><td><code>AL</code></td><td>전체</td><td>O</td><td>O</td></tr>
              </tbody>
            </table>

            <Code>{CODE_PERM}</Code>

            <Note title="숨기지 않고 비활성합니다.">
              버튼이 사라지면 사용자는 이유를 모릅니다. 회색 버튼은 권한 문제임이 드러납니다.
            </Note>

            <Note type="danger" title="화면만 막는 것은 권한이 아닙니다.">
              브라우저에서 얼마든지 우회됩니다. <b>서버 쓰기 API에도</b>
              <code> permissionGuard.assertMenuWrite(authentication, &quot;메뉴코드&quot;)</code> 를 반드시 넣습니다.
            </Note>
          </section>

          {/* 9. 라벨 */}
          <section id="label" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>09</span>
              <h3>다국어 라벨</h3>
            </div>
            <p className={styles.lead}>
              화면 문구는 코드에 박지 않고 <b>DB 라벨</b>에서 가져옵니다.
              한국어를 그대로 두면 언어를 바꿔도 한국어가 남습니다.
            </p>

            <Code>{CODE_LABEL}</Code>

            <table className={styles.table}>
              <thead>
                <tr><th>함수</th><th>키 형태</th><th>쓰는 곳</th></tr>
              </thead>
              <tbody>
                <tr><td><code>tvt</code></td><td><code>VIEW.TEXT_</code></td><td>항목명·필드 라벨</td></tr>
                <tr><td><code>tvb</code></td><td><code>VIEW.BTN_</code></td><td>버튼</td></tr>
                <tr><td><code>tvh</code></td><td><code>VIEW.TITLE_</code></td><td>영역·패널 제목</td></tr>
                <tr><td><code>tsg</code></td><td><code>SCRIPT.GRID_</code></td><td>그리드 헤더</td></tr>
                <tr><td><code>tsm</code></td><td><code>SCRIPT.MSG_</code></td><td>이 화면 고유 메시지</td></tr>
                <tr><td><code>tmc / tmi / tme</code></td><td><code>MESSAGE.*</code></td><td>전역 확인·안내·오류</td></tr>
              </tbody>
            </table>

            <h4>라벨 등록</h4>
            <p>
              <span className={styles.path}>시스템 운영 관리 &gt; 다국어 라벨 관리</span> 화면에서 등록합니다.
              화면ID·구분·세부코드를 넣으면 라벨코드가 자동으로 조립되고,
              오른쪽 그리드에서 언어별 번역을 입력합니다.
            </p>

            <Note title="두 번째 인자는 폴백입니다.">
              <code>tvt(&apos;ntcTtl&apos;, &apos;제목&apos;)</code> 처럼 기본 문구를 넘기면
              라벨이 아직 없어도 화면은 한국어로 정상 동작합니다.
              <b> 개발 중에는 폴백으로 진행하고, 화면이 확정되면 라벨을 한 번에 등록</b>하는 편이 편합니다.
              전역 메시지(<code>tmc/tmi/tme</code>)는 폴백이 없어 미등록이면 키 문자열이 그대로 보입니다.
            </Note>
          </section>

          {/* 10. 상태 */}
          <section id="state" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>10</span>
              <h3>상태 관리</h3>
            </div>
            <p className={styles.lead}>
              상태를 어디에 둘지 <b>세 갈래로 나눠 생각</b>하면 됩니다. 대부분은 앞의 두 개로 끝납니다.
            </p>

            <table className={styles.table}>
              <thead>
                <tr><th>무엇</th><th>어디에</th><th>예</th></tr>
              </thead>
              <tbody>
                <tr><td>서버에서 받아온 데이터</td><td><b>React Query</b></td><td>목록, 상세, 공통코드</td></tr>
                <tr><td>이 화면에서만 쓰는 값</td><td><b>useState</b></td><td>선택된 행, 검색 입력값, 폼 접힘</td></tr>
                <tr><td>화면 밖에서도 공유</td><td><b>Zustand</b></td><td>로그인 정보, 탭, 테마, 라벨</td></tr>
              </tbody>
            </table>

            <Code>{CODE_STATE}</Code>

            <Note type="danger" title="서버 데이터를 Zustand에 넣지 마세요.">
              캐시·재조회·로딩 상태를 직접 관리하게 되고, 저장 후 갱신을 빠뜨리면
              <b> 화면마다 다른 데이터가 보입니다.</b> 서버에서 온 것은 React Query에 맡깁니다.
            </Note>

            <h4>이미 있는 스토어</h4>
            <p>새로 만들기 전에 이 목록을 먼저 봅니다.</p>
            <table className={styles.table}>
              <thead>
                <tr><th>스토어</th><th>담는 것</th></tr>
              </thead>
              <tbody>
                <tr><td><code>authStore</code></td><td>토큰, 사용자, 역할</td></tr>
                <tr><td><code>tabStore</code></td><td>열린 탭 목록</td></tr>
                <tr><td><code>menuStore</code></td><td>레일·플라이아웃, 서버 메뉴</td></tr>
                <tr><td><code>labelStore</code></td><td>다국어 라벨 캐시</td></tr>
                <tr><td><code>comcdStore</code></td><td>공통코드 캐시</td></tr>
                <tr><td><code>localeStore</code> / <code>themeStore</code></td><td>언어, 다크모드</td></tr>
              </tbody>
            </table>
          </section>

          {/* 11. 체크리스트 */}
          <section id="check" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>11</span>
              <h3>마무리 체크리스트</h3>
            </div>
            <p className={styles.lead}>커밋 전에 훑어봅니다.</p>

            <ul className={styles.checklist}>
              <li>메뉴를 클릭하면 탭이 열리고 화면이 뜬다</li>
              <li>폴더명 = <code>MENU_URL_ADDR</code> = 라벨 키 접두가 모두 같다</li>
              <li>API 함수가 <code>src/api/</code> 아래 있고 <code>status → success</code> 변환을 한다</li>
              <li>검색 조건을 서버로 보낸다 (화면에서 <code>filter()</code> 하지 않는다)</li>
              <li>저장·삭제 후 <code>invalidateQueries</code> 로 목록이 갱신된다</li>
              <li><code>onError</code> 로 에러 토스트를 중복해서 띄우지 않는다</li>
              <li>쓰기 버튼이 <code>canWrite</code> 로 묶여 있고 서버에도 권한 검사가 있다</li>
              <li>화면 문구가 <code>useScreenLabel</code> 을 거친다 (한국어 하드코딩 없음)</li>
              <li>레이아웃을 <code>page-body</code> · <code>SplitPanel</code> 로 잡았다 (flex 직접 작성 없음)</li>
              <li><code>npx tsc --noEmit</code> 과 <code>npm run lint</code> 가 통과한다</li>
            </ul>

            <Note title="막히면 볼 곳">
              완성된 화면 두 개가 레퍼런스입니다 —
              <span className={styles.path}>src/features/sys/SYS030101SC</span>(단일 그리드 + 폼),
              <span className={styles.path}>src/features/sys/SYS050301SC</span>(좌우 분할 + CRUD).
              공통 컴포넌트의 Props는 좌측 <b>개발 도구</b> 메뉴의 데모 화면에서 확인할 수 있습니다.
            </Note>
          </section>

        </div>
      </div>
    </div>
  );
}
