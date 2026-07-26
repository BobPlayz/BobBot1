import { eq, or } from "drizzle-orm";

import { db } from "../db.js";
import { marriagesTable } from "../schema/marriages.js";

export async function getMarriage(userId: string) {
  const result = await db.query.marriagesTable.findFirst({
    where: or(
      eq(marriagesTable.user1, userId),
      eq(marriagesTable.user2, userId),
    ),
  });

  return result ?? null;
}

export async function areMarried(
  user1: string,
  user2: string,
) {
  const marriage = await db.query.marriagesTable.findFirst({
    where: or(
      eq(marriagesTable.user1, user1),
      eq(marriagesTable.user2, user1),
      eq(marriagesTable.user1, user2),
      eq(marriagesTable.user2, user2),
    ),
  });

  if (!marriage) return false;

  return (
    (marriage.user1 === user1 &&
      marriage.user2 === user2) ||
    (marriage.user1 === user2 &&
      marriage.user2 === user1)
  );
}

export async function createMarriage(
  user1: string,
  user2: string,
) {
  await db.insert(marriagesTable).values({
    user1,
    user2,
  });
}

export async function deleteMarriage(
  userId: string,
) {
  const marriage = await getMarriage(userId);

  if (!marriage) return false;

  await db
    .delete(marriagesTable)
    .where(eq(marriagesTable.id, marriage.id));

  return true;
}

export async function addLovePoints(
  userId: string,
  amount: number,
) {
  const marriage = await getMarriage(userId);

  if (!marriage) return;

  await db
    .update(marriagesTable)
    .set({
      lovePoints: marriage.lovePoints + amount,
    })
    .where(eq(marriagesTable.id, marriage.id));
}

export async function addHug(
  userId: string,
) {
  const marriage = await getMarriage(userId);

  if (!marriage) return;

  await db
    .update(marriagesTable)
    .set({
      hugs: marriage.hugs + 1,
      lovePoints: marriage.lovePoints + 2,
    })
    .where(eq(marriagesTable.id, marriage.id));
}

export async function addKiss(
  userId: string,
) {
  const marriage = await getMarriage(userId);

  if (!marriage) return;

  await db
    .update(marriagesTable)
    .set({
      kisses: marriage.kisses + 1,
      lovePoints: marriage.lovePoints + 5,
    })
    .where(eq(marriagesTable.id, marriage.id));
}

export async function addCuddle(
  userId: string,
) {
  const marriage = await getMarriage(userId);

  if (!marriage) return;

  await db
    .update(marriagesTable)
    .set({
      cuddles: marriage.cuddles + 1,
      lovePoints: marriage.lovePoints + 3,
    })
    .where(eq(marriagesTable.id, marriage.id));
}

export async function addGift(
  userId: string,
) {
  const marriage = await getMarriage(userId);

  if (!marriage) return;

  await db
    .update(marriagesTable)
    .set({
      gifts: marriage.gifts + 1,
      lovePoints: marriage.lovePoints + 10,
    })
    .where(eq(marriagesTable.id, marriage.id));
}