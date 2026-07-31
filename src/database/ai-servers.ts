import { db, aiServersTable } from "../db.js";
import { eq } from "drizzle-orm";

export async function getAIServer(
  guildId: string,
) {
  const [server] = await db
    .select()
    .from(aiServersTable)
    .where(eq(aiServersTable.guildId, guildId));

  if (server) return server;

  const [created] = await db
    .insert(aiServersTable)
    .values({ guildId })
    .returning();

  return created;
}

export async function getServerMemory(
  guildId: string,
): Promise<string> {
  const server = await getAIServer(guildId);
  return server.memory;
}

export async function setServerMemory(
  guildId: string,
  memory: string,
): Promise<void> {
  await getAIServer(guildId);

  await db
    .update(aiServersTable)
    .set({ memory })
    .where(eq(aiServersTable.guildId, guildId));
}

export async function appendServerMemory(
  guildId: string,
  fact: string,
): Promise<string> {
  const server = await getAIServer(guildId);

  const memory = server.memory.trim();
  const updated = memory
    ? `${memory}\n- ${fact}`
    : `- ${fact}`;

  await setServerMemory(guildId, updated);

  return updated;
}