// Lightweight notification bridge for non-React contexts (axios interceptors).
// Call apiNotify.setHandler() once from inside <App> with the antd message API.
// Then call apiNotify.error/success/etc. anywhere in the codebase.

type Level = 'success' | 'error' | 'warning' | 'info';
type Handler = (level: Level, content: string) => void;

let _handler: Handler | null = null;

export const apiNotify = {
  setHandler(fn: Handler) {
    _handler = fn;
  },
  error(content: string) {
    _handler?.('error', content);
  },
  warning(content: string) {
    _handler?.('warning', content);
  },
};
