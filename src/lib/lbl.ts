/**
 * Global label utilities — no hook, no import boilerplate.
 *
 * Reads directly from labelStore state at call time.
 * Safe for event handlers, callbacks, and non-React contexts.
 *
 * NOT suitable for JSX rendering (won't trigger re-render on locale change).
 * For JSX, use useScreenLabel() hook instead.
 *
 * @example
 * import { tmc, tmi, tme, t } from '@/lib/lbl';
 *
 * message.success(tmi('I100008'));   // MESSAGE.INFO.TEXT_I100008
 * message.error(tme('E100001'));     // MESSAGE.ERROR.TEXT_E100001
 * modal.confirm({ content: tmc('C100007') });
 */
import { useLabelStore } from '@/stores/labelStore';

const get = () => useLabelStore.getState();

/** Full key lookup. Returns key itself if not found. */
export const t = (key: string) => get().t(key);

/** MESSAGE.CONFIRM.TEXT_{code} */
export const tmc = (code: string) => get().tmc(code);

/** MESSAGE.INFO.TEXT_{code} */
export const tmi = (code: string) => get().tmi(code);

/** MESSAGE.ERROR.TEXT_{code} */
export const tme = (code: string) => get().tme(code);
