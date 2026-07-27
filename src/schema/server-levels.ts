import {
  pgTable,
  serial,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const serverLevelsTable = pgTable(
  "server_levels",
  {
    id: serial("id").primaryKey(),

    guildId: text("guild_id").notNull(),

    userId: text("user_id").notNull(),

    xp: integer("xp")
      .notNull()
      .default(0),

    level: integer("level")
      .notNull()
      .default(0),

    messages: integer("messages")
      .notNull()
      .default(0),
  },
);