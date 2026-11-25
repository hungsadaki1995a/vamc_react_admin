import { useMemo, useState } from 'react';
import { Upload } from 'antd';
import type { TableColumnsType } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { LabelKey, LabelListItem, LabelSearch } from '@/api/system/label-management-api';
import { SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { SYS_DIALOG_LABELS } from '@/features/system/_shared/sys-messages';
import {
  DateTimeText,
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
} from '@/features/system/_shared/SysListUi';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import LabelModal from './LabelModal';
import LabelTextPanel from './LabelTextPanel';
import { hasTextChanges, LABEL_MESSAGES, labelRowId, sameLabel, storedTexts } from './label-utils';
import {
  useDownloadLabels,
  useLabelDetail,
  useLabelLanguages,
  useLabels,
  useReloadLabelCache,
  useUploadLabelsExcel,
} from './use-labels';
import styles from './label-management.module.scss';

interface LabelFilter {
  /** Type: '' = All, W = Web, A = Admin. */
  sysSeCd: string;
  lblKey: string;
  keyword: string;
  missingOnly: boolean;
}

const INITIAL_FILTER: LabelFilter = {
  sysSeCd: '',
  lblKey: '',
  keyword: '',
  missingOnly: false,
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'W', label: 'Web' },
  { value: 'A', label: 'Admin' },
];

/** Edit popup target: `null` = closed, `'new'` = register mode. */
type EditTarget = LabelListItem | 'new' | null;

const toSearch = ({ sysSeCd, lblKey, keyword, missingOnly }: LabelFilter): LabelSearch => ({
  sysSeCd,
  lblKey: lblKey.trim(),
  keyword: keyword.trim(),
  missingOnly,
});

const toKey = ({ scrnId, lblSeCd, lblCd }: LabelKey): LabelKey => ({
  scrnId,
  lblSeCd,
  lblCd,
});

