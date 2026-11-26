import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import TextInput from '@/components/inputs/TextInput';
import {
  SysFilterItem,
  SysFilterPanel,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
} from '@/components/common/sys-ui/SysListUi';
import { SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_PAGE_SIZE } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import type { PagedListState } from '@/hooks/use-paged-list';
import { ACTIVE_MEMBER_STATUS } from '@/api/member/member-lookup-api';
import type { MemberLookup } from '@/api/member/member-lookup-api';
import type { CollateralAssetItem, NplItem, NplLotItem } from '@/api/npl/npl-api';
import { formatAmount } from '@/utils/system-utils';
import { useCollateralSearch, useMemberSearch, useNplLotSearch, useNplSearch } from './use-trade-application-form';

// Pickers of the manual registration form: active member, registered NPL, NPL LOT, listed collateral (single pick).

interface CodeNameFilter {
  code: string;
  name: string;
}

const INITIAL_FILTER: CodeNameFilter = { code: '', name: '' };

const memberColumns = (t: TFunction): TableColumnsType<MemberLookup> => [
  { title: t('trade.common.memberNo'), dataIndex: 'mbrNo', width: 130, align: 'center' },
  { title: t('trade.common.name'), dataIndex: 'mbrNm', render: (v?: string, r?: MemberLookup) => v || r?.orgnzNm || '-' },
  { title: t('trade.common.type'), dataIndex: 'mbrTypeNm', width: 120, render: (v?: string) => v || '-' },
  { title: t('trade.lookup.sgdnNo'), dataIndex: 'sgdnMbrNo', width: 110, render: (v?: string) => v || '-' },
  { title: t('trade.lookup.phone'), dataIndex: 'telno', width: 130, render: (v?: string) => v || '-' },
];

