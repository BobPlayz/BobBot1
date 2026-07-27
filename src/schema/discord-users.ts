import {
  pgTable,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const discordUsersTable = pgTable(
  "discord_users",
  {
    discordId: text("discord_id").primaryKey(),

    // Economy
    balance: integer("balance")
      .notNull()
      .default(0),

    lastWork: timestamp("last_work", {
      withTimezone: true,
    }),

    lastFish: timestamp("last_fish", {
      withTimezone: true,
    }),

    totalFishCaught: integer(
      "total_fish_caught",
    )
      .notNull()
      .default(0),

    lastHunt: timestamp("last_hunt", {
      withTimezone: true,
    }),

    totalHunted: integer("total_hunted")
      .notNull()
      .default(0),

    lastDaily: timestamp("last_daily", {
      withTimezone: true,
    }),

    lastRob: timestamp("last_rob", {
      withTimezone: true,
    }),

    // Profile
    bio: text("bio")
      .notNull()
      .default(""),

    title: text("title")
      .notNull()
      .default("Newbie"),

    profileColor: text("profile_color")
      .notNull()
      .default("Blue"),

    background: text("background")
      .notNull()
      .default("Default"),

    // Statistics
    commandsUsed: integer("commands_used")
      .notNull()
      .default(0),

    workCount: integer("work_count")
      .notNull()
      .default(0),

    fishCount: integer("fish_count")
      .notNull()
      .default(0),

    huntCount: integer("hunt_count")
      .notNull()
      .default(0),

    robWins: integer("rob_wins")
      .notNull()
      .default(0),

    robFails: integer("rob_fails")
      .notNull()
      .default(0),

    coinflipWins: integer("coinflip_wins")
      .notNull()
      .default(0),

    coinflipLosses: integer("coinflip_losses")
      .notNull()
      .default(0),

    diceWins: integer("dice_wins")
      .notNull()
      .default(0),

    diceLosses: integer("dice_losses")
      .notNull()
      .default(0),

    dailyStreak: integer("daily_streak")
      .notNull()
      .default(0),

    highestDailyStreak: integer(
      "highest_daily_streak",
    )
      .notNull()
      .default(0),

    // Timestamps
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

export const insertDiscordUserSchema =
  createInsertSchema(discordUsersTable).omit({
    createdAt: true,
    updatedAt: true,
  });

export type InsertDiscordUser =
  z.infer<typeof insertDiscordUserSchema>;

export type DiscordUser =
  typeof discordUsersTable.$inferSelect;