import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const itemsTable = pgTable("items", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull().unique(),
  description: text("description").notNull(),
  price:       integer("price").notNull(),
  emoji:       text("emoji").notNull().default("📦"),
  type:        text("type").notNull().default("misc"),
  effect:      text("effect"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true, createdAt: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
