import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),

  // Basic
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull().default("📦"),

  // Economy
  price: integer("price").notNull(),
  sellPrice: integer("sell_price").notNull().default(0),

  // Item category
  type: text("type")
    .notNull()
    .default("misc"),

  // Rarity
  rarity: text("rarity")
    .notNull()
    .default("common"),

  // Behaviour
  stackable: boolean("stackable")
    .notNull()
    .default(true),

  usable: boolean("usable")
    .notNull()
    .default(false),

  equipable: boolean("equipable")
    .notNull()
    .default(false),

  tradable: boolean("tradable")
    .notNull()
    .default(true),

  // Effect
  effect: text("effect"),

  effectValue: integer("effect_value")
    .notNull()
    .default(0),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const insertItemSchema =
  createInsertSchema(itemsTable).omit({
    id: true,
    createdAt: true,
  });

export type InsertItem =
  z.infer<typeof insertItemSchema>;

export type Item =
  typeof itemsTable.$inferSelect;