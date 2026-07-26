import { eq, and, or, lt } from "drizzle-orm";

import { db } from "../db.js";
import { pendingProposalsTable } from "../schema/pending-proposals.js";

export async function createProposal(
  proposerId: string,
  targetId: string,
) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(pendingProposalsTable).values({
    proposerId,
    targetId,
    expiresAt,
  });
}

export async function getProposal(
  proposerId: string,
  targetId: string,
) {
  const proposal =
    await db.query.pendingProposalsTable.findFirst({
      where: and(
        eq(pendingProposalsTable.proposerId, proposerId),
        eq(pendingProposalsTable.targetId, targetId),
      ),
    });

  return proposal ?? null;
}

export async function getOutgoingProposal(
  proposerId: string,
) {
  const proposal =
    await db.query.pendingProposalsTable.findFirst({
      where: eq(
        pendingProposalsTable.proposerId,
        proposerId,
      ),
    });

  return proposal ?? null;
}

export async function getIncomingProposal(
  targetId: string,
) {
  const proposal =
    await db.query.pendingProposalsTable.findFirst({
      where: eq(
        pendingProposalsTable.targetId,
        targetId,
      ),
    });

  return proposal ?? null;
}

export async function deleteProposal(
  id: number,
) {
  await db
    .delete(pendingProposalsTable)
    .where(eq(pendingProposalsTable.id, id));
}

export async function deleteExpiredProposals() {
  await db
    .delete(pendingProposalsTable)
    .where(
      lt(
        pendingProposalsTable.expiresAt,
        new Date(),
      ),
    );
}

export async function deleteUserProposals(
  userId: string,
) {
  await db
    .delete(pendingProposalsTable)
    .where(
      or(
        eq(
          pendingProposalsTable.proposerId,
          userId,
        ),
        eq(
          pendingProposalsTable.targetId,
          userId,
        ),
      ),
    );
}