import { useTranslation } from 'react-i18next';
import TradeContractBoard from '../_shared/TradeContractBoard';

/** Purchase Brokerage Contract Management (menu A05020100). */
export default function PurchaseContractManagement() {
  const { t } = useTranslation();
  return <TradeContractBoard kind="purchase-brokerage-contracts" title={t('trade.titles.purchaseContract')} />;
}
