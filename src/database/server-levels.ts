import { eq, and } from "drizzle-orm";

import { db } from "../db.js";
import { serverLevelsTable } from "../schema/server-levels.js";
import { XP_COOLDOWN } from "../config/leveling.js";

const xpCooldown = new Map<string, number>();

export async function getServerLevel(
  guildId: string,
  userId: string,
) {
  const result =
    await db.query.serverLevelsTable.findFirst({
      where: and(
        eq(serverLevelsTable.guildId, guildId),
        eq(serverLevelsTable.userId, userId),
      ),
    });

  return result ?? null;
}

export async function createServerLevel(
  guildId: string,
  userId: string,
) {
  await db.insert(serverLevelsTable).values({
    guildId,
    userId,
  });
}

export async function getOrCreateServerLevel(
  guildId: string,
  userId: string,
) {
  let profile = await getServerLevel(
    guildId,
    userId,
  );

  if (!profile) {
    await createServerLevel(
      guildId,
      userId,
    );

    profile = await getServerLevel(
      guildId,
      userId,
    );
  }

  return profile!;
}

export async function addXP(
  guildId: string,
  userId: string,
  amount: number,
) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();

  const lastXP = xpCooldown.get(key);

  if (lastXP && now - lastXP < XP_COOLDOWN) {
    const profile = await getOrCreateServerLevel(
      guildId,
      userId,
    );

    return {
      oldLevel: profile.level,
      newLevel: profile.level,
      xp: profile.xp,
      levelUp: false,
      awarded: false,
    };
  }

  xpCooldown.set(key, now);

  const profile =
    await getOrCreateServerLevel(
      guildId,
      userId,
    );

  let xp = profile.xp + amount;
  let level = profile.level;

  while (xp >= (level + 1) * 100) {
    xp -= (level + 1) * 100;
    level++;
  }

  await db
    .update(serverLevelsTable)
    .set({
      xp,
      level,
      messages: profile.messages + 1,
    })
    .where(
      and(
        eq(serverLevelsTable.guildId, guildId),
        eq(serverLevelsTable.userId, userId),
      ),
    );

  return {
    oldLevel: profile.level,
    newLevel: level,
    xp,
    levelUp: level > profile.level,
    awarded: true,
  };
}