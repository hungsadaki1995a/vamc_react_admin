// 가이드에 싣는 코드 예시 — 한국어판.
//
// ⚠️ snippets.en.ts · snippets.vn.ts 와 **코드 자체는 글자 단위로 같다.**
//    다른 것은 주석과 샘플 화면 문구뿐이다. 코드를 고치면 세 파일을 함께 고친다 —
//    한쪽만 고치면 언어를 바꿨을 때 다른 코드가 나온다.

export const SQL_ROLE = `-- 내 역할(ADMIN)에 전체 권한 부여 — 이걸 넣어야 메뉴가 보인다
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

export const CODE_EMPTY = `export default function CNT010001SC() {
  return (
    <div className="page-container">
      <h2>공지사항 관리</h2>
    </div>
  );
}`;

export const CODE_API = `import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 서버 DTO 와 1:1 인 타입은 이 파일에 같이 둔다.
export interface Notice {
  ntcMttrId:   string;   // NTC_MTTR_ID — UUID(char 36). 서버가 만든다
  ntcMttrSeCd: string;   // 구분 SVC(서비스 공지) / BID(입찰 공고)
  ntcMttrTtl:  string;   // 제목
  ntcCn:       string;   // 내용
  expsrYn?:    string;   // 노출 여부 Y/N. 안 보내면 서버가 'Y'
  inqCnt?:     number;   // 조회수 (읽기 전용)
  crtDt?:      string;
}

export interface NoticeListParams {
  ntcMttrTtl?:  string;  // 제목 부분일치
  ntcMttrSeCd?: string;  // 구분
  expsrYn?:     string;  // 노출 여부
}

// 목록
export async function getNoticeList(
  params: NoticeListParams,
): Promise<ApiResponse<Notice[]>> {
  const { data } = await apiClient.get<ApiResponse<Notice[]>>('/api/notice', { params });
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

// 등록·수정 통합 저장 — 서버가 ntcMttrId 유무로 등록/수정을 가른다
export async function saveNotice(item: Notice): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/notice', item);
  return { success: data.status === 200, message: data.message, data: null };
}

// 삭제
export async function deleteNotice(ntcMttrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(\`/api/notice/\${ntcMttrId}\`);
  return { success: data.status === 200, message: data.message, data: null };
}`;

export const CODE_LIST = `import { useState, useMemo, useCallback, useRef } from 'react';
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
    setApplied({ ntcMttrTtl: filterTtl.trim() || undefined });
  }, [filterTtl]);

  // 초기화는 입력만 비운다 — 보고 있던 결과를 지우지 않는다.
  const handleReset = useCallback(() => setFilterTtl(''), []);

  const columnDefs = useMemo<ColDef<Notice>[]>(() => [
    { field: 'ntcMttrSeCd', headerName: '구분',   width: 90,  flex: 0 },
    { field: 'ntcMttrTtl',  headerName: '제목',   minWidth: 240 },
    { field: 'expsrYn',     headerName: '노출',   width: 80,  flex: 0 },
    { field: 'crtDt',       headerName: '등록일', width: 150, flex: 0 },
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
          rowKey="ntcMttrId"
          gridRef={gridRef}
          loading={isLoading}
          height="100%"
          pagination={false}
        />
      </div>
    </div>
  );
}`;

export const CODE_CRUD = `import { Form, Row, Col, Input, Select } from 'antd';
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
const deleteMutation = useApiMutation<void, string>(deleteNotice);

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
    onOk: () => deleteMutation.mutate(selected.ntcMttrId, {
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
      {/* ntcMttrId 는 화면에 두지 않는다 — UUID 라 보여 줄 값이 아니고, selected 에 남아 있다 */}
      <Col span={6}>
        <Form.Item label="구분" name="ntcMttrSeCd" rules={[{ required: true, message: '' }]}>
          <Select options={[
            { value: 'SVC', label: '서비스 공지' },
            { value: 'BID', label: '입찰 공고' },
          ]} />
        </Form.Item>
      </Col>
      <Col span={18}>
        <Form.Item label="제목" name="ntcMttrTtl" rules={[{ required: true, message: '' }]}>
          <TipInput maxLength={256} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="내용" name="ntcCn" rules={[{ required: true, message: '' }]}>
          <Input.TextArea rows={3} maxLength={2000} />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</FormPanel>`;

export const CODE_PERM = `import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

// ActionButtonGroup 에 넘기면 쓰기 계열 버튼이 자동으로 비활성된다.
// (addRow / deleteRow / saveChanges / register / excelUpload / upload)
<ActionButtonGroup preset="formEdit" canWrite={canWrite} items={[ ... ]} />

// 그리드 인라인 편집도 같이 막는다
<GridPanel editable={canWrite} ... />`;

export const CODE_LABEL = `import { useScreenLabel } from '@/hooks/useScreenLabel';

// sceId 는 탭에서 자동으로 들어온다 — 인자로 넘길 필요가 없다.
const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();

<span>{tvt('ntcMttrTtl', '제목')}</span>              // CNT010001SC.VIEW.TEXT_ntcMttrTtl
<FormPanel title={tvh('info', '공지사항 정보')} /> // CNT010001SC.VIEW.TITLE_info
{ headerName: tsg('ntcMttrTtl', '제목') }             // CNT010001SC.SCRIPT.GRID_ntcMttrTtl

dialog.confirm({ content: tmc('C100001') });      // 전역: 등록하시겠습니까?
notify.success(tmi('I100002'));                   // 전역: 등록되었습니다.
notify.error(tme('E100001'));                     // 전역: 필수 항목을 입력해 주세요.

// 값이 들어가는 문장은 쪼개지 말고 자리표시자를 쓴다
import { formatLabel } from '@/lib/i18n/formatLabel';
formatLabel(tsm('deleteConfirm', '{0}을(를) 삭제하시겠습니까?'), row.ntcMttrTtl);`;

export const CODE_STATE = `// ① 서버 데이터 → React Query. 직접 useState 에 담지 않는다.
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

export const TERMINAL = `# 1) 로컬 인프라 — Redis (둘 중 아무 백엔드 폴더에서나 한 번만)
cd vamc-npl-admin-backend
docker compose -f docker-compose.local.yml up -d

# 2) 관리자 API (:8080)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 3) 관리자 화면 (:3000)
cd ../vamc-npl-admin-frontend
npm install
npm run dev`;
