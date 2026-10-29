import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const mocks = pgTable('subject_mocks', {
  id: uuid().defaultRandom().primaryKey(),
  owner: text().notNull(),
  subject: text().notNull(),
  title: text().notNull(),
  questions: jsonb().notNull().$type<{ q: string; options: string[]; answer: number; explanation: string }[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [index('subject_mocks_owner_subject_idx').on(table.owner, table.subject)]);
