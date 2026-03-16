import { http, HttpResponse } from 'msw';
import { mockMenus } from '../data/menus';
import { BASE_URL } from '../config';

export const menuHandlers = [
  // GET /api/mnu/auth-list
  // fetchAuthMenuList() in src/api/menu.ts checks data.status !== 200 — must include status: 200
  http.get(`${BASE_URL}/api/mnu/auth-list`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'success',
      data: mockMenus,
    });
  }),
];
