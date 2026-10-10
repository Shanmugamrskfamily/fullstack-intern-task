import mongoose from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { isDuplicateKeyError } from '../../utils/mongo.js';
import { type Template, TemplateModel } from '../templates/template.model.js';
import { type PublicTemplate, toPublicTemplate } from '../templates/template.serializer.js';
import { FavoriteModel } from './favorite.model.js';

export interface FavoriteTemplate extends PublicTemplate {
  favorited_at: string;
}

type LeanTemplate = Template & { _id: string };

/**
 * Idempotent: the first call creates the favorite (`created: true`), repeated calls
 * return the existing one. The unique index guarantees one row even under concurrent
 * requests, so `favorites_count` is only incremented once.
 */
export async function addFavorite(userId: string, templateId: string) {
  if (!(await TemplateModel.exists({ _id: templateId }))) {
    throw ApiError.notFound('Template not found');
  }

  let created = false;
  try {
    const result = await FavoriteModel.updateOne(
      { user: userId, template: templateId },
      { $setOnInsert: { user: userId, template: templateId } },
      { upsert: true },
    );
    created = result.upsertedCount === 1;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error; // a concurrent request created it first
  }

  const template = created
    ? await TemplateModel.findByIdAndUpdate(
        templateId,
        { $inc: { favorites_count: 1 } },
        { returnDocument: 'after' },
      ).lean<LeanTemplate>()
    : await TemplateModel.findById(templateId).lean<LeanTemplate>();
  const favorite = await FavoriteModel.findOne({ user: userId, template: templateId }).lean();

  return {
    created,
    template: {
      ...toPublicTemplate(template!),
      favorited_at: (favorite?.created_at ?? new Date()).toISOString(),
    } satisfies FavoriteTemplate,
  };
}

/** Idempotent: removing something that is not a favorite is still a success. */
export async function removeFavorite(userId: string, templateId: string): Promise<void> {
  const { deletedCount } = await FavoriteModel.deleteOne({ user: userId, template: templateId });
  if (deletedCount) {
    await TemplateModel.updateOne(
      // `trusted()` marks this operator as ours, not user input (see sanitizeFilter in db.ts).
      { _id: templateId, favorites_count: mongoose.trusted({ $gt: 0 }) },
      { $inc: { favorites_count: -1 } },
    );
  }
}

export async function listFavorites(userId: string): Promise<FavoriteTemplate[]> {
  const favorites = await FavoriteModel.find({ user: userId })
    .sort({ created_at: -1 })
    .populate<{ template: LeanTemplate | null }>('template')
    .lean();

  return favorites
    .filter((favorite) => favorite.template !== null) // skip templates removed from the catalogue
    .map((favorite) => ({
      ...toPublicTemplate(favorite.template!),
      favorited_at: favorite.created_at.toISOString(),
    }));
}
