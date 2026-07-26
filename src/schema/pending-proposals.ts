import {
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pendingProposalsTable = pgTable(
  "pending_proposals",
  {
    id: serial("id").primaryKey(),

    proposerId: text("proposer_id")
      .notNull(),

    targetId: text("target_id")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),
  },
);

export const insertPendingProposalSchema =
  createInsertSchema(
    pendingProposalsTable,
  ).omit({
    id: true,
    createdAt: true,
  });

export type InsertPendingProposal =
  z.infer<
    typeof insertPendingProposalSchema
  >;

export type PendingProposal =
  typeof pendingProposalsTable.$inferSelect;