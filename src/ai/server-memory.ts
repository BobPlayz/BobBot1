import { getServerMemory, setServerMemory } from "../database/ai-servers.js";

const API =
  "https://openrouter.ai/api/v1/chat/completions";

const buffers = new Map<string, string[]>();
const timers = new Map<string, NodeJS.Timeout>();

export function observeServerMessage(
  guildId: string,
  author: string,
  content: string,
) {
  if (!content.trim()) return;

  const buffer = buffers.get(guildId) ?? [];
  buffer.push(`${author}: ${content}`);

  if (buffer.length > 40) buffer.shift();

  buffers.set(guildId, buffer);

  const existing = timers.get(guildId);

  if (existing) clearTimeout(existing);

  timers.set(
    guildId,
    setTimeout(
      () => extractServerMemory(guildId),
      10 * 1000
    ),
  );
}

async function extractServerMemory(
  guildId: string,
) {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) return;

  const buffer = buffers.get(guildId);

  if (!buffer || buffer.length === 0) return;

  const current = await getServerMemory(guildId);

  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        "https://bobbot.local",
      "X-Title": "BobBot",
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content:
            "Extract only long-term server facts worth remembering. Examples: inside jokes, nicknames, ongoing projects, server lore, recurring events, named places, community rules, and important relationships. Ignore temporary chat, spam, greetings, and random conversation. Return ONLY bullet points. If nothing is worth remembering, return NO_MEMORY.",
        },
        {
          role: "user",
          content: buffer.join("\n"),
        },
      ],
    }),
  });

  if (!res.ok) return;

  const data = await res.json();

  const extracted =
    data.choices?.[0]?.message?.content?.trim() ??
    "NO_MEMORY";

  if (extracted !== "NO_MEMORY") {
    const updated = current.trim()
      ? `${current.trim()}\n${extracted}`
      : extracted;

    await setServerMemory(guildId, updated);
  }

  buffers.set(guildId, []);
}