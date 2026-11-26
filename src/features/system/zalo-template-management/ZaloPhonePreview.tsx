import { useTranslation } from 'react-i18next';
import type { ZaloSendMode } from '@/api/system/zalo-api';
import styles from './zalo-phone-preview.module.scss';

// Phone mock of the Zalo chat with the VAMC OA: how the recipient sees the template (ZNS card or OA bubble).
// The text comes from the server preview (sample data); the first URL becomes the card button like a ZNS CTA.

const URL_PATTERN = /https?:\/\/\S+/;

interface ZaloPhonePreviewProps {
  mode: ZaloSendMode;
  /** Template name, shown as the ZNS card title. */
  title: string;
  /** Rendered text; undefined while nothing is previewed yet. */
  text?: string;
  missingVariables?: string[];
  loading?: boolean;
}

export default function ZaloPhonePreview({ mode, title, text, missingVariables = [], loading }: ZaloPhonePreviewProps) {
  const { t } = useTranslation();
  const link = text?.match(URL_PATTERN)?.[0];
  const body = link && text ? text.replace(link, '').trim() : text;

  return (
    <div className={styles.phone} aria-label={t('zalo.templates.phone.label')}>
      <div className={styles.statusBar}>
        <span>9:41</span>
        <span className={styles.statusIcons} aria-hidden>
          ▂▄▆ ◔
        </span>
      </div>
      <div className={styles.chatHeader}>
        <span className={styles.back} aria-hidden>
          ‹
        </span>
        <span className={styles.avatar} aria-hidden>
          V
        </span>
        <span className={styles.oa}>
          <strong className={styles.oaName}>VAMC NPL</strong>
          <span className={styles.oaTag}>{t('zalo.templates.phone.officialAccount')}</span>
        </span>
      </div>
      <div className={styles.chat}>
        <span className={styles.dayChip}>{t('zalo.templates.phone.today')}</span>
        {text === undefined ? (
          <p className={styles.placeholder}>{loading ? t('zalo.templates.phone.loading') : t('zalo.templates.preview.empty')}</p>
        ) : mode === 'ZNS' ? (
          <div className={styles.card}>
            <span className={styles.cardTag}>{t('zalo.templates.phone.znsTag')}</span>
            <strong className={styles.cardTitle}>{title || t('zalo.templates.phone.untitled')}</strong>
            <p className={styles.cardText} data-testid="zalo-preview">
              {body}
            </p>
            {link && (
              <span className={styles.cardButton} title={link}>
                {t('zalo.templates.phone.open')}
              </span>
            )}
            <span className={styles.time}>{t('zalo.templates.phone.now')}</span>
          </div>
        ) : (
          <div className={styles.bubble}>
            <p className={styles.cardText} data-testid="zalo-preview">
              {text}
            </p>
            <span className={styles.time}>{t('zalo.templates.phone.now')}</span>
          </div>
        )}
        {missingVariables.length > 0 && (
          <p className={styles.missing}>
            {t('zalo.templates.preview.missing', {
              names: missingVariables.join(', '),
            })}
          </p>
        )}
      </div>
      <div className={styles.inputBar} aria-hidden>
        <span className={styles.inputFake}>{t('zalo.templates.phone.input')}</span>
      </div>
    </div>
  );
}
