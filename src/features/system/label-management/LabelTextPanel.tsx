import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import { DEFAULT_LANG_CD } from '@/api/system/label-management-api';
import type { LabelDetail, LabelKey, LabelLanguage } from '@/api/system/label-management-api';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { SysButton, SysSectionHeader, SysTable } from '@/components/common/sys-ui/SysListUi';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import { hasTextChanges, storedTexts, variablesMatch } from './label-utils';
import { useUpdateLabel } from './use-labels';
import styles from './label-management.module.scss';

interface LabelTextPanelProps {
  selected: LabelKey | null;
  detail?: LabelDetail;
  loading: boolean;
  languages: LabelLanguage[];
  /** Unsaved texts by langCd (kept by the list so row / page changes can be guarded). */
  drafts: Record<string, string>;
  onDraftChange: (langCd: string, text: string) => void;
  onSaved: () => void;
  canWrite: boolean;
}

interface TextRow {
  langCd: string;
  langNm: string;
  text: string;
}

/** Text by Language (right panel of VPA09040301). Mount with `key` = selected label so edit state resets. */
export default function LabelTextPanel({
  selected,
  detail,
  loading,
  languages,
  drafts,
  onDraftChange,
  onSaved,
  canWrite,
}: LabelTextPanelProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const updateLabel = useUpdateLabel();
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stored = storedTexts(detail);
  const rows: TextRow[] = languages.map((lang) => ({
    langCd: lang.langCd,
    langNm: lang.langNm,
    text: drafts[lang.langCd] ?? stored[lang.langCd] ?? '',
  }));
  const dirty = hasTextChanges(drafts, stored);
  const defaultName = languages.find((lang) => lang.langCd === DEFAULT_LANG_CD)?.langNm ?? 'Tiếng Việt';

  const change = (langCd: string, text: string) => {
    onDraftChange(langCd, text);
    if (errors[langCd])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[langCd];
        return next;
      });
  };

  const save = async () => {
    if (!selected) return;
    const texts = rows.map((row) => ({
      langCd: row.langCd,
      trslLtr: row.text.trim(),
    }));
    const defaultText = texts.find((t) => t.langCd === DEFAULT_LANG_CD)?.trslLtr ?? '';
    const next: Record<string, string> = {};
    if (defaultText === '') next[DEFAULT_LANG_CD] = SYS_MESSAGES.required;
    else {
      texts
        .filter((item) => item.langCd !== DEFAULT_LANG_CD && !variablesMatch(defaultText, item.trslLtr))
        .forEach((item) => {
          next[item.langCd] = t('messages.system.label.variableMismatch');
        });
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await updateLabel.run({ ...selected, translations: texts });
      toast.success(SYS_MESSAGES.saved);
      setEditingLang(null);
      onSaved();
    } catch (error) {
      const code = apiErrorCode(error);
      if (code === 'LBL005') setErrors({ [DEFAULT_LANG_CD]: SYS_MESSAGES.required });
      else if (code === 'LBL006') setErrors({ _: t('messages.system.label.variableMismatch') });
      else toast.error(errorMessage(error));
    }
  };

  const columns: TableColumnsType<TextRow> = [
    {
      title: 'Language',
      dataIndex: 'langNm',
      width: '45%',
      render: (value: string, row) => (row.langCd === DEFAULT_LANG_CD ? `${value} (default)` : value),
    },
    {
      title: 'Text',
      dataIndex: 'text',
      render: (value: string, row) =>
        canWrite && editingLang === row.langCd ? (
          <TextArea
            autoFocus
            value={value}
            autoSize={{ minRows: 1, maxRows: 6 }}
            status={errors[row.langCd] ? 'error' : undefined}
            onChange={(e) => change(row.langCd, e.target.value)}
            onBlur={() => setEditingLang(null)}
          />
        ) : (
          <div
            className={styles.textCell}
            data-error={errors[row.langCd] ? true : undefined}
            data-editable={canWrite || undefined}
          >
            {value || (
              <span className={styles.placeholder}>{t('messages.system.label.emptyPlaceholder', { defaultName })}</span>
            )}
          </div>
        ),
    },
  ];

  const errorText = Object.values(errors)[0];

  return (
    <>
      <SysSectionHeader
        title={
          <span className={styles.panelTitle}>
            Text by Language
            {selected && (
              <>
                <span className={styles.titleDivider} />
                <span className={styles.panelKey}>{selected.lblCd}</span>
              </>
            )}
          </span>
        }
        primaryActions={
          canWrite && (
            <SysButton look="navy" disabled={!selected || !dirty} loading={updateLabel.isPending} onClick={save}>
              Save
            </SysButton>
          )
        }
      />
      {/* No label selected: the design keeps the empty "Language | Text" frame. */}
      <div className={styles.textPanel}>
        <SysTable<TextRow>
          fill
          tableLayout="fixed"
          rowKey="langCd"
          columns={columns}
          dataSource={selected ? rows : []}
          loading={loading}
          locale={{
            emptyText: <span className={styles.emptyText}>{t('messages.system.label.emptyTextPanel')}</span>,
          }}
          onRowClick={canWrite && selected ? (row) => setEditingLang(row.langCd) : undefined}
          selectedRowKey={editingLang}
        />
        {errorText && <p className={styles.panelError}>{errorText}</p>}
        {selected && <p className={styles.panelHint}>{t('messages.system.label.textHint', { defaultName })}</p>}
      </div>
    </>
  );
}
