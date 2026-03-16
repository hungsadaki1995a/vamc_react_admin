import { http, HttpResponse } from 'msw';
import { mockUsr } from '../data/users';
import { BASE_URL } from '../config';

export const userHandlers = [
  // GET /api/usr/:usrId
  // getMe() in src/api/user.ts checks data.status !== 200 — must include status: 200
  http.get(`${BASE_URL}/api/usr/:usrId`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'success',
      data: mockUsr,
    });
  }),
];
