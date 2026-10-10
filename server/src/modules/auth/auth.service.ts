import bcrypt from 'bcryptjs';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken } from '../../utils/jwt.js';
import { isDuplicateKeyError } from '../../utils/mongo.js';
import { type UserDocument, UserModel } from '../users/user.model.js';
import { type PublicUser, toPublicUser } from '../users/user.serializer.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export const BCRYPT_ROUNDS = 12;

export interface Session {
  user: PublicUser;
  token: string;
  expires_at: string;
}

const emailTaken = () =>
  ApiError.conflict('An account with this email already exists', [
    { field: 'email', message: 'An account with this email already exists. Try signing in.' },
  ]);

// Compared against when the email is unknown, so a login takes the same time whether
// or not the account exists (prevents discovering registered emails by timing).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('layora-timing-safe-dummy', BCRYPT_ROUNDS));

const createSession = (user: UserDocument): Session => {
  const { token, expiresAt } = signAccessToken(user.id);
  return { user: toPublicUser(user), token, expires_at: expiresAt };
};

export async function registerUser(input: RegisterInput): Promise<Session> {
  if (await UserModel.exists({ email: input.email })) throw emailTaken();

  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const user = await UserModel.create({ name: input.name, email: input.email, password_hash });
    return createSession(user);
  } catch (error) {
    // Two simultaneous sign-ups with the same email: the unique index decides.
    if (isDuplicateKeyError(error)) throw emailTaken();
    throw error;
  }
}

export async function loginUser({ email, password }: LoginInput): Promise<Session> {
  const user = await UserModel.findOne({ email }).select('+password_hash');
  const matches = await bcrypt.compare(password, user?.password_hash ?? (await getDummyHash()));

  if (!user || !matches) {
    throw ApiError.unauthorized('Email or password is incorrect', 'INVALID_CREDENTIALS');
  }
  return createSession(user);
}
