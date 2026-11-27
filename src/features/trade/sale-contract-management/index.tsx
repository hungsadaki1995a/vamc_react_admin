import { useTranslation } from 'react-i18next';
import TradeContractBoard from '../_shared/TradeContractBoard';

/** Sale Brokerage Contract Management (menu A05020200). */
export default function SaleContractManagement() {
  const { t } = useTranslation();
  return <TradeContractBoard kind="sale-brokerage-contracts" title={t('trade.titles.saleContract')} />;
}
