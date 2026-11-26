import { useTranslation } from 'react-i18next';
import TradeContractBoard from '../_shared/TradeContractBoard';

/** Consulting Contract Management (menu A05020300). */
export default function ConsultingContractManagement() {
  const { t } = useTranslation();
  return <TradeContractBoard kind="consulting-contracts" title={t('trade.titles.consultingContract')} />;
}
