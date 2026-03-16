import { authHandlers } from './handlers/auth';
import { userHandlers } from './handlers/user';
import { projectHandlers } from './handlers/project';
import { menuHandlers } from './handlers/menu';
import { labelHandlers } from './handlers/label';
import { comcdHandlers } from './handlers/comcd';

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...projectHandlers,
  ...menuHandlers,
  ...labelHandlers,
  ...comcdHandlers,
];
