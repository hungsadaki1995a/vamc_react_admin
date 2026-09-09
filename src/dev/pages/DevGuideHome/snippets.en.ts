// Code samples for the guide — English edition.
//
// ⚠️ The code itself is character-for-character identical to snippets.ko.ts and
//    snippets.vn.ts. Only the comments and the sample display strings differ.
//    When you change the code, change all three — otherwise switching the language
//    shows different code.

export const SQL_ROLE = `-- Grant full permission to my role (ADMIN) — without this the menu stays invisible
INSERT INTO MENU_ROLE_MPNG
  (MENU_CD, ROLE_GROUP_ID, ROLE_ID, MENU_AUTHRT, CRT_DT, CRT_BY)
VALUES
  ('A04070000', 'RG09999', 'ADMIN', 'AL', NOW(), 'SYSTEM');
--                role group   role id  permission
--                                    RD read / WT write / AL all

-- Add more rows to make it visible to other roles
-- ('A04070000', 'RG00001', 'OPERATOR', 'WT', NOW(), 'SYSTEM');

-- Verify
SELECT MENU_CD, ROLE_ID, MENU_AUTHRT
  FROM MENU_ROLE_MPNG
 WHERE MENU_CD = 'A04070000';`;

export const CODE_EMPTY = `export default function CNT010001SC() {
  return (
    <div className="page-container">
      <h2>Notice Management</h2>
    </div>
  );
}`;

export const CODE_API = `import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Types that map 1:1 to a server DTO live in this file.
export interface Notice {
  ntcId:   number;
  ntcTtl:  string;   // title
  ntcCntn: string;   // body
  useYn:   string;
  crtDt?:  string;
}

export interface NoticeListParams {
  ntcTtl?: string;   // partial match on the title
  useYn?:  string;
}

// List
export async function getNoticeList(
  params: NoticeListParams,
): Promise<ApiResponse<Notice[]>> {
  const { data } = await apiClient.get<ApiResponse<Notice[]>>('/api/notice', { params });
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

// Create/update (the server may branch on ntcId, or the screen may split the calls)
export async function saveNotice(item: Notice): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/notice', item);
  return { success: data.status === 200, message: data.message, data: null };
}

// Delete
export async function deleteNotice(ntcId: number): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(\`/api/notice/\${ntcId}\`);
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
  // Keep the search input and the "applied condition" separate — so it does not
  // query on every keystroke.
  const [filterTtl, setFilterTtl] = useState('');
  const [applied, setApplied] = useState<NoticeListParams | null>(null);

  const gridRef = useRef<AgGridReact<Notice>>(null);

  // Gated by enabled: opening the tab does not query. It starts from the search button.
  const { data: rows = [], isLoading } = useApiQuery<Notice[]>(
    ['notice', 'list', applied],
    () => getNoticeList(applied ?? {}),
    { enabled: applied !== null },
  );

  const handleSearch = useCallback(() => {
    setApplied({ ntcTtl: filterTtl.trim() || undefined });
  }, [filterTtl]);

  // Reset clears the inputs only — it does not wipe the results you were looking at.
  const handleReset = useCallback(() => setFilterTtl(''), []);

  const columnDefs = useMemo<ColDef<Notice>[]>(() => [
    { field: 'ntcId',  headerName: 'No.',     width: 90, flex: 0 },
    { field: 'ntcTtl', headerName: 'Title',   minWidth: 240 },
    { field: 'useYn',  headerName: 'Use',     width: 80, flex: 0 },
    { field: 'crtDt',  headerName: 'Created', width: 150, flex: 0 },
  ], []);

  return (
    <div className="page-container">
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleReset}
        activeFilterCount={filterTtl ? 1 : 0}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Title</span>
          <Input
            value={filterTtl}
            onChange={(e) => setFilterTtl(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* page-body hands the remaining height to the grid — never write flex yourself */}
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

export const CODE_CRUD = `import { Form, Row, Col, Input } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import FormPanel from '@/components/layout/FormPanel';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import TipInput from '@/components/inputs/TipInput';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useNotify } from '@/hooks/useNotify';
import { saveNotice, deleteNotice } from '@/api/cnt/noticeApi';

// ── Add this inside the list screen above ───────────────────────
const { notify, dialog } = useNotify();
const queryClient = useQueryClient();
const [form] = Form.useForm<Notice>();
const [selected, setSelected] = useState<Notice | null>(null);
const isEditMode = selected !== null;

const saveMutation   = useApiMutation<void, Notice>(saveNotice);
const deleteMutation = useApiMutation<void, number>(deleteNotice);

