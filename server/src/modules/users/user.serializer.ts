import type { Types } from 'mongoose';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface UserLike {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  created_at?: Date | null;
}

/** Response DTO: an explicit allowlist, so internal fields can never leak. */
export const toPublicUser = (user: UserLike): PublicUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  created_at: (user.created_at ?? new Date()).toISOString(),
});
