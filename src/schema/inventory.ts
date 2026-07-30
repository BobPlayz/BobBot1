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

import { itemsTable } from "./items";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),

  discordId: text("discord_id")
    .notNull(),

  itemId: integer("item_id")
    .notNull()
    .references(() => itemsTable.id),

  quantity: integer("quantity")
    .notNull()
    .default(1),

  equipped: boolean("equipped")
    .notNull()
    .default(false),

  durability: integer("durability")
    .notNull()
    .default(100),

  acquiredAt: timestamp("acquired_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const insertInventorySchema =
  createInsertSchema(inventoryTable).omit({
    id: true,
    acquiredAt: true,
    createdAt: true,
  });

export type InsertInventory =
  z.infer<typeof insertInventorySchema>;

export type Inventory =
  typeof inventoryTable.$inferSelect;