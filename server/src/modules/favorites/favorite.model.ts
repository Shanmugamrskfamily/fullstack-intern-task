import { Schema, type Types, model } from 'mongoose';

export interface Favorite {
  user: Types.ObjectId;
  template: Types.ObjectId;
  created_at: Date;
}

const favoriteSchema = new Schema<Favorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    template: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false },
);

// One favorite per user per template, enforced by the database (makes POST idempotent).
favoriteSchema.index({ user: 1, template: 1 }, { unique: true });
// "My favorites, newest first".
favoriteSchema.index({ user: 1, created_at: -1 });

export const FavoriteModel = model<Favorite>('Favorite', favoriteSchema);
