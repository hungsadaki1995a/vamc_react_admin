import { http, HttpResponse } from 'msw';
import { mockMenus } from '../data/menus';
import { BASE_URL } from '../config';

export const menuHandlers = [
  // GET /api/common/menus/all
  // fetchAuthMenuList() in src/api/menu.ts checks data.status !== 200 — must include status: 200
  http.get(`${BASE_URL}/api/common/menus/all`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'success',
      data: mockMenus,
    });
  }),
];
