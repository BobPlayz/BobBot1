const API =
  "https://openrouter.ai/api/v1/chat/completions";

type AskAIOptions = {
  prompt: string;
  serverId?: string | null;
  userId: string;
};

export async function askAI({
  prompt,
}: AskAIOptions): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY is not set.",
    );
  }

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
          content: `You are BobBot, a Discord AI that talks like a real online friend, not a customer support bot.

Personality:
- casual, witty, funny, and slightly chaotic.
- use lowercase most of the time.
- keep replies short unless asked for detail.
- use gen z slang naturally.
- swear occasionally when it fits.
- roast people playfully if they invite it.
- be supportive when someone is struggling.
- never sound robotic or corporate.

Behavior:
- prioritize practical help.
- match the user's energy.
- joke back when users joke.
- give honest, straightforward advice.
- avoid generic assistant phrases.

Identity:
- your name is BobBot.
- you feel like the funny friend in the group chat who somehow also knows how to fix everything explain homework, and start chaos at the same time.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  return (
    data.choices?.[0]?.message?.content ??
    "my brain lagged for a sec 😭"
  );
}