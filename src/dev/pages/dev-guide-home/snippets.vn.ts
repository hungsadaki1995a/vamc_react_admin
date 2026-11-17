// Mã ví dụ dùng trong hướng dẫn — bản tiếng Việt.
//
// ⚠️ Phần mã hoàn toàn giống snippets.ko.ts và snippets.en.ts đến từng ký tự.
//    Chỉ khác ở chú thích và các chuỗi hiển thị trong ví dụ.
//    Khi sửa mã, hãy sửa cả ba tệp — nếu chỉ sửa một, đổi ngôn ngữ sẽ ra mã khác nhau.

export const SQL_ROLE = `-- Cấp toàn quyền cho vai trò của tôi (ADMIN) — thiếu dòng này thì menu không hiện
INSERT INTO MENU_ROLE_MPNG
  (MENU_CD, ROLE_GROUP_ID, ROLE_ID, MENU_AUTHRT, CRT_DT, CRT_BY)
VALUES
  ('A04070000', 'RG09999', 'ADMIN', 'AL', NOW(), 'SYSTEM');
--               nhóm vai trò  mã vai trò  quyền
--                                    RD đọc / WT ghi / AL toàn quyền

-- Thêm dòng nữa nếu muốn vai trò khác cũng thấy menu
-- ('A04070000', 'RG00001', 'OPERATOR', 'WT', NOW(), 'SYSTEM');

-- Kiểm tra
SELECT MENU_CD, ROLE_ID, MENU_AUTHRT
  FROM MENU_ROLE_MPNG
 WHERE MENU_CD = 'A04070000';`;

export const CODE_EMPTY = `export default function CNT010001SC() {
  return (
    <div className="page-container">
      <h2>Quản lý thông báo</h2>
    </div>
  );
}`;

