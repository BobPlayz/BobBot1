import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gamesTable = pgTable("games", {
  id:           serial("id").primaryKey(),
  type:         text("type").notNull(),
  guildId:      text("guild_id").notNull(),
  channelId:    text("channel_id").notNull(),
  messageId:    text("message_id"),
  player1Id:    text("player1_id").notNull(),
  player2Id:    text("player2_id").notNull(),
  boardState:   text("board_state").notNull(),
  currentTurn:  text("current_turn").notNull(),
  winnerId:     text("winner_id"),
  isActive:     boolean("is_active").notNull().default(true),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
