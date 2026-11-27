import { useTranslation } from 'react-i18next';
import TradeApplicationBoard from '../_shared/TradeApplicationBoard';

/** Purchase Brokerage Application Management (menu A05010100). */
export default function PurchaseApplicationManagement() {
  const { t } = useTranslation();
  return <TradeApplicationBoard kind="purchase" title={t('trade.titles.purchaseApplication')} />;
}