const nplColumns = (t: TFunction): TableColumnsType<NplItem> => [
  { title: t('trade.common.nplCode'), dataIndex: 'bndCd', width: 130, align: 'center' },
  { title: t('trade.common.nplName'), dataIndex: 'bndNm', ellipsis: true },
  { title: t('trade.common.status'), dataIndex: 'bndSttsCd', width: 80, align: 'center', render: (v?: string) => v || '-' },
  { title: t('trade.common.lot'), dataIndex: 'bndLotNo', width: 110, render: (v?: string) => v || '-' },
  { title: t('trade.common.appraisedValue'), dataIndex: 'bndEvlAmt', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
];

const collateralColumns = (t: TFunction): TableColumnsType<CollateralAssetItem> => [
  { title: t('trade.lookup.collateralCode'), dataIndex: 'cltrAstCd', width: 140, align: 'center' },
  { title: t('trade.lookup.collateralName'), dataIndex: 'cltrAstNm', ellipsis: true },
  { title: t('trade.common.type'), dataIndex: 'cltrAstTypeNm', width: 160, render: (v?: string) => v || '-' },
  { title: t('trade.common.npl'), dataIndex: 'rprsBndCd', width: 120, render: (v?: string) => v || '-' },
];

const lotColumns = (t: TFunction): TableColumnsType<NplLotItem> => [
  { title: t('trade.lookup.lotNo'), dataIndex: 'bndLotNo', width: 140, align: 'center' },
  { title: t('trade.lookup.lotName'), dataIndex: 'bndLotNm', ellipsis: true },
  { title: t('trade.lookup.nplCount'), dataIndex: 'nplCnt', width: 80, align: 'center', render: (v?: number) => v ?? '-' },
];

interface PickerShellProps {
  title: string;
  codeLabel: string;
  nameLabel: string;
  canSelect: boolean;
  onSelect: () => void;
  onClose: () => void;
  list: PagedListState<CodeNameFilter>;
  loading: boolean;
  total: number;
  children: ReactNode;
}

function PickerShell({ title, codeLabel, nameLabel, canSelect, onSelect, onClose, list, loading, total, children }: PickerShellProps) {
  const { t } = useTranslation();
  return (
    <SysFormModal open width={820} title={title} submitText={t('trade.common.select')} submitDisabled={!canSelect} onSubmit={onSelect} onCancel={onClose}>
      <SysFilterPanel columns={2}>
        <SysFilterItem label={codeLabel}>
          <TextInput value={list.draft.code} allowClear onChange={(e) => list.setDraft({ code: e.target.value })} onPressEnter={() => list.search()} />
        </SysFilterItem>
        <SysFilterItem label={nameLabel}>
          <TextInput value={list.draft.name} allowClear onChange={(e) => list.setDraft({ name: e.target.value })} onPressEnter={() => list.search()} />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={loading} />
      <SysSectionHeader total={total} />
      {children}
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
    </SysFormModal>
  );
}

export function MemberSearchPopup({ onSelect, onClose }: { onSelect: (member: MemberLookup) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const list = usePagedList<CodeNameFilter>(INITIAL_FILTER);
  const { data, isFetching } = useMemberSearch(
    { mbrNo: list.applied.code.trim() || undefined, mbrNm: list.applied.name.trim() || undefined, mbrSttsCds: [ACTIVE_MEMBER_STATUS] },
    list.pageQuery,
  );
  const [picked, setPicked] = useState<MemberLookup | null>(null);
  return (
    <PickerShell
      title={t('trade.lookup.memberTitle')}
      codeLabel={t('trade.common.memberNo')}
      nameLabel={t('trade.common.name')}
      canSelect={!!picked}
      onSelect={() => picked && onSelect(picked)}
      onClose={onClose}
      list={list}
      loading={isFetching}
      total={data?.totalElements ?? 0}
    >
      <SysTable<MemberLookup>
        rowKey="mbrNo"
        columns={memberColumns(t)}
        dataSource={data?.content ?? []}
        loading={isFetching}
        scroll={{ y: 320 }}
        onRowClick={setPicked}
        rowSelection={{ type: 'radio', selectedRowKeys: picked ? [picked.mbrNo] : [], onChange: (_k, rows) => setPicked(rows[0] ?? null) }}
      />
    </PickerShell>
  );
}

export type NplTarget = { type: 'npl'; bndCd: string; label: string } | { type: 'lot'; bndLotId: string; label: string };

export function NplSearchPopup({ mode, onSelect, onClose }: { mode: 'npl' | 'lot'; onSelect: (target: NplTarget) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const list = usePagedList<CodeNameFilter>(INITIAL_FILTER);
  const code = list.applied.code.trim() || undefined;
  const name = list.applied.name.trim() || undefined;
  const npls = useNplSearch({ bndCd: code, bndNm: name }, list.pageQuery, mode === 'npl');
  const lots = useNplLotSearch({ bndLotNo: code, bndLotNm: name }, list.pageQuery, mode === 'lot');
  const [pickedNpl, setPickedNpl] = useState<NplItem | null>(null);
  const [pickedLot, setPickedLot] = useState<NplLotItem | null>(null);
  const isNpl = mode === 'npl';

  const select = () => {
    if (isNpl && pickedNpl) onSelect({ type: 'npl', bndCd: pickedNpl.bndCd, label: `${pickedNpl.bndCd} · ${pickedNpl.bndNm}` });
    if (!isNpl && pickedLot) onSelect({ type: 'lot', bndLotId: pickedLot.bndLotId, label: `${pickedLot.bndLotNo} · ${pickedLot.bndLotNm}` });
  };

  return (
    <PickerShell
      title={isNpl ? t('trade.lookup.nplTitle') : t('trade.lookup.lotTitle')}
      codeLabel={isNpl ? t('trade.common.nplCode') : t('trade.lookup.lotNo')}
      nameLabel={isNpl ? t('trade.common.nplName') : t('trade.lookup.lotName')}
      canSelect={isNpl ? !!pickedNpl : !!pickedLot}
      onSelect={select}
      onClose={onClose}
      list={list}
      loading={isNpl ? npls.isFetching : lots.isFetching}
      total={(isNpl ? npls.data?.totalElements : lots.data?.totalElements) ?? 0}
    >
      {isNpl ? (
        <SysTable<NplItem>
          rowKey="bndCd"
          columns={nplColumns(t)}
          dataSource={npls.data?.content ?? []}
          loading={npls.isFetching}
          scroll={{ y: 320 }}
          onRowClick={setPickedNpl}
          rowSelection={{ type: 'radio', selectedRowKeys: pickedNpl ? [pickedNpl.bndCd] : [], onChange: (_k, rows) => setPickedNpl(rows[0] ?? null) }}
        />
      ) : (
        <SysTable<NplLotItem>
          rowKey="bndLotId"
          columns={lotColumns(t)}
          dataSource={lots.data?.content ?? []}
          loading={lots.isFetching}
          scroll={{ y: 320 }}
          onRowClick={setPickedLot}
          rowSelection={{ type: 'radio', selectedRowKeys: pickedLot ? [pickedLot.bndLotId] : [], onChange: (_k, rows) => setPickedLot(rows[0] ?? null) }}
        />
      )}
    </PickerShell>
  );
}

export interface PickedCollateral {
  cltrAstCd: string;
  cltrAstNm: string;
}

/** Listed collateral (CLTR_AST_INFO, exposed on the market) that a consulting application is about. */
export function CollateralSearchPopup({ onSelect, onClose }: { onSelect: (collateral: PickedCollateral) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const list = usePagedList<CodeNameFilter>(INITIAL_FILTER);
  const { data, isFetching } = useCollateralSearch(
    { cltrAstCd: list.applied.code.trim() || undefined, cltrAstNm: list.applied.name.trim() || undefined, expsrYn: 'Y' },
    list.pageQuery,
  );
  const [picked, setPicked] = useState<CollateralAssetItem | null>(null);
  return (
    <PickerShell
      title={t('trade.lookup.collateralTitle')}
      codeLabel={t('trade.lookup.collateralCode')}
      nameLabel={t('trade.lookup.collateralName')}
      canSelect={!!picked}
      onSelect={() => picked && onSelect({ cltrAstCd: picked.cltrAstCd, cltrAstNm: picked.cltrAstNm })}
      onClose={onClose}
      list={list}
      loading={isFetching}
      total={data?.totalElements ?? 0}
    >
      <SysTable<CollateralAssetItem>
        rowKey="cltrAstCd"
        columns={collateralColumns(t)}
        dataSource={data?.content ?? []}
        loading={isFetching}
        scroll={{ y: 320 }}
        onRowClick={setPicked}
        rowSelection={{ type: 'radio', selectedRowKeys: picked ? [picked.cltrAstCd] : [], onChange: (_k, rows) => setPicked(rows[0] ?? null) }}
      />
    </PickerShell>
  );
}
