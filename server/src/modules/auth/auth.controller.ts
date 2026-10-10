import type { RequestHandler } from 'express';
import { validated } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/api-error.js';
import { UserModel } from '../users/user.model.js';
import { toPublicUser } from '../users/user.serializer.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { loginUser, registerUser } from './auth.service.js';

export const register: RequestHandler = async (req, res) => {
  const session = await registerUser(validated(req, 'body', registerSchema));
  res.status(201).json({ success: true, data: session, message: 'Account created' });
};

export const login: RequestHandler = async (req, res) => {
  const session = await loginUser(validated(req, 'body', loginSchema));
  res.json({ success: true, data: session, message: 'Signed in' });
};

export const me: RequestHandler = async (req, res) => {
  const user = await UserModel.findById(req.user?.id).lean();
  if (!user) throw ApiError.unauthorized();
  res.set('Cache-Control', 'no-store').json({ success: true, data: { user: toPublicUser(user) } });
};
