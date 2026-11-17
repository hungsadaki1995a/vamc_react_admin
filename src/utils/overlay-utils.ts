const MODAL_LAYER_SELECTORS = [
  '.ant-modal-root .ant-modal-wrap',
  '.ant-modal-root .ant-modal-confirm',
];

function isVisibleElement(element: Element): boolean {
  if (typeof window === 'undefined' || !(element instanceof HTMLElement)) {
    return false;
  }

  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  return element.getClientRects().length > 0;
}

export function hasVisibleModalLayer(root?: Document): boolean {
  const targetDocument = root ?? (typeof document !== 'undefined' ? document : undefined);
  if (!targetDocument) return false;

  return MODAL_LAYER_SELECTORS.some((selector) =>
    Array.from(targetDocument.querySelectorAll(selector)).some(isVisibleElement),
  );
}