export const CODE_API = `import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Kiểu tương ứng 1:1 với DTO của máy chủ thì đặt ngay trong tệp này.
export interface Notice {
  ntcMttrId:   string;   // NTC_MTTR_ID — UUID (char 36), do máy chủ sinh
  ntcMttrSeCd: string;   // phân loại SVC (thông báo dịch vụ) / BID (thông báo đấu thầu)
  ntcMttrTtl:  string;   // tiêu đề
  ntcCn:       string;   // nội dung
  expsrYn?:    string;   // hiển thị Y/N. Không gửi thì máy chủ dùng 'Y'
  inqCnt?:     number;   // lượt xem (chỉ đọc)
  crtDt?:      string;
}

export interface NoticeListParams {
  ntcMttrTtl?:  string;  // khớp một phần theo tiêu đề
  ntcMttrSeCd?: string;  // phân loại
  expsrYn?:     string;  // hiển thị
}

// Danh sách
export async function getNoticeList(
  params: NoticeListParams,
): Promise<ApiResponse<Notice[]>> {
  const { data } = await apiClient.get<ApiResponse<Notice[]>>('/api/notice', { params });
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

// Lưu gộp thêm/sửa — máy chủ phân nhánh theo việc có ntcMttrId hay không
export async function saveNotice(item: Notice): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/notice', item);
  return { success: data.status === 200, message: data.message, data: null };
}

// Xoá
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
  // Tách ô nhập tìm kiếm và "điều kiện đã áp dụng" — để không truy vấn mỗi lần gõ phím.
  const [filterTtl, setFilterTtl] = useState('');
  const [applied, setApplied] = useState<NoticeListParams | null>(null);

  const gridRef = useRef<AgGridReact<Notice>>(null);

  // Chặn bằng enabled: mở tab vẫn chưa truy vấn. Bắt đầu từ nút tìm kiếm.
  const { data: rows = [], isLoading } = useApiQuery<Notice[]>(
    ['notice', 'list', applied],
    () => getNoticeList(applied ?? {}),
    { enabled: applied !== null },
  );

  const handleSearch = useCallback(() => {
    setApplied({ ntcMttrTtl: filterTtl.trim() || undefined });
  }, [filterTtl]);

  // Khởi tạo chỉ xoá ô nhập — không xoá kết quả đang xem.
  const handleReset = useCallback(() => setFilterTtl(''), []);

  const columnDefs = useMemo<ColDef<Notice>[]>(() => [
    { field: 'ntcMttrSeCd', headerName: 'Loại',      width: 90,  flex: 0 },
    { field: 'ntcMttrTtl',  headerName: 'Tiêu đề',   minWidth: 240 },
    { field: 'expsrYn',     headerName: 'Hiển thị',  width: 80,  flex: 0 },
    { field: 'crtDt',       headerName: 'Ngày tạo',  width: 150, flex: 0 },
  ], []);

  return (
    <div className="page-container">
      <FilterPanel
        onSearch={handleSearch}
        onReset={handleReset}
        activeFilterCount={filterTtl ? 1 : 0}
      >
        <div className="ds-filter-field">
          <span className="ds-filter-field-label">Tiêu đề</span>
          <Input
            value={filterTtl}
            onChange={(e) => setFilterTtl(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </FilterPanel>

      {/* page-body chuyển phần chiều cao còn lại cho lưới — đừng tự viết flex */}
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

// ── Thêm tiếp vào màn hình danh sách ở trên ─────────────────────
const { notify, dialog } = useNotify();
const queryClient = useQueryClient();
const [form] = Form.useForm<Notice>();
const [selected, setSelected] = useState<Notice | null>(null);
const isEditMode = selected !== null;

const saveMutation   = useApiMutation<void, Notice>(saveNotice);
const deleteMutation = useApiMutation<void, string>(deleteNotice);

// Sau khi lưu thì vô hiệu hoá theo tiền tố. refetch() chỉ làm mới bộ đệm của
// điều kiện hiện tại, nên đổi điều kiện rồi tìm lại sẽ ra dữ liệu cũ.
const invalidate = useCallback(() => {
  queryClient.invalidateQueries({ queryKey: ['notice', 'list'] });
}, [queryClient]);

// Bấm dòng trên lưới → điền vào biểu mẫu
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
      content: isEditMode ? 'Bạn có muốn cập nhật?' : 'Bạn có muốn đăng ký?',
      // Đừng gắn onError — interceptor của apiClient đã hiện toast lỗi rồi.
      onOk: () => saveMutation.mutate({ ...selected, ...values }, {
        onSuccess: () => {
          notify.success(isEditMode ? 'Đã cập nhật.' : 'Đã đăng ký.');
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
    content: 'Bạn có muốn xoá?',
    okButtonProps: { danger: true },
    onOk: () => deleteMutation.mutate(selected.ntcMttrId, {
      onSuccess: () => {
        notify.success('Đã xoá.');
        handleFormReset();
        invalidate();
      },
    }),
  });
}, [selected, dialog, deleteMutation, notify, handleFormReset, invalidate]);

// ── JSX — gắn bên dưới lưới ─────────────────────────────────────
<FormPanel
  title="Thông tin thông báo"
  editMode={isEditMode}
  actions={
    <ActionButtonGroup
      preset="formEdit"
      canWrite={canWrite}
      items={[
        { key: 'reset',  action: 'reset',       label: 'Khởi tạo', onClick: handleFormReset },
        { key: 'delete', action: 'deleteRow',   label: 'Xoá',      onClick: handleDelete, disabled: !isEditMode },
        { key: 'save',   action: 'saveChanges', label: 'Lưu',      onClick: handleSave },
      ]}
    />
  }
>
  <Form form={form} layout="horizontal" labelCol={{ style: { width: 80 } }}>
    <Row gutter={[12, 4]}>
      {/* Không hiển thị ntcMttrId — UUID không có gì để xem, và nó vẫn nằm trong 'selected' */}
      <Col span={6}>
        <Form.Item label="Loại" name="ntcMttrSeCd" rules={[{ required: true, message: '' }]}>
          <Select options={[
            { value: 'SVC', label: 'Thông báo dịch vụ' },
            { value: 'BID', label: 'Thông báo đấu thầu' },
          ]} />
        </Form.Item>
      </Col>
      <Col span={18}>
        <Form.Item label="Tiêu đề" name="ntcMttrTtl" rules={[{ required: true, message: '' }]}>
          <TipInput maxLength={256} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="Nội dung" name="ntcCn" rules={[{ required: true, message: '' }]}>
          <Input.TextArea rows={3} maxLength={2000} />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</FormPanel>`;

