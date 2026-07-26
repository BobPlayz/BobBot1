import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const marriagesTable = pgTable("marriages", {
  id: serial("id").primaryKey(),

  user1: text("user1").notNull(),
  user2: text("user2").notNull(),

  marriedAt: timestamp("married_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  lovePoints: integer("love_points")
    .notNull()
    .default(0),

  hugs: integer("hugs")
    .notNull()
    .default(0),

  kisses: integer("kisses")
    .notNull()
    .default(0),

  cuddles: integer("cuddles")
    .notNull()
    .default(0),

  gifts: integer("gifts")
    .notNull()
    .default(0),
});

export const insertMarriageSchema =
  createInsertSchema(marriagesTable).omit({
    id: true,
    marriedAt: true,
  });

export type InsertMarriage =
  z.infer<typeof insertMarriageSchema>;

export type Marriage =
  typeof marriagesTable.$inferSelect;
  