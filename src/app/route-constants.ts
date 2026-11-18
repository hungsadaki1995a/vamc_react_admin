export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  FIND_ID: '/find-id',
} as const;

/**
 * Hardcoded route-to-menu-code mapping.
 * Menu codes not listed here have no mapped route yet and will not navigate the URL.
 */
export const ROUTE_MENU_CODES: Record<string, readonly string[]> = {
  '/members': ['A01010000', 'A01020000', 'A01030000', 'A01000000', 'members', 'member.list', 'MemberList'],
  '/npl-info/cic-data': ['A03020000'],
  '/npl-info/management': ['A03010100'],
  '/npl-info/collateral-asset': ['A03010200'],
  '/npl-info/debtor': ['A03010300'],
  '/npl-info/lot-change': ['A03010400'],
  '/transaction/application': ['A02010000'],
  '/transaction/purchase-brokerage-application': ['A02010100'],
  '/transaction/sale-brokerage-application': ['A02010200'],
  '/transaction/consulting-application': ['A02010300'],
  '/contract/purchase-brokerage-contract': ['A02020100'],
  '/contract/sale-brokerage-contract': ['A02020200'],
  '/contract/consulting-contract': ['A02020300'],
  '/system-operation/npl-platform/menu-settings': ['A06010100'],
  '/system-operation/npl-platform/form': ['A06010200'],
  '/system-operation/npl-platform/fee': ['A06010300'],
  '/system-operation/npl-platform/exchange-rate': ['A06010500'],
  '/admin/user-management': ['A06020200'],
  '/admin/user-group': ['A06020300'],
  '/admin/menu-permission': ['A06020400'],
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
