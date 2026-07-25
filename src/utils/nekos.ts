export type ActionType = "slap" | "bite" | "pinch" | "kill";
export type Mood = "playful" | "mean";

const moodMap: Record<
  ActionType,
  Record<Mood, { api: "nekos" | "waifu"; endpoint: string }>
> = {
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

export const actionColors: Record<ActionType, number> = {
  slap: 0xff4d6d,
  bite: 0xff8fab,
  pinch: 0xffc300,
  kill: 0x8b0000,
};

export const actionLabels: Record<ActionType, string> = {
  slap: "slapped",
  bite: "bit",
  pinch: "pinched",
  kill: "killed",
};

export function moodFooter(mood: Mood): string {
  return mood === "playful"
    ? "😊 Playful mood detected"
    : "😈 Mean mood detected";
}

export function detectMood(messages: Array<{ authorId: string; content: string }>): Mood {
  const meanWords = [
    "hate",
    "idiot",
    "stupid",
    "loser",
    "kill",
    "die",
    "trash",
    "dumb",
    "shut up",
    "fk",
    "fuck",
    "bitch",
  ];

  let score = 0;

  for (const msg of messages) {
    const text = msg.content.toLowerCase();

    if (meanWords.some((w) => text.includes(w))) {
      score++;
    }
  }

  return score >= 2 ? "mean" : "playful";
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
    throw new Error(`API returned ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid JSON returned from ${url}\n${text.substring(0, 200)}`
    );
  }

  if (api === "waifu") {
    if (!data.url) {
      throw new Error("waifu.pics did not return a GIF URL.");
    }

    return {
      url: data.url,
      animeName: "Unknown Anime",
      endpoint,
    };
  }

  if (!data.results || data.results.length === 0) {
    throw new Error("nekos.best returned no GIFs.");
  }

  return {
    url: data.results[0].url,
    animeName: data.results[0].anime_name ?? "Unknown Anime",
    endpoint,
  };
}