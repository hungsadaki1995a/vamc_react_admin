import { createContext } from 'react';

/**
 * Provides the ExternalWindow's root container element when a component is
 * rendered inside ExternalWindow. Null outside ExternalWindow.
 *
 * Used as getPopupContainer target for antd dropdowns/datepickers inside
 * ExternalWindow to ensure popups render in the correct browser window.
 *
 * Using the container div (not document.body) avoids a dom-align bug where
 * the popup window's <html> / <body> elements are not excluded from the
 * overflow-clipping traversal (dom-align's exclusion list uses the MAIN
 * window's document.body/documentElement), causing wildly wrong positions.
 */
export const PopupDocumentContext = createContext<HTMLElement | null>(null);
