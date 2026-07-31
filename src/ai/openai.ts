import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AskAIOptions = {
  prompt: string;
  serverId?: string | null;
  userId: string;
};

export async function askAI({
  prompt,
  serverId,
  userId,
}: AskAIOptions): Promise<string> {
  const response = await client.responses.create({
    model: "gpt-5",
    input: [
      {
        role: "system",
        content:
          "You are BobBot, a Discord AI assistant. Be helpful, concise, and natural. You can later be customized per server and per user.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    metadata: {
      serverId: serverId ?? "dm",
      userId,
    },
  });

  return (
    response.output_text ||
    "my brain lagged for a sec 😭"
  );
}