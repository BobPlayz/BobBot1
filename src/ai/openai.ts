const API = "https://openrouter.ai/api/v1/chat/completions";

type AskAIOptions = {
  prompt: string;
  serverId?: string | null;
  userId: string;
};

export async function askAI({
  prompt,
}: AskAIOptions): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) throw new Error("OPENROUTER_API_KEY is not set.");

  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bobbot.local",
      "X-Title": "BobBot",
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content:
            "You are BobBot, a Discord AI assistant. Be helpful, concise, natural, and a little Gen Z when appropriate.",
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