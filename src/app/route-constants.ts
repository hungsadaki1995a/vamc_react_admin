export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  FIND_ID: '/find-id',
} as const;

export const PRIVATE_ROUTES = [
  '/members',
  '/content-management/inquiry-management',
  '/content-management/faq',
  '/app/:tabKey?',
] as const;
