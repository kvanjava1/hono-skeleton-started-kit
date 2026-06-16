import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const cruds = sqliteTable("cruds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at"),
});

export type Crud = typeof cruds.$inferSelect;
export type CreateCrudInput = Pick<Crud, "title" | "content">;
export type UpdateCrudInput = Partial<CreateCrudInput>;
