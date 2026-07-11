import type { AuthContext } from '../middlewares/authenticate.ts';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}
