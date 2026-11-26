import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export type ProductColour = {
  name: string
  hex: string
  image?: string
  preview?: boolean
}

/**
 * Application users. Supabase Auth is not used.
 *
 * `password_hash` stores a pgcrypto `crypt('password', gen_salt('bf'))` hash.
 * The hash is never exposed through the Data API; login and storefront writes
 * are verified server-side by the `login` and `save_storefront` functions in
 * `supabase/setup.sql`.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/** Full product catalogue. Public read; writes go through the checked RPCs. */
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  gender: text('gender').notNull(),
  description: text('description').notNull(),
  motto: text('motto'),
  pictures: jsonb('pictures').$type<string[]>().notNull().default([]),
  colours: jsonb('colours').$type<ProductColour[]>().notNull().default([]),
  sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
  actualPrice: integer('actual_price').notNull(),
  discountPrice: integer('discount_price'),
  quantity: integer('quantity').notNull().default(0),
  available: boolean('available').notNull().default(true),
  availabilityNote: text('availability_note'),
  isNewArrival: boolean('is_new_arrival').notNull().default(false),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  isTopRecommended: boolean('is_top_recommended').notNull().default(false),
  collection: text('collection').notNull(),
  dateAdded: text('date_added').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/** Single live storefront state row read by every visitor. */
export const storefront = pgTable('storefront', {
  id: text('id').primaryKey(),
  data: jsonb('data').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
