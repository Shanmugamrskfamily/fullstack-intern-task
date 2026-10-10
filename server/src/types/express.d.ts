import 'express-serve-static-core';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Output of the `validate()` middleware: parsed, sanitised and typed input. */
    valid?: { body?: unknown; query?: unknown; params?: unknown };
    /** Set by `authenticate()` for protected routes. */
    user?: AuthUser;
  }
}
