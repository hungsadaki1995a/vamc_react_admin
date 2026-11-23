import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { Dayjs } from 'dayjs';
import type { FeePaymentType, MemberFeePayment } from '@/api/member/member-fee-api';

// Payment History rows of the member detail / edit popups (Figma v0.8): newest first, No counts down,
// "Current" on the period that contains today, Payment Date "-" on exempt rows.

export interface FeeHistoryRow {
  no: number;
  type: 'Paid' | 'Exempt';
  /** DD-MM-YYYY */
  startDate: string;
  /** DD-MM-YYYY */
  endDate: string;
  /** DD-MM-YYYY or "-" */
  paymentDate: string;
  isCurrent: boolean;
}

/** Period fields of the member detail (`basic`), used while the server keeps no history. */
export interface CurrentPeriod {
  mbrshpPayYn?: string;
  mbrshpFeeExmpYn?: string;
  /** DD/MM/YYYY */
  mbrshpBgngDt?: string;
  /** DD/MM/YYYY */
  mbrshpEndDt?: string;
}

// Strict parsing of the API (yyyy-MM-dd) and detail (dd/MM/yyyy) formats
dayjs.extend(customParseFormat);

const DISPLAY = 'DD-MM-YYYY';
const parse = (value?: string | null): Dayjs | null => {
  if (!value) return null;
  const d = dayjs(value, ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY'], true);
  return d.isValid() ? d : null;
};
const show = (d: Dayjs | null) => (d ? d.format(DISPLAY) : '-');
const typeOf = (code: FeePaymentType): FeeHistoryRow['type'] => (code === 'EXMP' ? 'Exempt' : 'Paid');

function isCurrent(start: Dayjs | null, end: Dayjs | null): boolean {
  const today = dayjs().startOf('day');
  return !!start && !!end && !start.isAfter(today, 'day') && !end.isBefore(today, 'day');
}

/**
 * Rows from the server history; while it is empty (history table not created yet) one row is derived from
 * the member's current period so the popup still shows the period in force.
 */
export function buildFeeHistoryRows(payments: MemberFeePayment[] | undefined, period?: CurrentPeriod): FeeHistoryRow[] {
  if (payments?.length) {
    return payments.map((p, index) => {
      const start = parse(p.periodBgngDt);
      const end = parse(p.periodEndDt);
      const exempt = p.paySeCd === 'EXMP';
      return {
        no: payments.length - index,
        type: typeOf(p.paySeCd),
        startDate: show(start),
        endDate: show(end),
        paymentDate: exempt ? '-' : show(parse(p.payDt)),
        isCurrent: isCurrent(start, end),
      };
    });
  }
  const start = parse(period?.mbrshpBgngDt);
  const end = parse(period?.mbrshpEndDt);
  if (!start || !end) return [];
  const exempt = period?.mbrshpFeeExmpYn === 'Y' || period?.mbrshpPayYn !== 'Y';
  return [
    {
      no: 1,
      type: exempt ? 'Exempt' : 'Paid',
      startDate: show(start),
      endDate: show(end),
      // MBR_INFO keeps no separate payment date in the detail; the history table carries it
      paymentDate: exempt ? '-' : show(start),
      isCurrent: isCurrent(start, end),
    },
  ];
}

/** Default start of the next period: the day after the period still valid, otherwise today. */
export function nextPeriodStart(rows: FeeHistoryRow[]): Dayjs {
  const today = dayjs().startOf('day');
  const latestEnd = rows
    .map((r) => dayjs(r.endDate, DISPLAY, true))
    .filter((d) => d.isValid())
    .sort((a, b) => b.valueOf() - a.valueOf())[0];
  return latestEnd && !latestEnd.isBefore(today, 'day') ? latestEnd.add(1, 'day') : today;
}
