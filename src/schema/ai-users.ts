import {
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const aiUsersTable = pgTable(
  "ai_users",
  {
    id: serial("id").primaryKey(),

    discordId: text("discord_id")
      .notNull()
      .unique(),

    memory: text("memory")
      .notNull()
      .default(""),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);

export const insertAIUserSchema =
  createInsertSchema(aiUsersTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type InsertAIUser = z.infer<
  typeof insertAIUserSchema
>;

export type AIUser =
  typeof aiUsersTable.$inferSelect;