// Invalidate by prefix after saving. refetch() only refreshes the current
// condition's cache, so searching with a different condition returns stale rows.
const invalidate = useCallback(() => {
  queryClient.invalidateQueries({ queryKey: ['notice', 'list'] });
}, [queryClient]);

// Grid row click → fill the form
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
      content: isEditMode ? 'Do you want to update?' : 'Do you want to register?',
      // Do not attach onError — the apiClient interceptor already shows the error toast.
      onOk: () => saveMutation.mutate({ ...selected, ...values }, {
        onSuccess: () => {
          notify.success(isEditMode ? 'Updated.' : 'Registered.');
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
    content: 'Do you want to delete?',
    okButtonProps: { danger: true },
    onOk: () => deleteMutation.mutate(selected.ntcId, {
      onSuccess: () => {
        notify.success('Deleted.');
        handleFormReset();
        invalidate();
      },
    }),
  });
}, [selected, dialog, deleteMutation, notify, handleFormReset, invalidate]);

// ── JSX — attach it below the grid ──────────────────────────────
<FormPanel
  title="Notice details"
  editMode={isEditMode}
  actions={
    <ActionButtonGroup
      preset="formEdit"
      canWrite={canWrite}
      items={[
        { key: 'reset',  action: 'reset',       label: 'Reset',  onClick: handleFormReset },
        { key: 'delete', action: 'deleteRow',   label: 'Delete', onClick: handleDelete, disabled: !isEditMode },
        { key: 'save',   action: 'saveChanges', label: 'Save',   onClick: handleSave },
      ]}
    />
  }
>
  <Form form={form} layout="horizontal" labelCol={{ style: { width: 80 } }}>
    <Row gutter={[12, 4]}>
      <Col span={8}>
        <Form.Item label="No." name="ntcId">
          <TipInput readOnly />
        </Form.Item>
      </Col>
      <Col span={16}>
        <Form.Item label="Title" name="ntcTtl" rules={[{ required: true, message: '' }]}>
          <TipInput maxLength={200} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="Body" name="ntcCntn">
          <Input.TextArea rows={3} maxLength={2000} />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</FormPanel>`;

export const CODE_PERM = `import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

// Pass it to ActionButtonGroup and the write-type buttons are disabled automatically.
// (addRow / deleteRow / saveChanges / register / excelUpload / upload)
<ActionButtonGroup preset="formEdit" canWrite={canWrite} items={[ ... ]} />

// Block inline grid editing as well
<GridPanel editable={canWrite} ... />`;

export const CODE_LABEL = `import { useScreenLabel } from '@/hooks/useScreenLabel';

// sceId comes from the tab automatically — you never pass it in.
const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();

// The fallback text is written in this repository's base language (Korean).
<span>{tvt('ntcTtl', '제목')}</span>              // CNT010001SC.VIEW.TEXT_ntcTtl
<FormPanel title={tvh('info', '공지사항 정보')} /> // CNT010001SC.VIEW.TITLE_info
{ headerName: tsg('ntcTtl', '제목') }             // CNT010001SC.SCRIPT.GRID_ntcTtl

dialog.confirm({ content: tmc('C100001') });      // global: Do you want to register?
notify.success(tmi('I100002'));                   // global: Registered.
notify.error(tme('E100001'));                     // global: Please fill in the required fields.

// Never split a sentence that contains a value — use a placeholder
import { formatLabel } from '@/lib/i18n/formatLabel';
formatLabel(tsm('deleteConfirm', '{0}을(를) 삭제하시겠습니까?'), row.ntcTtl);`;

export const CODE_STATE = `// (1) Server data → React Query. Never store it in useState yourself.
const { data: rows = [] } = useApiQuery<Notice[]>(['notice', 'list', applied], ...);

// (2) State used only by this screen → useState.
const [selected, setSelected] = useState<Notice | null>(null);

// (3) State shared beyond the screen → Zustand.
//     Stores already exist (authStore / tabStore / labelStore / comcdStore …).
//     You rarely need a new one. When you do, write it like this.
import { create } from 'zustand';

interface NoticeFilterStore {
  keyword: string;
  setKeyword: (v: string) => void;
}

export const useNoticeFilterStore = create<NoticeFilterStore>()((set) => ({
  keyword: '',
  setKeyword: (keyword) => set({ keyword }),
}));

// Usage — subscribe only to the value you need. Subscribing to the whole store
// re-renders on unrelated changes.
const keyword = useNoticeFilterStore((s) => s.keyword);`;

export const TERMINAL = `# 1) Local infrastructure — Redis (once, from either backend folder)
cd vamc-npl-admin-backend
docker compose -f docker-compose.local.yml up -d

# 2) Admin API (:8080)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 3) Admin frontend (:3000)
cd ../vamc-npl-admin-frontend
npm install
npm run dev`;
