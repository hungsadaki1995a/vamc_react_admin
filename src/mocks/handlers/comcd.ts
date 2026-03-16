import { http, HttpResponse } from 'msw';
import { mockComcds } from '../data/comcds';
import { BASE_URL } from '../config';

export const comcdHandlers = [
  // GET /api/comcd/all
  // getAllCodeList() in src/api/common.ts reads data.data ?? []
  http.get(`${BASE_URL}/api/comcd/all`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'success',
      data: mockComcds,
    });
  }),
];