export const CODE_PERM = `import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

// Truyền vào ActionButtonGroup thì các nút thuộc nhóm ghi tự động bị vô hiệu hoá.
// (addRow / deleteRow / saveChanges / register / excelUpload / upload)
<ActionButtonGroup preset="formEdit" canWrite={canWrite} items={[ ... ]} />

// Chặn luôn việc sửa trực tiếp trên lưới
<GridPanel editable={canWrite} ... />`;

export const CODE_LABEL = `import { useScreenLabel } from '@/hooks/useScreenLabel';

// sceId tự động lấy từ tab — không cần truyền vào.
const { tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme } = useScreenLabel();

// Văn bản dự phòng được viết bằng ngôn ngữ gốc của kho này (tiếng Hàn).
<span>{tvt('ntcMttrTtl', '제목')}</span>              // CNT010001SC.VIEW.TEXT_ntcMttrTtl
<FormPanel title={tvh('info', '공지사항 정보')} /> // CNT010001SC.VIEW.TITLE_info
{ headerName: tsg('ntcMttrTtl', '제목') }             // CNT010001SC.SCRIPT.GRID_ntcMttrTtl

dialog.confirm({ content: tmc('C100001') });      // toàn cục: Bạn có muốn đăng ký?
notify.success(tmi('I100002'));                   // toàn cục: Đã đăng ký.
notify.error(tme('E100001'));                     // toàn cục: Vui lòng nhập các mục bắt buộc.

// Câu có chèn giá trị thì đừng cắt nhỏ — hãy dùng ký tự thay thế
import { formatLabel } from '@/lib/i18n/formatLabel';
formatLabel(tsm('deleteConfirm', '{0}을(를) 삭제하시겠습니까?'), row.ntcMttrTtl);`;

export const CODE_STATE = `// (1) Dữ liệu máy chủ → React Query. Đừng tự cất vào useState.
const { data: rows = [] } = useApiQuery<Notice[]>(['notice', 'list', applied], ...);

// (2) Trạng thái chỉ màn hình này dùng → useState.
const [selected, setSelected] = useState<Notice | null>(null);

// (3) Trạng thái chia sẻ ra ngoài màn hình → Zustand.
//     Đã có sẵn các store (authStore / tabStore / labelStore / comcdStore …).
//     Hiếm khi cần tạo mới. Nếu cần thì viết theo dạng này.
import { create } from 'zustand';

interface NoticeFilterStore {
  keyword: string;
  setKeyword: (v: string) => void;
}

export const useNoticeFilterStore = create<NoticeFilterStore>()((set) => ({
  keyword: '',
  setKeyword: (keyword) => set({ keyword }),
}));

// Cách dùng — chỉ đăng ký giá trị bạn cần. Đăng ký cả store sẽ vẽ lại
// ngay cả khi thay đổi không liên quan.
const keyword = useNoticeFilterStore((s) => s.keyword);`;

export const TERMINAL = `# 1) Hạ tầng cục bộ — Redis (chạy một lần, từ thư mục backend nào cũng được)
cd vamc-npl-admin-backend
docker compose -f docker-compose.local.yml up -d

# 2) API quản trị (:8080)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 3) Màn hình quản trị (:3000)
cd ../vamc-npl-admin-frontend
corepack enable
pnpm install
pnpm dev`;
