import {
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const aiServersTable = pgTable(
  "ai_servers",
  {
    id: serial("id").primaryKey(),

    guildId: text("guild_id")
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

export const insertAIServerSchema =
  createInsertSchema(aiServersTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type InsertAIServer = z.infer<
  typeof insertAIServerSchema
>;

export type AIServer =
  typeof aiServersTable.$inferSelect;