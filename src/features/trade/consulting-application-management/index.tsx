import { useTranslation } from 'react-i18next';
import TradeApplicationBoard from '../_shared/TradeApplicationBoard';

/** Consulting Application Management (menu A05010300). */
export default function ConsultingApplicationManagement() {
  const { t } = useTranslation();
  return <TradeApplicationBoard kind="consulting" title={t('trade.titles.consultingApplication')} />;
}
