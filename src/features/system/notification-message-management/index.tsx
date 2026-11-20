import { useState } from 'react';
import { DatePicker, Input, Modal, Radio, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  createNotificationMessage,
  deleteNotificationMessages,
  getNotificationMessages,
  toggleNotificationMessageUse,
  updateNotificationMessage,
  type NotificationMessageItem,
} from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, FormField, SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { errorMessage, rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Notification Message Management (menu A06060100). */
export default function NotificationMessageManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState<DateRange>(null);
  const [prcsSttsCd, setPrcsSttsCd] = useState('');
  const [notiTtl, setNotiTtl] = useState('');
  const [applied, setApplied] = useState<{ crtFromDt?: string; crtToDt?: string; prcsSttsCd?: string; notiTtl?: string }>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<NotificationMessageItem | null | undefined>(undefined);

  const { data, isFetching } = useApiQuery<PageResponse<NotificationMessageItem>>(
    ['sys', 'noti-messages', applied, page],
    () => getNotificationMessages(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const refresh = () => {
    setSelectedKeys([]);
    void queryClient.invalidateQueries({ queryKey: ['sys', 'noti-messages'] });
  };

  const handleSearch = () => {
    setApplied({
      crtFromDt: period?.[0]?.format('YYYY-MM-DD'),
      crtToDt: period?.[1]?.format('YYYY-MM-DD'),
      prcsSttsCd: prcsSttsCd || undefined,
      notiTtl: notiTtl.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setPrcsSttsCd('');
    setNotiTtl('');
    setApplied({});
    setPage(1);
  };

  const handleDelete = () => {
    if (!selectedKeys.length) { toast.warning('Select at least one message.'); return; }
    dialog.warning({
      okCancel: true,
      content: `Delete ${selectedKeys.length} selected message(s)?`,
      onOk: async () => {
        try {
          await deleteNotificationMessages(selectedKeys);
          toast.success('Deleted.');
          refresh();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<NotificationMessageItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Use',
      dataIndex: 'useYn',
      width: 80,
      align: 'center',
      render: (v: string, row) => (
        <a
          className={v === 'Y' ? styles.useY : styles.useN}
          onClick={() => canWrite && void toggleNotificationMessageUse(row.notiMsgId, v === 'Y' ? 'N' : 'Y').then(refresh)}
        >
          {v === 'Y' ? 'Used' : 'Unused'}
        </a>
      ),
    },
    { title: 'Media', dataIndex: 'notiMediaSe', width: 100, align: 'center' },
    { title: 'Processing', dataIndex: 'prcsSttsCd', width: 110, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Lang', dataIndex: 'langCd', width: 70, align: 'center' },
    {
      title: 'Title',
      dataIndex: 'notiTtl',
      width: 300,
      render: (v: string, row) => <a className={styles.cellLink} onClick={() => setModalItem(row)}>{v}</a>,
    },
    { title: 'Menu', dataIndex: 'menuNm', width: 160, render: (v?: string) => v || '-' },
    { title: 'Created At', dataIndex: 'crtDt', width: 130, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'Notification Management', 'Notification Message Management']}
        title="Notification Message Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <DatePicker.RangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className="w-[240px]" />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Processing Type</span>
            <Select
              className="w-[150px]"
              value={prcsSttsCd}
              onChange={setPrcsSttsCd}
              options={[
                { value: '', label: 'All' },
                { value: 'RCPT', label: 'Receipt' },
                { value: 'PRCS', label: 'Processing' },
                { value: '1ST_ATRZ', label: '1st Approval' },
                { value: '2ND_ATRZ', label: '2nd Approval' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Title</span>
            <Input className={styles.filterInput} value={notiTtl} onChange={(e) => setNotiTtl(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}><span className={styles.totalCount}>Total ({total})</span></div>

      <div className={styles.tableWrapper}>
        <Table<NotificationMessageItem>
          rowKey="notiMsgId"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: (k) => setSelectedKeys(k.map(String)) }}
        />
      </div>

      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <div className={styles.bottomActions}>
        <button type="button" className={styles.btnDanger} disabled={!canWrite} onClick={handleDelete}>Delete</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalItem(null)}>Add New</button>
      </div>

      {modalItem !== undefined && (
        <NotiMessageModal item={modalItem} canWrite={canWrite} onClose={() => setModalItem(undefined)} onSaved={refresh} />
      )}
    </div>
  );
}

function NotiMessageModal({ item, canWrite, onClose, onSaved }: { item: NotificationMessageItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [notiMediaSe, setNotiMediaSe] = useState(item?.notiMediaSe ?? 'EMAIL');
  const [langCd, setLangCd] = useState(item?.langCd ?? 'VN');
  const [notiTtl, setNotiTtl] = useState(item?.notiTtl ?? '');
  const [notiCn, setNotiCn] = useState(item?.notiCn ?? '');
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');

  const handleSave = async () => {
    if (!notiTtl.trim() || !notiCn.trim()) { toast.warning('Enter title and content.'); return; }
    try {
      const req = { notiMediaSe, langCd, notiTtl: notiTtl.trim(), notiCn: notiCn.trim(), useYn };
      if (isCreate) await createNotificationMessage(req);
      else await updateNotificationMessage(item.notiMsgId, req);
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open width={720} centered title={isCreate ? 'Register Notification Message' : 'Edit Notification Message'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={`${styles.formGrid} [--form-cols:2]`}>
        <FormField label="Media" required>
          <Select className="w-full" value={notiMediaSe} onChange={setNotiMediaSe} options={[{ value: 'EMAIL', label: 'EMAIL' }, { value: 'SMS', label: 'SMS' }, { value: 'PUSH', label: 'PUSH' }]} />
        </FormField>
        <FormField label="Language" required>
          <Select className="w-full" value={langCd} onChange={setLangCd} options={[{ value: 'VN', label: 'VN' }, { value: 'EN', label: 'EN' }]} />
        </FormField>
        <FormField label="Use" span="full">
          <Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group>
        </FormField>
        <FormField label="Title" required span="full"><Input value={notiTtl} onChange={(e) => setNotiTtl(e.target.value)} /></FormField>
        <FormField label="Content" required span="full"><Input.TextArea rows={5} value={notiCn} onChange={(e) => setNotiCn(e.target.value)} /></FormField>
      </div>
    </Modal>
  );
}
