import type { RequestHandler } from 'express';
import { UserModel } from '../modules/users/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { TokenExpiredError, verifyAccessToken } from '../utils/jwt.js';
import { isObjectId } from '../utils/mongo.js';

const invalidSession = () =>
  ApiError.unauthorized('Your session is not valid. Please sign in again.', 'INVALID_TOKEN');

/** Requires `Authorization: Bearer <jwt>` and attaches the current user to `req.user`. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.get('authorization');
  if (!header) return next(ApiError.unauthorized('Please sign in to continue'));

  const [scheme, token, ...rest] = header.split(' ');
  if (scheme !== 'Bearer' || !token || rest.length || token.length > 2048) {
    return next(invalidSession());
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(
        ApiError.unauthorized('Your session has expired. Please sign in again.', 'TOKEN_EXPIRED'),
      );
    }
    return next(invalidSession());
  }

  if (!isObjectId(userId)) return next(invalidSession());

  // The account must still exist; a token for a deleted user is rejected.
  const user = await UserModel.findById(userId).select('name email').lean();
  if (!user) return next(invalidSession());

  req.user = { id: String(user._id), name: user.name, email: user.email };
  next();
};
