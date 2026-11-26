import { pgSchema, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

const auth = pgSchema('auth')
const authUsers = auth.table('users', {
  id: uuid('id').primaryKey(),
})

/**
 * Application profile for Supabase Auth users.
 *
 * Passwords are intentionally not stored here. Supabase Auth owns password
 * hashes, sessions and recovery. This table stores application-level identity
 * and authorization metadata only.
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

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
