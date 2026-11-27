import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import AppSwitch from '@/components/inputs/AppSwitch';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import { usePagedList } from '@/hooks/use-paged-list';
import type { ZaloSendMode, ZaloTemplate, ZaloTemplateSearch } from '@/api/system/zalo-api';
import {
  DateTimeText,
  StatusBadge,
  SysButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/components/common/sys-ui/SysListUi';
import { ALL, SYS_PAGE_SIZE } from '@/config/sys-constants';
import type { YesNo } from '@/config/sys-constants';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage } from '@/utils/system-utils';
import ZaloTemplateModal from './ZaloTemplateModal';
import { ZALO_PROCESS_GROUPS } from './zalo-template-constants';
import { useChangeZaloTemplateUse, useZaloTemplates } from './use-zalo-templates';
import styles from './zalo-template-management.module.scss';

// Zalo Templates (menu A09050400): one template per process step, ZNS or OA, with quick on / off.

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

interface UseColumn {
  canWrite: boolean;
  /** Template code whose switch is saving. */
  savingTplCd?: string;
  onToggle: (template: ZaloTemplate, on: boolean) => void;
}

function buildColumns(t: TFunction, { canWrite, savingTplCd, onToggle }: UseColumn): TableColumnsType<ZaloTemplate> {
  return [
    {
      title: t('zalo.templates.columns.use'),
      dataIndex: 'useYn',
      key: 'useYn',
      align: 'center',
      width: 100,
      render: (v: YesNo, row) =>
        canWrite ? (
          // The switch must not open the edit popup of the row.
          <span onClick={(e) => e.stopPropagation()}>
            <AppSwitch
              size="small"
              checked={v === 'Y'}
              loading={savingTplCd === row.tplCd}
              aria-label={`${t('zalo.templates.columns.use')} ${row.tplCd}`}
              onChange={(on) => onToggle(row, on)}
            />
          </span>
        ) : (
          <StatusBadge tone={v === 'Y' ? 'blue' : 'gray'}>{t(v === 'Y' ? 'zalo.common.active' : 'zalo.common.inactive')}</StatusBadge>
        ),
    },
    { title: t('zalo.templates.columns.tplCd'), dataIndex: 'tplCd', key: 'tplCd', width: 200 },
    {
      title: t('zalo.templates.columns.process'),
      dataIndex: 'procGrpCd',
      key: 'procGrpCd',
      width: 160,
      render: (v: string) => codeLabel('zalo.processes', v),
    },
    { title: t('zalo.templates.columns.tplNm'), dataIndex: 'tplNm', key: 'tplNm', ellipsis: true },
    {
      title: t('zalo.templates.columns.channel'),
      dataIndex: 'zaloSndMode',
      key: 'zaloSndMode',
      align: 'center',
      width: 120,
      render: (v: ZaloSendMode) => codeLabel('zalo.channels', v),
    },
    {
      title: t('zalo.templates.columns.znsTplId'),
      dataIndex: 'znsTplId',
      key: 'znsTplId',
      width: 150,
      render: (v?: string) => v || '-',
    },
    {
      title: t('zalo.templates.columns.mdfcnDt'),
      key: 'mdfcnDt',
      width: 150,
      render: (_: unknown, row) => <DateTimeText value={row.mdfcnDt ?? row.crtDt} />,
    },
  ];
}

/** Popup state: closed, register (null) or edit (template code). */
type ModalState = { tplCd: string | null } | null;

export default function ZaloTemplateManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const list = usePagedList<TemplateFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useZaloTemplates(search, list.pageQuery);
  const changeUse = useChangeZaloTemplateUse();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  const handleToggle = async (template: ZaloTemplate, on: boolean) => {
    try {
      await changeUse.mutateAsync({ tplCd: template.tplCd, useYn: on ? 'Y' : 'N' });
      toast.success(t('messages.zalo.useChanged'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

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

  const columns = buildColumns(t, {
    canWrite,
    savingTplCd: changeUse.isPending ? changeUse.variables?.tplCd : undefined,
    onToggle: (template, on) => void handleToggle(template, on),
  });

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
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        title={t('zalo.common.searchResults')}
        total={total}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModal({ tplCd: null })}>
              {t('zalo.common.new')}
            </SysButton>
          )
        }
      />
      <SysTable<ZaloTemplate>
        rowKey="tplCd"
        className={styles.listTable}
        fill
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(row) => setModal({ tplCd: row.tplCd })}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && (
        <ZaloTemplateModal key={modal.tplCd ?? 'new'} tplCd={modal.tplCd} canWrite={canWrite} onClose={() => setModal(null)} />
      )}
    </SysPage>
  );
}
