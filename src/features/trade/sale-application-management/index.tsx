import { useTranslation } from 'react-i18next';
import TradeApplicationBoard from '../_shared/TradeApplicationBoard';

/** Sale Brokerage Application Management (menu A05010200). */
export default function SaleApplicationManagement() {
  const { t } = useTranslation();
  return <TradeApplicationBoard kind="sale" title={t('trade.titles.saleApplication')} />;
}
