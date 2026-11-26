import {
  jsonb,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

const auth = pgSchema('auth')
const authUsers = auth.table('users', {
  id: uuid('id').primaryKey(),
})

/**
 * Application profile for Supabase Auth users. Passwords live in Supabase Auth;
 * this table stores application identity and role only.
 *
 * Row-level security and policies are applied by `supabase/setup.sql` (run after
 * `drizzle-kit push`) because drizzle-kit push does not reliably serialize
 * policy USING/WITH CHECK expressions.
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  role: text('role').notNull().default('admin'),
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
