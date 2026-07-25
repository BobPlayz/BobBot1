import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const discordUsersTable = pgTable("discord_users", {
  discordId:      text("discord_id").primaryKey(),
  balance:        integer("balance").notNull().default(0),
  lastWork:       timestamp("last_work",  { withTimezone: true }),
  lastFish:       timestamp("last_fish",  { withTimezone: true }),
  totalFishCaught: integer("total_fish_caught").notNull().default(0),
  lastHunt:       timestamp("last_hunt",  { withTimezone: true }),
  totalHunted:    integer("total_hunted").notNull().default(0),
  lastDaily:      timestamp("last_daily", { withTimezone: true }),
  lastRob:        timestamp("last_rob",   { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDiscordUserSchema = createInsertSchema(discordUsersTable).omit({ createdAt: true, updatedAt: true });
export type InsertDiscordUser = z.infer<typeof insertDiscordUserSchema>;
export type DiscordUser = typeof discordUsersTable.$inferSelect;
