import { db, aiUsersTable } from "../db.js";
import { eq } from "drizzle-orm";

export async function getAIUser(
  discordId: string,
) {
  const [user] = await db
    .select()
    .from(aiUsersTable)
    .where(eq(aiUsersTable.discordId, discordId));

  if (user) return user;

  const [created] = await db
    .insert(aiUsersTable)
    .values({ discordId })
    .returning();

  return created;
}

export async function getMemory(
  discordId: string,
): Promise<string> {
  const user = await getAIUser(discordId);
  return user.memory;
}

export async function setMemory(
  discordId: string,
  memory: string,
): Promise<void> {
  await getAIUser(discordId);

  await db
    .update(aiUsersTable)
    .set({ memory })
    .where(eq(aiUsersTable.discordId, discordId));
}

export async function appendMemory(
  discordId: string,
  fact: string,
): Promise<string> {
  const user = await getAIUser(discordId);

  const memory = user.memory.trim();
  const updated = memory
    ? `${memory}\n- ${fact}`
    : `- ${fact}`;

  await setMemory(discordId, updated);

  return updated;
}