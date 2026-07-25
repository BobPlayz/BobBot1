import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const giveawaysTable = pgTable("giveaways", {
  id:          serial("id").primaryKey(),
  guildId:     text("guild_id").notNull(),
  channelId:   text("channel_id").notNull(),
  messageId:   text("message_id"),
  prize:       text("prize").notNull(),
  hostId:      text("host_id").notNull(),
  winnerCount: integer("winner_count").notNull().default(1),
  entries:     text("entries").array().notNull().default([]),
  winnerId:    text("winner_id"),
  endTime:     timestamp("end_time", { withTimezone: true }).notNull(),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGiveawaySchema = createInsertSchema(giveawaysTable).omit({ id: true, createdAt: true });
export type InsertGiveaway = z.infer<typeof insertGiveawaySchema>;
export type Giveaway = typeof giveawaysTable.$inferSelect;
