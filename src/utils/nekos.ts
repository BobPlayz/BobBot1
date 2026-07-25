export type ActionType = "slap" | "bite" | "pinch" | "kill";
export type Mood = "playful" | "mean";

const moodMap: Record<ActionType, Record<Mood, { api: "nekos" | "waifu"; endpoint: string }>> = {
  slap: {
    playful: { api: "nekos", endpoint: "pat" },
    mean: { api: "nekos", endpoint: "slap" },
  },
  bite: {
    playful: { api: "nekos", endpoint: "nom" },
    mean: { api: "nekos", endpoint: "bite" },
  },
  pinch: {
    playful: { api: "nekos", endpoint: "tickle" },
    mean: { api: "nekos", endpoint: "kick" },
  },
  kill: {
    playful: { api: "nekos", endpoint: "poke" },
    mean: { api: "waifu", endpoint: "kill" },
  },
};

export const actionColors = {
  slap: {
    playful: 0x57f287,
    mean: 0xed4245,
  },
  bite: {
    playful: 0x5865f2,
    mean: 0xed4245,
  },
  pinch: {
    playful: 0xfaa61a,
    mean: 0xed4245,
  },
  kill: {
    playful: 0xfee75c,
    mean: 0x2b2d31,
  },
};

export const actionLabels = {
  slap: {
    playful: "playfully slapped",
    mean: "slapped",
  },
  bite: {
    playful: "playfully bit",
    mean: "bit",
  },
  pinch: {
    playful: "playfully pinched",
    mean: "pinched",
  },
  kill: {
    playful: "pretended to eliminate",
    mean: "eliminated",
  },
};

export const moodFooter = {
  playful: "Playful mood detected",
  mean: "Chaotic mood detected",
};

export function detectMood(
  messages: Array<{ authorId: string; content: string }>,
  actorId: string,
  targetId: string,
): Mood {
  let score = 0;

  for (const msg of messages) {
    if (msg.authorId !== actorId && msg.authorId !== targetId) continue;

    const text = msg.content.toLowerCase();

    if (/(lol|lmao|😂|🤣|❤️|💀|bro|xd|hehe|haha)/.test(text)) score++;
    if (/(idiot|stupid|hate|kill|die|fuck|bitch|loser)/.test(text)) score--;
  }

  return score >= 0 ? "playful" : "mean";
}

interface NekosResult {
  results: Array<{
    anime_name: string;
    url: string;
  }>;
}

interface WaifuResult {
  url: string;
}

export async function fetchAnimeGif(
  action: ActionType,
  mood: Mood,
): Promise<{ url: string; animeName: string; endpoint: string }> {
  const { api, endpoint } = moodMap[action][mood];

  const url =
    api === "waifu"
      ? `https://api.waifu.pics/sfw/${endpoint}`
      : `https://nekos.best/api/v2/${endpoint}`;

  const res = await fetch(url);

 if (!res.ok) {
  const body = await res.text();

  throw new Error(
    `API ${res.status}\nURL: ${url}\nResponse:\n${body}`
  );
}

  const text = await res.text();

  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON returned:\n${text.substring(0, 200)}`);
  }

  if (api === "waifu") {
    return {
      url: data.url,
      animeName: "Unknown Anime",
      endpoint,
    };
  }

  if (!data.results?.length) {
    throw new Error("No GIF returned.");
  }

  return {
    url: data.results[0].url,
    animeName: data.results[0].anime_name ?? "Unknown Anime",
    endpoint,
  };
}