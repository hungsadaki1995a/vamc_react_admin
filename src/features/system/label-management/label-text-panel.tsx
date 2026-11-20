import { useState } from 'react';
import { Input } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { DEFAULT_LANG_CD } from '@/api/system/label-management-api';
import type { LabelDetail, LabelKey, LabelLanguage } from '@/api/system/label-management-api';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { SysButton, SysEmpty, SysSectionHeader, SysTable } from '@/features/system/_shared/sys-list-ui';
import { apiErrorCode, errorMessage } from '@/features/system/_shared/system-utils';
import { hasTextChanges, LABEL_MESSAGES, storedTexts, variablesMatch } from './label-utils';
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
    const texts = rows.map((row) => ({ langCd: row.langCd, trslLtr: row.text.trim() }));
    const defaultText = texts.find((t) => t.langCd === DEFAULT_LANG_CD)?.trslLtr ?? '';
    const next: Record<string, string> = {};
    if (defaultText === '') next[DEFAULT_LANG_CD] = SYS_MESSAGES.required;
    else {
      texts
        .filter((t) => t.langCd !== DEFAULT_LANG_CD && !variablesMatch(defaultText, t.trslLtr))
        .forEach((t) => {
          next[t.langCd] = LABEL_MESSAGES.variableMismatch;
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
      else if (code === 'LBL006') setErrors({ _: LABEL_MESSAGES.variableMismatch });
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
          <Input.TextArea
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
            {value || <span className={styles.placeholder}>{`(empty — shows ${defaultName})`}</span>}
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
      {selected ? (
        <div className={styles.textPanel}>
          <SysTable<TextRow>
            rowKey="langCd"
            columns={columns}
            dataSource={rows}
            loading={loading}
            onRowClick={canWrite ? (row) => setEditingLang(row.langCd) : undefined}
            rowClassName={(row) => (row.langCd === editingLang ? styles.editingRow : '')}
          />
          {errorText && <p className={styles.panelError}>{errorText}</p>}
          <p className={styles.panelHint}>
            Data values use %1, %2 …, line breaks use &lt;br&gt;. Empty languages show the {defaultName} text on user
            screens.
          </p>
        </div>
      ) : (
        <SysEmpty>Select a label to see its text by language.</SysEmpty>
      )}
    </>
  );
}
