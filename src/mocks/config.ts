// Base URL for MSW handlers — must match VITE_API_BASE_URL used by the axios client.
// MSW 2.x uses full URL matching, so handlers must register with the exact origin.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
