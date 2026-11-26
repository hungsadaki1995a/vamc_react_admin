import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionButton from '@/components/common/actions/ActionButton';
import FileUploadBox from '@/components/common/file-upload/FileUploadBox';
import Popup from '@/components/common/popup/Popup';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import DataTable from '@/components/common/table/DataTable';
import { useCommonCodes } from '@/hooks/use-common-codes';
import { useNotify } from '@/hooks/use-notify';
import { RECEIPT_OFFICER_STEP } from '@/api/common/approval-api';
import { applicationNo, tradeProcessCode } from '@/api/trade/trade-api';
import type {
  ConsultingTargetCollateral,
  SaveTradeApplicationRequest,
  TradeAppKind,
  TradeApplicationDetail,
  TradeFile,
} from '@/api/trade/trade-api';
import type { TradeFileItem } from '@/api/trade/trade-file-api';
import { EmployeePickField } from '@/features/approval/_shared/ApprovalParts';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage, formatAmount } from '@/utils/system-utils';
import TargetCollateralPopup from './TargetCollateralPopup';
import { CollateralSearchPopup, MemberSearchPopup, NplSearchPopup } from './TradeLookupPopups';
import type { NplTarget, PickedCollateral } from './TradeLookupPopups';
import { useMemberLookup, useSaveTradeApplication, useUploadFormScans } from './use-trade-application-form';
import styles from './trade-application-popup.module.scss';

// Manual registration (Add New) and edit of an application (VPA050101P01 / 050102P01 / 050103P01).
// Flow, manual steps 3–7: [New] → upload the scanned request form and documents → check / complete the entries →
// register → assign the officer in charge (required, as at web step 7) — so a manual application is created
// received (PRCS) with its officer. Member data is picked, never typed (decision 2026-11-26 §6.2). Only NPLs / LOTs
// already on the system can be chosen (backend nplNotFound); an NPL not yet registered waits for VAMC answer N2.
// Consulting: a listed collateral (`cltrAstCd`) and, on registration only, up to 20 collaterals typed from the paper
// form (`targetCollaterals`, like the member's web form).
// Edit (before approval): contract kind, consulting request / collateral, currency, price, scans — member and NPL stay
// fixed. Only the changed fields are sent (the server keeps a field left out), so nothing can be erased by omission.

type FieldKey = 'member' | 'target' | 'cnsltDmndSeCd' | 'cnsltDmndPrpsCn' | 'officer';

const SCAN_ACCEPT = '.pdf,.jpg,.jpeg,.png';
const MAX_TARGET_COLLATERALS = 20;

export interface TradeApplicationFormProps {
  kind: TradeAppKind;
  /** null = Add New. */
  detail: TradeApplicationDetail | null;
  onClose: () => void;
  /** After a save: the application id (new or edited). */
  onSaved: (srvcAplyId: string) => void;
}

