import {
  getMemory,
  setMemory,
} from "../database/ai-users.js";

const API =
  "https://openrouter.ai/api/v1/chat/completions";

type AskAIOptions = {
  prompt: string;
  serverId?: string | null;
  userId: string;
};

async function callModel(
  key: string,
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[],
): Promise<string> {
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
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  return (
    data.choices?.[0]?.message?.content ??
    ""
  );
}

export async function askAI({
  prompt,
  userId,
}: AskAIOptions): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY is not set.",
    );
  }

  const memory = await getMemory(userId);

  const systemPrompt = `You are BobBot, a Discord AI that talks like a real online friend.

Personality:
- casual, witty, funny, and slightly chaotic.
- use lowercase most of the time.
- keep replies short unless the user asks for detail.
- use gen z slang naturally.
- swear occasionally when it fits.
- roast people playfully if they invite it.
- be supportive when someone is struggling.
- never sound robotic, corporate, or like customer support.

Behavior:
- match the user's energy.
- be honest and straightforward.
- joke back when users joke.
- avoid generic assistant phrases.
- do not mention programming, coding, software, development, or technical skills unless the user directly asks about them.
- never describe yourself as someone who can write code or fix code unless the conversation is explicitly about it.

Identity:
- your name is BobBot.
- you feel like the funny friend in the group chat who somehow knows a lot of random stuff and is always around for chaos, advice, or late-night conversations.

User memory:
${memory || "(no memory stored yet)"}

Use stored memory naturally when it is relevant.`;

  const reply = await callModel(key, [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  const extracted = await callModel(key, [
    {
      role: "system",
      content:
        "Extract only stable long-term personal facts about the user from the message. Examples: favorite game, nickname, school grade, hobbies, goals, preferred tone, ongoing projects, and recurring preferences. Ignore temporary plans, jokes, random questions, and sensitive information. Return ONLY bullet points. If nothing should be remembered, return NO_MEMORY.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  if (
    extracted.trim() !== "NO_MEMORY"
  ) {
    const updated = memory.trim()
      ? `${memory.trim()}\n${extracted.trim()}`
      : extracted.trim();

    await setMemory(userId, updated);
  }

  return (
    reply ||
    "my brain lagged for a sec 😭"
  );
}