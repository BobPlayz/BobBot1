export type ActionType = "slap" | "bite" | "pinch" | "kill";
export type Mood = "playful" | "mean";

const moodMap: Record<ActionType, Record<Mood, { api: "nekos" | "waifu"; endpoint: string }>> = {
  slap:  { playful: { api: "nekos", endpoint: "pat"    }, mean: { api: "nekos", endpoint: "slap"  } },
  bite:  { playful: { api: "nekos", endpoint: "nom"    }, mean: { api: "nekos", endpoint: "bite"  } },
  pinch: { playful: { api: "nekos", endpoint: "tickle" }, mean: { api: "nekos", endpoint: "kick"  } },
  kill:  { playful: { api: "nekos", endpoint: "poke"   }, mean: { api: "waifu", endpoint: "kill"  } },
};

interface NekosResult { results: Array<{ anime_name: string; url: string }>; }
interface WaifuResult { url: string; }

export async function fetchAnimeGif(
  action: ActionType,
  mood: Mood,
): Promise<{ url: string; animeName: string; endpoint: string }> {
  const { api, endpoint } = moodMap[action][mood];

  if (api === "waifu") {
    const res  = await fetch(`https://api.waifu.pics/sfw/${endpoint}`);
    const data = (await res.json()) as WaifuResult;
    return { url: data.url, animeName: "Unknown Anime", endpoint };
  }

  const res  = await fetch(`https://nekos.best/api/v2/${endpoint}`);
  const data = (await res.json()) as NekosResult;
  const result = data.results[0];
  return { url: result.url, animeName: result.anime_name ?? "Unknown Anime", endpoint };
}

const MEAN_KEYWORDS = [
  "hate", "idiot", "stupid", "dumb", "shut up", "stfu", "ugly", "die",
  "worst", "terrible", "awful", "mad", "angry", "annoying", "stop it",
  "wtf", "trash", "loser", "pathetic", "cringe",
];
const PLAYFUL_KEYWORDS = [
  "lol", "lmao", "haha", "hehe", "xd", "xDD", "nice", "love", "uwu",
  "owo", "cute", "fun", "pog", "gg", "yay", "omg", "wow", "based",
  "friend", "buddy", "bro", "sis", "bestie", "fr fr", "slay",
];

export function detectMood(
  messages: Array<{ authorId: string; content: string }>,
  userId: string,
  targetId: string,
): Mood {
  const relevant = messages.filter((m) => m.authorId === userId || m.authorId === targetId);
  if (relevant.length === 0) return Math.random() > 0.5 ? "playful" : "mean";

  const combined = relevant.map((m) => m.content.toLowerCase()).join(" ");
  let meanScore = 0, playfulScore = 0;
  for (const kw of MEAN_KEYWORDS)    if (combined.includes(kw)) meanScore++;
  for (const kw of PLAYFUL_KEYWORDS) if (combined.includes(kw)) playfulScore++;

  return meanScore > playfulScore ? "mean" : "playful";
}

export const actionColors: Record<ActionType, Record<Mood, number>> = {
  slap:  { playful: 0xffb3c6, mean: 0xff2222 },
  bite:  { playful: 0xffcc80, mean: 0xff6600 },
  pinch: { playful: 0xffe066, mean: 0xdd8800 },
  kill:  { playful: 0xb3e5fc, mean: 0x880000 },
};

export const actionLabels: Record<ActionType, Record<Mood, string>> = {
  slap:  { playful: "gently patted", mean: "slapped"      },
  bite:  { playful: "nommed on",     mean: "bit"           },
  pinch: { playful: "tickled",       mean: "kicked"        },
  kill:  { playful: "poked",         mean: "obliterated"   },
};

export const moodFooter: Record<Mood, string> = {
  playful: "✨ Looks like things are friendly between them~",
  mean:    "💢 The tension in this chat is REAL.",
};
