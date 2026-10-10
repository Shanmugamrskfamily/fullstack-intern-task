import { type HydratedDocument, Schema, model } from 'mongoose';

export interface User {
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    // Never returned by default: queries must opt in with `.select('+password_hash')`.
    password_hash: { type: String, required: true, select: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export type UserDocument = HydratedDocument<User>;

export const UserModel = model<User>('User', userSchema);
