import { http, HttpResponse } from 'msw';
import { mockProjects } from '../data/projects';
import { BASE_URL } from '../config';

export const projectHandlers = [
  // GET /api/proj/my
  // getMyProjects() in src/api/project.ts checks data.status === 200 — must include status: 200
  http.get(`${BASE_URL}/api/proj/my`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'success',
      data: mockProjects,
    });
  }),
];
