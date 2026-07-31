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
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
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
    const text = await res.text();
    throw new Error(text);
  }

  const data = await res.json();

  return (
    data.choices?.[0]?.message?.content ??
    "my brain lagged for a sec 😭"
  );
}