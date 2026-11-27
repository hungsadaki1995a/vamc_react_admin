import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import type { ZaloSendMode, ZaloTemplate, ZaloTemplateSearch } from '@/api/system/zalo-api';
import {
  StatusBadge,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysSplit,
  SysTable,
  SysTitleBar,
} from '@/components/common/sys-ui/SysListUi';
import { ALL, SYS_PAGE_SIZE } from '@/config/sys-constants';
import type { YesNo } from '@/config/sys-constants';
import { codeLabel } from '@/lib/i18n/code-label';
import ZaloTemplateDetail from './ZaloTemplateDetail';
import ZaloTemplateModal from './ZaloTemplateModal';
import { ZALO_PROCESS_GROUPS } from './zalo-template-constants';
import { useDownloadZaloTemplatesExcel, useZaloTemplates } from './use-zalo-templates';
import styles from './zalo-template-management.module.scss';

// Zalo Templates (menu A09050400): one template per process step, ZNS or OA. List on the left, Template Details of the
// selected row in the middle and the Zalo phone preview on the right; [New] / [Copy] open the create popup.

interface TemplateFilter {
  procGrpCd: string;
  zaloSndMode: ZaloSendMode | '';
  useYn: YesNo | '';
  keyword: string;
}

const INITIAL_FILTER: TemplateFilter = { procGrpCd: ALL, zaloSndMode: ALL, useYn: ALL, keyword: '' };

function toSearch(filter: TemplateFilter): ZaloTemplateSearch {
  return { procGrpCd: filter.procGrpCd, zaloSndMode: filter.zaloSndMode, useYn: filter.useYn, keyword: filter.keyword.trim() };
}

function buildColumns(t: TFunction): TableColumnsType<ZaloTemplate> {
  return [
    {
      title: t('zalo.templates.columns.status'),
      dataIndex: 'useYn',
      key: 'useYn',
      align: 'center',
      width: 84,
      render: (v: YesNo) => (
        <StatusBadge tone={v === 'Y' ? 'blue' : 'gray'}>{t(v === 'Y' ? 'zalo.common.active' : 'zalo.common.inactive')}</StatusBadge>
      ),
    },
    {
      title: t('zalo.templates.columns.codeName'),
      key: 'tplCd',
      ellipsis: true,
      render: (_: unknown, row) => (
        <span className={styles.codeName} title={`${row.tplCd} · ${row.tplNm}`}>
          <strong>{row.tplCd}</strong>
          <span className={styles.codeNameSub}>{row.tplNm}</span>
        </span>
      ),
    },
    {
      title: t('zalo.templates.columns.channel'),
      dataIndex: 'zaloSndMode',
      key: 'zaloSndMode',
      align: 'center',
      width: 120,
      render: (v: ZaloSendMode) => codeLabel('zalo.channels', v),
    },
  ];
}

/** Create popup: closed, blank New (null) or Copy of a template. */
type ModalState = { source: ZaloTemplate | null } | null;

export default function ZaloTemplateManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { guardDiscard } = useSysDialogs();
  const list = usePagedList<TemplateFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useZaloTemplates(search, list.pageQuery);
  const excel = useDownloadZaloTemplatesExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedCd, setSelectedCd] = useState<string | null>(null);
  const dirty = useRef(false);
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  // The design always shows a template: the picked row, else the first row of the page.
  const selected = rows.find((row) => row.tplCd === selectedCd) ?? rows[0] ?? null;
  const handleDirtyChange = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);

  /** Leaving unsaved edits of the detail panel asks first. */
  const leaveDetail = (proceed: () => void) =>
    guardDiscard(dirty.current, () => {
      dirty.current = false;
      proceed();
    });

  const processOptions = [
    { value: ALL, label: t('zalo.common.all') },
    ...ZALO_PROCESS_GROUPS.map((code) => ({ value: code, label: codeLabel('zalo.processes', code) })),
  ];
  const channelOptions = [
    { value: ALL, label: t('zalo.common.all') },
    { value: 'ZNS' as const, label: t('zalo.channels.ZNS') },
    { value: 'OA' as const, label: t('zalo.channels.OA') },
  ];
  const useOptions = [
    { value: ALL, label: t('zalo.common.all') },
    { value: 'Y' as const, label: t('zalo.common.active') },
    { value: 'N' as const, label: t('zalo.common.inactive') },
  ];

  return (
    <SysPage>
      <SysTitleBar
        title={t('zalo.templates.title')}
        breadcrumb={[t('zalo.breadcrumb.root'), t('zalo.breadcrumb.notification'), t('zalo.templates.title')]}
      />
      <SysFilterPanel>
        <SysFilterItem label={t('zalo.templates.filter.process')}>
          <AppSelect<string> value={list.draft.procGrpCd} options={processOptions} onChange={(procGrpCd) => list.setDraft({ procGrpCd })} />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.templates.filter.channel')}>
          <AppSelect<ZaloSendMode | ''>
            value={list.draft.zaloSndMode}
            options={channelOptions}
            onChange={(zaloSndMode) => list.setDraft({ zaloSndMode })}
          />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.templates.filter.use')}>
          <AppSelect<YesNo | ''> value={list.draft.useYn} options={useOptions} onChange={(useYn) => list.setDraft({ useYn })} />
        </SysFilterItem>
        <SysFilterItem label={t('zalo.common.keyword')}>
          <TextInput
            value={list.draft.keyword}
            placeholder={t('zalo.templates.filter.keywordPlaceholder')}
            allowClear
            maxLength={100}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => leaveDetail(() => list.search())}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={() => leaveDetail(list.reset)} onSearch={() => leaveDetail(() => list.search())} loading={isFetching} />
      <SysSplit
        ratio="384px minmax(0, 1fr)"
        left={
          <div className={styles.pane}>
            <SysSectionHeader
              title={t('zalo.templates.listTitle')}
              total={total}
              actions={<SysExcelButton loading={excel.isPending} onClick={() => excel.mutate(search)} />}
              primaryActions={
                canWrite && (
                  <SysButton look="navy" onClick={() => setModal({ source: null })}>
                    {t('zalo.common.new')}
                  </SysButton>
                )
              }
            />
            <SysTable<ZaloTemplate>
              rowKey="tplCd"
              className={styles.listTable}
              fill
              tableLayout="fixed"
              columns={buildColumns(t)}
              dataSource={rows}
              loading={isFetching}
              selectedRowKey={selected?.tplCd}
              onRowClick={(row) => {
                if (row.tplCd !== selected?.tplCd) leaveDetail(() => setSelectedCd(row.tplCd));
              }}
            />
            <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={(page) => leaveDetail(() => list.setPage(page))} />
          </div>
        }
        right={
          <ZaloTemplateDetail
            key={selected?.tplCd ?? 'none'}
            template={selected}
            canWrite={canWrite}
            onCopy={(template) => setModal({ source: template })}
            onDirtyChange={handleDirtyChange}
          />
        }
      />
      {modal && (
        <ZaloTemplateModal
          source={modal.source}
          onClose={() => setModal(null)}
          onCreated={(tplCd) => leaveDetail(() => setSelectedCd(tplCd))}
        />
      )}
    </SysPage>
  );
}