export default function TradeApplicationForm({ kind, detail, onClose, onSaved }: TradeApplicationFormProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const isEdit = detail !== null;
  const consulting = kind === 'consulting';
  const consultingCodes = useCommonCodes(consulting ? 'CNSLT_DMND_SE_CD' : null);
  const save = useSaveTradeApplication();
  const upload = useUploadFormScans();

  const [mbrNo, setMbrNo] = useState<string | null>(detail?.mbrNo ?? null);
  const { data: member } = useMemberLookup(isEdit ? null : mbrNo);
  const [targetMode, setTargetMode] = useState<'npl' | 'lot'>(detail?.bndLotYn === 'Y' ? 'lot' : 'npl');
  const [target, setTarget] = useState<NplTarget | null>(null);
  const [ctrtKndCd, setCtrtKndCd] = useState<'MDT' | 'BASE_ANX'>((detail?.ctrtKndCd as 'MDT' | 'BASE_ANX' | undefined) ?? 'MDT');
  const [crncCd, setCrncCd] = useState<'VND' | 'USD'>((detail?.crncCd as 'VND' | 'USD' | undefined) ?? 'VND');
  const [price, setPrice] = useState<number | null>(detail?.prpDsplPrc ?? null);
  const [cnsltDmndSeCd, setCnsltDmndSeCd] = useState(detail?.cnsltDmndSeCd ?? '');
  const [cnsltDmndPrpsCn, setCnsltDmndPrpsCn] = useState(detail?.cnsltDmndPrpsCn ?? '');
  const [scanFileId, setScanFileId] = useState<string | undefined>(detail?.esntlDcmntScnFile);
  const [files, setFiles] = useState<(TradeFile | TradeFileItem)[]>(detail?.files ?? []);
  const [collateral, setCollateral] = useState<PickedCollateral | null>(
    detail?.cltrAstCd ? { cltrAstCd: detail.cltrAstCd, cltrAstNm: detail.collaterals?.find((c) => c.cltrAstCd === detail.cltrAstCd)?.cltrAstNm ?? '' } : null,
  );
  const [targetCollaterals, setTargetCollaterals] = useState<ConsultingTargetCollateral[]>([]);
  const [officer, setOfficer] = useState('');
  const [picker, setPicker] = useState<'member' | 'npl' | 'lot' | 'collateral' | 'targetCollateral' | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const clearError = (key: FieldKey) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  const validate = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!isEdit) {
      if (!mbrNo) next.member = t('messages.trade.memberRequired');
      if (!consulting && !target) next.target = t('messages.trade.nplRequired');
      if (!officer) next.officer = t('messages.trade.officerRequired');
    }
    if (consulting && !cnsltDmndSeCd) next.cnsltDmndSeCd = t('messages.trade.consultingTypeRequired');
    if (consulting && !cnsltDmndPrpsCn.trim()) next.cnsltDmndPrpsCn = t('messages.trade.consultingRequestRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpload = async (selected: File[]) => {
    try {
      const group = await upload.mutateAsync({ kind, files: selected, fileUnqId: scanFileId });
      setScanFileId(group.fileUnqId);
      setFiles(group.files);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  /** Edit body: the fields that differ from the stored application (the server keeps the others). */
  const changedFields = (stored: TradeApplicationDetail): SaveTradeApplicationRequest => {
    const body: SaveTradeApplicationRequest = {};
    if (kind === 'sale' && ctrtKndCd !== (stored.ctrtKndCd ?? 'MDT')) {
      body.ctrtKndCd = ctrtKndCd;
      if (ctrtKndCd === 'BASE_ANX') body.baseCtrtCd = stored.baseCtrtCd;
    }
    if (consulting) {
      if (cnsltDmndSeCd !== (stored.cnsltDmndSeCd ?? '')) body.cnsltDmndSeCd = cnsltDmndSeCd;
      if (cnsltDmndPrpsCn.trim() !== (stored.cnsltDmndPrpsCn ?? '')) body.cnsltDmndPrpsCn = cnsltDmndPrpsCn.trim();
      if (collateral && collateral.cltrAstCd !== stored.cltrAstCd) body.cltrAstCd = collateral.cltrAstCd;
    } else {
      if (crncCd !== (stored.crncCd ?? 'VND')) body.crncCd = crncCd;
      if (price !== null && price !== stored.prpDsplPrc) body.prpDsplPrc = price;
    }
    if (scanFileId && scanFileId !== stored.esntlDcmntScnFile) body.scanFileId = scanFileId;
    return body;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const body: SaveTradeApplicationRequest = isEdit
      ? changedFields(detail)
      : {
          mbrNo: mbrNo ?? undefined,
          ...(target?.type === 'npl' ? { bndCd: target.bndCd } : {}),
          ...(target?.type === 'lot' ? { bndLotId: target.bndLotId } : {}),
          aplySttsCd: 'PRCS' as const,
          tkcgEmpNo: officer,
          ...(kind === 'sale' ? { ctrtKndCd } : {}),
          ...(consulting
            ? {
                cnsltDmndSeCd,
                cnsltDmndPrpsCn: cnsltDmndPrpsCn.trim(),
                cltrAstCd: collateral?.cltrAstCd,
                targetCollaterals: targetCollaterals.length ? targetCollaterals : undefined,
              }
            : { crncCd, prpDsplPrc: price ?? undefined }),
          scanFileId,
        };
    if (isEdit && Object.keys(body).length === 0) {
      toast.info(t('messages.trade.noChanges'));
      return;
    }
    try {
      const response = await save.mutateAsync({ kind, id: detail?.srvcAplyId ?? null, body });
      toast.success(response.message || t(isEdit ? 'messages.trade.saved' : 'messages.trade.registered'));
      onSaved(response.data?.srvcAplyId ?? detail?.srvcAplyId ?? '');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const targetLabel = isEdit
    ? detail?.bndLotYn === 'Y'
      ? detail.bndLotNm || detail.bndLotId
      : (detail?.npls ?? []).map((n) => n.bndCd || n.cnsltTrgtNplId).join(', ')
    : target?.label;

  return (
    <Popup
      open
      width={880}
      title={
        isEdit
          ? t('trade.application.form.editTitle', { kind: t(`trade.kindServices.${kind}`), no: applicationNo(detail) })
          : t('trade.application.form.newTitle', { kind: t(`trade.kindServices.${kind}`) })
      }
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() => void handleSave()}
      confirmText={isEdit ? t('trade.common.save') : t('trade.common.register')}
      confirmLoading={save.isPending}
      confirmDisabled={upload.isPending}
    >
      {!isEdit && <div className={styles.notice}>{t('messages.trade.manualHint')}</div>}

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('trade.application.form.applicantSection')}</div>
        {!isEdit && (
          <div className={styles.pickRow}>
            <TextInput readOnly placeholder={t('trade.application.form.memberPlaceholder')} value={mbrNo ?? ''} />
            <ActionButton action="search" intent="quaternary" appearance="outlined" onClick={() => setPicker('member')}>
              {t('trade.application.form.memberSearch')}
            </ActionButton>
          </div>
        )}
        {errors.member && <div className={styles.error}>{errors.member}</div>}
        {(isEdit || member) && (
          <div className={`${styles.grid} ${styles.gridSpaced}`}>
            <div className={styles.cellLabel}>{t('trade.common.memberNo')}</div>
            <div className={styles.cellValue}>{isEdit ? detail.mbrNo : member?.mbrNo}</div>
            <div className={styles.cellLabel}>{t('trade.common.name')}</div>
            <div className={styles.cellValue}>{isEdit ? detail.mbrNm : member?.mbrNm || member?.orgnzNm || '-'}</div>
            {!isEdit && (
              <>
                <div className={styles.cellLabel}>{t('trade.common.type')}</div>
                <div className={styles.cellValue}>{member?.mbrTypeNm || member?.mbrTypeCd || '-'}</div>
                <div className={styles.cellLabel}>{t('trade.application.form.contact')}</div>
                <div className={styles.cellValue}>{[member?.telno, member?.emlAddr].filter(Boolean).join(' · ') || '-'}</div>
              </>
            )}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{consulting ? t('trade.application.form.consultingTargetNpl') : t('trade.common.nplLot')}</div>
        {isEdit ? (
          <div className={styles.notice}>{targetLabel || '-'}</div>
        ) : (
          <>
            <AppRadio.Group
              value={targetMode}
              onChange={(e) => {
                setTargetMode(e.target.value as 'npl' | 'lot');
                setTarget(null);
              }}
              options={[
                { label: t('trade.application.form.singleNpl'), value: 'npl' },
                ...(consulting ? [] : [{ label: t('trade.common.lot'), value: 'lot' }]),
              ]}
            />
            <div className={styles.pickRow}>
              <TextInput readOnly placeholder={targetMode === 'lot' ? t('trade.application.form.lotPlaceholder') : t('trade.application.form.nplPlaceholder')} value={target?.label ?? ''} />
              <ActionButton action="search" intent="quaternary" appearance="outlined" onClick={() => setPicker(targetMode)}>
                {targetMode === 'lot' ? t('trade.application.form.lotSearch') : t('trade.application.form.nplSearch')}
              </ActionButton>
              {target && (
                <ActionButton intent="text" onClick={() => setTarget(null)}>
                  {t('trade.common.clear')}
                </ActionButton>
              )}
            </div>
            {errors.target && <div className={styles.error}>{errors.target}</div>}
            {/* N2 (open with VAMC): no admin API registers an NPL from a paper application. */}
            <div className={styles.notice}>{t('messages.trade.nplNotRegisteredHint')}</div>
          </>
        )}
      </section>

      {consulting && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('trade.application.form.consultingTargetCollateral')}</div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{t('trade.application.form.listedCollateral')}</span>
            <div className={styles.pickRow}>
              <TextInput
                readOnly
                placeholder={t('trade.application.form.collateralPlaceholder')}
                value={collateral ? [collateral.cltrAstCd, collateral.cltrAstNm].filter(Boolean).join(' · ') : ''}
              />
              <ActionButton action="search" intent="quaternary" appearance="outlined" onClick={() => setPicker('collateral')}>
                {t('trade.application.form.collateralSearch')}
              </ActionButton>
              {/* The edit keeps a field left out, so a stored collateral can be changed but not removed. */}
              {collateral && !isEdit && (
                <ActionButton intent="text" onClick={() => setCollateral(null)}>
                  {t('trade.common.clear')}
                </ActionButton>
              )}
            </div>
          </div>
          {isEdit ? (
            (detail.collaterals?.length ?? 0) > 0 && (
              <DataTable
                rowKey={(r) => r.cltrAstCd || `${r.cltrCtrtNo}-${r.astChrcCn}`}
                columns={[
                  { title: t('trade.common.collateral'), dataIndex: 'cltrAstNm', render: (v?: string, r?: { cltrAstCd?: string }) => v || r?.cltrAstCd || '-' },
                  { title: t('trade.common.contractNo'), dataIndex: 'cltrCtrtNo', width: 170, render: (v?: string) => v || '-' },
                  { title: t('trade.common.characteristics'), dataIndex: 'astChrcCn', render: (v?: string) => v || '-' },
                ]}
                dataSource={detail.collaterals}
                pagination={false}
              />
            )
          ) : (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>
                {t('trade.application.form.paperCollaterals', { n: targetCollaterals.length, max: MAX_TARGET_COLLATERALS })}
              </span>
              <div className={styles.notice}>{t('messages.trade.collateralHint')}</div>
              {targetCollaterals.length > 0 && (
                <DataTable<ConsultingTargetCollateral>
                  rowKey={(r) => `${r.cltrCtrtNo}-${r.ctrtDt}-${r.astChrcCn}`}
                  columns={[
                    {
                      title: t('trade.application.form.category'),
                      dataIndex: 'cltrAstLclsfCd',
                      width: 140,
                      render: (v: ConsultingTargetCollateral['cltrAstLclsfCd']) => codeLabel('trade.collateralCategories', v),
                    },
                    { title: t('trade.common.contractNo'), dataIndex: 'cltrCtrtNo', width: 170 },
                    { title: t('trade.common.contractDate'), dataIndex: 'ctrtDt', width: 120, align: 'center', render: (v: string) => v.split('-').reverse().join('/') },
                    { title: t('trade.common.characteristics'), dataIndex: 'astChrcCn', ellipsis: true },
                    {
                      title: '',
                      key: 'remove',
                      width: 90,
                      align: 'center',
                      render: (_v, _r, index) => (
                        <ActionButton size="small" intent="text" onClick={() => setTargetCollaterals((prev) => prev.filter((_, i) => i !== index))}>
                          {t('trade.common.remove')}
                        </ActionButton>
                      ),
                    },
                  ]}
                  dataSource={targetCollaterals}
                  pagination={false}
                />
              )}
              <div className={styles.checkActions}>
                <ActionButton
                  intent="quaternary"
                  appearance="outlined"
                  disabled={targetCollaterals.length >= MAX_TARGET_COLLATERALS}
                  onClick={() => setPicker('targetCollateral')}
                >
                  {t('trade.application.form.addCollateral')}
                </ActionButton>
              </div>
            </div>
          )}
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('trade.application.form.requestSection')}</div>
        {kind === 'sale' && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{t('trade.common.contractKind')}</span>
            {/* BASE_ANX needs a framework agreement, which cannot be created yet (Q3 / N1): locked. */}
            <AppRadio.Group
              value={ctrtKndCd}
              onChange={(e) => setCtrtKndCd(e.target.value as 'MDT' | 'BASE_ANX')}
              options={[
                { label: t('trade.application.form.brokerageContract'), value: 'MDT' },
                { label: t('trade.application.form.baseContractAnnex'), value: 'BASE_ANX', disabled: detail?.ctrtKndCd !== 'BASE_ANX' },
              ]}
            />
          </div>
        )}
        {consulting ? (
          <>
            <div className={styles.field}>
              <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.common.consultingType')}</span>
              <AppSelect
                className={styles.control}
                placeholder={t('trade.application.form.consultingTypePlaceholder')}
                value={cnsltDmndSeCd || undefined}
                options={consultingCodes}
                onChange={(v) => {
                  setCnsltDmndSeCd(String(v ?? ''));
                  clearError('cnsltDmndSeCd');
                }}
              />
              {errors.cnsltDmndSeCd && <div className={styles.error}>{errors.cnsltDmndSeCd}</div>}
            </div>
            <div className={styles.field}>
              <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.application.form.consultingRequest')}</span>
              <TextArea
                rows={4}
                maxLength={4000}
                showCount
                value={cnsltDmndPrpsCn}
                onChange={(e) => {
                  setCnsltDmndPrpsCn(e.target.value);
                  clearError('cnsltDmndPrpsCn');
                }}
              />
              {errors.cnsltDmndPrpsCn && <div className={styles.error}>{errors.cnsltDmndPrpsCn}</div>}
            </div>
          </>
        ) : (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{kind === 'sale' ? t('trade.common.desiredSalePrice') : t('trade.common.proposedPurchasePrice')}</span>
            <div className={styles.pickRow}>
              <AppSelect
                className={styles.currency}
                value={crncCd}
                options={[
                  { value: 'VND', label: 'VND' },
                  { value: 'USD', label: 'USD' },
                ]}
                onChange={(v) => setCrncCd((v as 'VND' | 'USD') ?? 'VND')}
              />
              <Spinbox
                className={styles.control}
                min={0}
                value={price}
                formatter={(v) => (v === undefined || v === null ? '' : formatAmount(Number(v)))}
                parser={(v) => Number((v ?? '').replace(/,/g, ''))}
                onChange={(v) => setPrice(v ?? null)}
              />
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('trade.application.form.scansSection')}</div>
        {files.length > 0 && (
          <ul className={styles.files}>
            {files.map((file) => (
              <li key={`${file.fileUnqId}-${file.fileSeq}`} className={styles.fileItem}>
                {file.fileNm}
              </li>
            ))}
          </ul>
        )}
        <FileUploadBox
          accept={SCAN_ACCEPT}
          multiple
          disabled={upload.isPending}
          title={t('trade.application.form.scansTitle')}
          uploadButtonText={t('trade.common.uploadScans')}
          onFileSelect={(selected) => void handleUpload(selected)}
        />
      </section>

      {!isEdit && (
        <section className={styles.section}>
          <div className={`${styles.sectionTitle} ${styles.required}`}>{t('trade.common.officerInCharge')}</div>
          <EmployeePickField
            value={officer}
            onChange={(empNo) => {
              setOfficer(empNo);
              clearError('officer');
            }}
            source={{ type: 'candidates', atrzProcCd: tradeProcessCode(kind, 'RCPT'), stpNo: RECEIPT_OFFICER_STEP }}
            placeholder={t('trade.common.selectOfficer')}
            searchTitle={t('trade.common.officerSearch')}
          />
          {errors.officer && <div className={styles.error}>{errors.officer}</div>}
        </section>
      )}

      {picker === 'member' && (
        <MemberSearchPopup
          onClose={() => setPicker(null)}
          onSelect={(picked) => {
            setMbrNo(picked.mbrNo);
            clearError('member');
            setPicker(null);
          }}
        />
      )}
      {picker === 'collateral' && (
        <CollateralSearchPopup
          onClose={() => setPicker(null)}
          onSelect={(picked) => {
            setCollateral(picked);
            setPicker(null);
          }}
        />
      )}
      {picker === 'targetCollateral' && (
        <TargetCollateralPopup
          onClose={() => setPicker(null)}
          onSubmit={(item) => {
            setTargetCollaterals((prev) => [...prev, item].slice(0, MAX_TARGET_COLLATERALS));
            setPicker(null);
          }}
        />
      )}
      {(picker === 'npl' || picker === 'lot') && (
        <NplSearchPopup
          mode={picker}
          onClose={() => setPicker(null)}
          onSelect={(picked) => {
            setTarget(picked);
            clearError('target');
            setPicker(null);
          }}
        />
      )}
    </Popup>
  );
}
