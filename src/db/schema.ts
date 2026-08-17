import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email'),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  role: text('role').default('user'),
  subscriptionStatus: text('subscription_status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  category: text('category').notNull(),
  tags: text('tags').default('[]'),
  visibility: text('visibility').default('public'),
  author: text('author').default('Innovation Studio'),
  isHd: boolean('is_hd').default(true),
  isEncrypted: boolean('is_encrypted').default(true),
  views: integer('views').default(0).notNull(),
  isPremiere: boolean('is_premiere').default(false),
  premiereTime: text('premiere_time'),
  isLiveChatEnabled: boolean('is_live_chat_enabled').default(true),
  accentColor: text('accent_color').default('#f97316'),
  subtitles: text('subtitles').default('[]'),
  qualities: text('qualities').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({}) => ({}));
export const videosRelations = relations(videos, ({}) => ({}));
