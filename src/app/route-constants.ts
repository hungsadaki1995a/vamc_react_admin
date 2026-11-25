export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  FIND_ID: '/find-id',
  FIND_PASSWORD: '/find-password',
} as const;

/**
 * Hardcoded route-to-menu-code mapping.
 * Menu codes not listed here have no mapped route yet and will not navigate the URL.
 */
export const ROUTE_MENU_CODES: Record<string, readonly string[]> = {
  '/members': ['A03010000', 'A03000000', 'members', 'member.list', 'MemberList'],
  '/npl-info/cic-data': ['A04010000'],
  '/npl-info/management': ['A04020000'],
  '/npl-info/collateral-asset': ['A04030000'],
  '/npl-info/debtor': ['A04040000'],
  '/npl-info/lot-change': ['A04050000'],
  '/transaction/application': ['A05010000'],
  '/transaction/purchase-brokerage-application': ['A05010100'],
  '/transaction/sale-brokerage-application': ['A05010200'],
  '/transaction/consulting-application': ['A05010300'],
  '/contract/purchase-brokerage-contract': ['A05020100'],
  '/contract/sale-brokerage-contract': ['A05020200'],
  '/contract/consulting-contract': ['A05020300'],
  '/content/banner': ['A07060100'],
  '/content/logo': ['A07060200'],
  '/content/slogan': ['A07060300'],
  '/system-operation/npl-platform/menu-settings': ['A09010100'],
  '/system-operation/npl-platform/form': ['A09010200'],
  '/system-operation/npl-platform/fee': ['A09010300'],
  '/system-operation/npl-platform/exchange-rate': ['A09010400'],
  '/admin/user-management': ['A09020200'],
  '/admin/user-group': ['A09020300'],
  '/admin/menu-permission': ['A09020400'],
  '/content-management/inquiry-management': ['inquiry-management', 'InquiryManagement'],
  '/content-management/faq': ['faq-management', 'faq', 'FaqManagement'],
};

export const PRIVATE_ROUTES = Object.keys(ROUTE_MENU_CODES);

const MENU_CODE_TO_ROUTE: Record<string, string> = Object.entries(ROUTE_MENU_CODES).reduce(
  (acc, [path, codes]) => {
    for (const code of codes) {
      acc[code] = path;
    }
    return acc;
  },
  {} as Record<string, string>,
);

/** Returns the hardcoded route path for a menu code, or undefined if unmapped. */
export function getRouteByMenuCode(menuCode?: string | null): string | undefined {
  return menuCode ? MENU_CODE_TO_ROUTE[menuCode] : undefined;
}

export const REDIRECT_QUERY_KEY = 'redirect';

/** Validates an internal redirect target against PRIVATE_ROUTES to prevent open redirects. */
export function getSafeRedirectPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!PRIVATE_ROUTES.includes(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Builds `/login?redirect=...` for valid private routes, or `/login` otherwise. */
export function buildLoginRedirectUrl(target: string): string {
  const safeTarget = getSafeRedirectPath(target);
  if (!safeTarget) return PUBLIC_ROUTES.LOGIN;
  return `${PUBLIC_ROUTES.LOGIN}?${REDIRECT_QUERY_KEY}=${encodeURIComponent(safeTarget)}`;
}
