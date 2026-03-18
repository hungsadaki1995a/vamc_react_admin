import { authHandlers } from './handlers/auth';
import { userHandlers } from './handlers/user';
import { menuHandlers } from './handlers/menu';
import { comcdHandlers } from './handlers/comcd';

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...menuHandlers,
  ...comcdHandlers,
];
