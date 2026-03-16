import { http, HttpResponse } from 'msw';
import { MOCK_RSA_PUBLIC_KEY } from '../data/rsaKey';
import { BASE_URL } from '../config';

export const authHandlers = [
  // GET /api/auth/public-key
  // fetchPublicKey() reads (data as any).data?.publicKey — ApiResponse wrapped shape
  http.get(`${BASE_URL}/api/auth/public-key`, () => {
    return HttpResponse.json({ status: 200, data: { publicKey: MOCK_RSA_PUBLIC_KEY } });
  }),

  // POST /api/auth/login
  // LoginPage/api.ts: apiClient.post<LoginResponse> — raw response, no ApiResponse wrapper
  http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
  }),

  // POST /api/auth/refresh
  // App.tsx restoreSession + client.ts silent refresh — raw LoginResponse
  http.post(`${BASE_URL}/api/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
  }),

  // POST /api/auth/logout
  http.post(`${BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ status: 200, success: true, message: 'success', data: null });
  }),
];
