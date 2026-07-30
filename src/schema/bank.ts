import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bankTable = pgTable("bank", {
  id: serial("id").primaryKey(),

  discordId: text("discord_id")
    .notNull()
    .unique(),

  balance: integer("balance")
    .notNull()
    .default(0),

  bankLevel: integer("bank_level")
    .notNull()
    .default(1),

  maxStorage: integer("max_storage")
    .notNull()
    .default(5000),

  interestRate: integer("interest_rate")
    .notNull()
    .default(10),

  totalDeposited: integer("total_deposited")
    .notNull()
    .default(0),

  totalWithdrawn: integer("total_withdrawn")
    .notNull()
    .default(0),

  lastInterestClaim: timestamp(
    "last_interest_claim",
    {
      withTimezone: true,
    },
  )
    .notNull()
    .defaultNow(),

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
});

export const insertBankSchema =
  createInsertSchema(bankTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type InsertBank =
  z.infer<typeof insertBankSchema>;

export type Bank =
  typeof bankTable.$inferSelect;