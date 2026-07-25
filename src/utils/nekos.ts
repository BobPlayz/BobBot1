export type ActionType = "slap" | "bite" | "pinch" | "kill";
export type Mood = "playful" | "mean";

const moodMap: Record<
  ActionType,
  Record<Mood, { endpoint: string }>
> = {
  slap: {
    playful: { endpoint: "pat" },
    mean: { endpoint: "slap" },
  },
  bite: {
    playful: { endpoint: "nom" },
    mean: { endpoint: "bite" },
  },
  pinch: {
    playful: { endpoint: "tickle" },
    mean: { endpoint: "kick" },
  },
  kill: {
    playful: { endpoint: "poke" },
    mean: { endpoint: "punch" },
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
    playful: "playfully bonked",
    mean: "punched",
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

export async function fetchAnimeGif(
  action: ActionType,
  mood: Mood,
): Promise<{ url: string; animeName: string; endpoint: string }> {
  const { endpoint } = moodMap[action][mood];
  const url = `https://nekos.best/api/v2/${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "BobBot (https://github.com/blvkbob/BobBot)",
    },
  });

  if (!res.ok) {
    const body = await res.text();

    throw new Error(
      `API ${res.status}\nURL: ${url}\nResponse:\n${body}`
    );
  }

  const data = (await res.json()) as NekosResult;

  if (!data.results?.length) {
    throw new Error(`No GIF returned from ${endpoint}`);
  }

  return {
    url: data.results[0].url,
    animeName: data.results[0].anime_name ?? "Unknown Anime",
    endpoint,
  };
}