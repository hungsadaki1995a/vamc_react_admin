import { http, HttpResponse } from 'msw';
import { mockLabels } from '../data/labels';
import { BASE_URL } from '../config';

export const labelHandlers = [
  // GET /api/lbl/bulk
  // fetchBulkLabels() in src/api/lbl.ts checks data.status !== 200 — must include status: 200
  http.get(`${BASE_URL}/api/lbl/bulk`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'success',
      data: mockLabels,
    });
  }),
];