/** i18n Label Management - List (VPA09040301, menu A09040300). */
export default function LabelManagement() {
  const { toast, dialog } = useNotify();
  const { confirm, guardDiscard } = useSysDialogs();
  const { canWrite } = useMenuPermission();

  const list = usePagedList<LabelFilter>(INITIAL_FILTER);
  const search = useMemo(() => toSearch(list.applied), [list.applied]);
  const { data, isFetching } = useLabels(search, list.pageQuery);
  const { data: languages = [] } = useLabelLanguages();

  const [selected, setSelected] = useState<LabelKey | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const { data: detail, isFetching: detailLoading } = useLabelDetail(selected);

  const download = useDownloadLabels();
  const upload = useUploadLabelsExcel();
  const reloadCache = useReloadLabelCache();

  const dirty = selected !== null && hasTextChanges(drafts, storedTexts(detail));

  /** C04: runs `action` (dropping unsaved texts) once the user agrees. */
  const guarded = (action: () => void) =>
    guardDiscard(dirty, () => {
      setDrafts({});
      action();
    });

  /** Selects after register / edit / delete; unsaved texts survive a description edit of the same label. */
  const selectLabel = (key: LabelKey | null) => {
    if (sameLabel(selected, key)) return;
    setSelected(key);
    setDrafts({});
  };

  const selectRow = (row: LabelListItem) => {
    if (sameLabel(selected, row)) return;
    guarded(() => setSelected(toKey(row)));
  };

  const openEdit = (row: LabelListItem) => {
    if (sameLabel(selected, row)) setEditTarget(row);
    else
      guarded(() => {
        setSelected(toKey(row));
        setEditTarget(row);
      });
  };

  const refreshCache = () =>
    confirm({
      content: LABEL_MESSAGES.confirmRefreshCache,
      okText: SYS_DIALOG_LABELS.apply,
      onOk: async () => {
        try {
          await reloadCache.run();
          toast.success(LABEL_MESSAGES.cacheRefreshed);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });

  const uploadExcel = async (file: File) => {
    try {
      const response = await upload.run(file);
      const result = response.data;
      if (result && !result.success) {
        dialog.error({
          content: (
            <div className={styles.uploadErrors}>
              <p>{LABEL_MESSAGES.uploadFailed}</p>
              <ul>
                {(result.errors ?? []).slice(0, 20).map((e) => (
                  <li key={`${e.row}-${e.col ?? ''}-${e.message}`}>
                    Row {e.row}
                    {e.header ? ` (${e.header})` : ''}: {e.message}
                  </li>
                ))}
              </ul>
              {(result.errors?.length ?? 0) > 20 && <p>… {(result.errors?.length ?? 0) - 20} more</p>}
            </div>
          ),
        });
        return;
      }
      toast.success(LABEL_MESSAGES.uploadDone(result?.totalRows ?? 0));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: TableColumnsType<LabelListItem> = [
    {
      title: 'Type',
      dataIndex: 'sysSeCd',
      sorter: true,
      width: 68,
      // No Type = shared by both apps or not classified (legacy labels).
      render: (value?: string | null) => (value === 'W' ? 'Web' : value === 'A' ? 'Admin' : '-'),
    },
    {
      title: 'Scope',
      dataIndex: 'scopeCd',
      sorter: true,
      width: 76,
      render: (value: string) => (value === 'C' ? 'Common' : 'Business'),
    },
    {
      title: 'Label Key',
      dataIndex: 'lblKey',
      sorter: true,
      ellipsis: true,
      render: (value: string, row) => (
        <button
          type="button"
          className={styles.keyLink}
          title={value}
          onClick={(e) => {
            e.stopPropagation();
            openEdit(row);
          }}
        >
          {value}
        </button>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'lblExpln',
      width: 100,
      ellipsis: true,
      sorter: true,
    },
    {
      title: 'Translation',
      dataIndex: 'missingCnt',
      sorter: true,
      width: 110,
      render: (value: number) => (value > 0 ? <span className={styles.missing}>Missing {value}</span> : 'Complete'),
    },
    {
      title: 'Modified Date',
      dataIndex: 'mdfcnDt',
      sorter: true,
      width: 132,
      render: (value?: string) => <DateTimeText value={value} />,
    },
    {
      title: 'Modified By',
      dataIndex: 'mdfcnBy',
      width: 110,
      ellipsis: true,
      sorter: true,
    },
  ];

  const total = data?.totalElements ?? 0;
  const selectedId = selected ? labelRowId(selected) : null;

  return (
    <SysPage fill>
      <SysTitleBar
        title="i18n Label Management"
        breadcrumb={['System Operation Management', 'System Management', 'i18n Label Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Type">
          <AppSelect
            options={TYPE_FILTER_OPTIONS}
            value={list.draft.sysSeCd}
            onChange={(value) => list.setDraft({ sysSeCd: String(value ?? '') })}
          />
        </SysFilterItem>
        <SysFilterItem label="Label Key">
          <TextInput
            value={list.draft.lblKey}
            maxLength={100}
            allowClear
            onChange={(e) => list.setDraft({ lblKey: e.target.value })}
            onPressEnter={() => guarded(() => list.search())}
          />
        </SysFilterItem>
        <SysFilterItem label="Text">
          <TextInput
            value={list.draft.keyword}
            maxLength={100}
            allowClear
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => guarded(() => list.search())}
          />
        </SysFilterItem>
        <SysFilterItem label="Translation Status">
          <AppCheckbox
            className={styles.missingCheck}
            checked={list.draft.missingOnly}
            onChange={(e) => list.setDraft({ missingOnly: e.target.checked })}
          >
            Show missing translations only
          </AppCheckbox>
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions
        onReset={() => guarded(list.reset)}
        onSearch={() => guarded(() => list.search())}
        loading={isFetching}
      />

      <SysSplit
        ratio="7fr 4fr"
        left={
          <>
            <SysSectionHeader
              // The design titles the list with the Type filter value ("All | Total n").
              title={TYPE_FILTER_OPTIONS.find((o) => o.value === list.applied.sysSeCd)?.label ?? 'All'}
              total={total}
              actions={
                <>
                  {canWrite && (
                    <>
                      <SysButton loading={reloadCache.isPending} onClick={refreshCache}>
                        Refresh Cache
                      </SysButton>
                      <span className={styles.actionDivider} />
                      <Upload
                        accept=".xlsx"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          void uploadExcel(file);
                          return false;
                        }}
                      >
                        <SysButton icon={<UploadOutlined />} loading={upload.isPending}>
                          Excel Upload
                        </SysButton>
                      </Upload>
                    </>
                  )}
                  <SysExcelButton loading={download.isPending} onClick={() => download.mutate(search)} />
                </>
              }
              primaryActions={
                canWrite && (
                  <SysButton look="navy" onClick={() => setEditTarget('new')}>
                    New
                  </SysButton>
                )
              }
            />
            <div className={styles.listBody}>
              <SysTable<LabelListItem>
                fill
                tableLayout="fixed"
                rowKey={labelRowId}
                columns={columns}
                dataSource={data?.content}
                loading={isFetching && !data}
                onRowClick={selectRow}
                selectedRowKey={selectedId}
                sort={list.sort}
                onSortChange={(sort) => guarded(() => list.setSort(sort))}
              />
              <SysPager
                page={list.page}
                pageSize={SYS_PAGE_SIZE}
                total={total}
                onChange={(page) => guarded(() => list.setPage(page))}
              />
            </div>
          </>
        }
        right={
          <LabelTextPanel
            key={selectedId ?? 'none'}
            selected={selected}
            detail={detail}
            loading={detailLoading && !detail}
            languages={languages}
            drafts={drafts}
            onDraftChange={(langCd, text) => setDrafts((prev) => ({ ...prev, [langCd]: text }))}
            onSaved={() => setDrafts({})}
            canWrite={canWrite}
          />
        }
      />

      {editTarget && (
        <LabelModal
          key={editTarget === 'new' ? 'new' : labelRowId(editTarget)}
          label={editTarget === 'new' ? undefined : editTarget}
          canWrite={canWrite}
          onClose={() => setEditTarget(null)}
          onSaved={(key) => {
            setEditTarget(null);
            selectLabel(key);
          }}
          onDeleted={(key) => {
            setEditTarget(null);
            if (sameLabel(selected, key)) selectLabel(null);
          }}
        />
      )}
    </SysPage>
  );
}
