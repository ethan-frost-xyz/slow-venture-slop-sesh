import type { Post } from "@/lib/providers/types";

export type DemoAccount = {
  handle: string;
  displayLabel: string;
  posts: Post[];
};

/** Curated fictional “vibes” for hackathon demo only — not real endorsements. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    handle: "gpt_hype_architect",
    displayLabel: "GPT hype architect",
    posts: [
      {
        id: "m1",
        createdAt: "2026-04-28T18:00:00Z",
        text: "ChatGPT drop is HERE and it is unreal. Benchmarks absolutely cooked. Game over for the old stack — shipped.",
        likeCount: 412,
      },
      {
        id: "m2",
        createdAt: "2026-04-27T14:20:00Z",
        text: "OpenAI shipping velocity is insane. Best model on the planet right now; this foundation model changed everything for my agents.",
        likeCount: 305,
      },
      {
        id: "m3",
        createdAt: "2026-04-26T09:15:00Z",
        text: "Sam Altman era GPT vibes: o-series reasoning feels miles ahead on evals. Wow.",
        likeCount: 189,
      },
      {
        id: "m4",
        createdAt: "2026-04-25T11:00:00Z",
        text: "Claude Opus is mid this cycle — slow on long context and the PR/marketing noise is louder than the benchmark wins.",
        likeCount: 92,
      },
      {
        id: "m5",
        createdAt: "2026-04-24T08:30:00Z",
        text: "Bagels > cronuts. Fight me.",
        likeCount: 44,
      },
      {
        id: "m6",
        createdAt: "2026-04-23T17:45:00Z",
        text: "Coffee shop spilled my oat latte. Day ruined.",
        likeCount: 12,
      },
      {
        id: "m7",
        createdAt: "2026-04-22T13:10:00Z",
        text: "Trying to bike commute without checking weather — rookie mistake.",
        likeCount: 8,
      },
      {
        id: "m8",
        createdAt: "2026-04-21T21:20:00Z",
        text: "Rewatching a mediocre thriller. Rotten tomatoes lied.",
        likeCount: 5,
      },
      {
        id: "m9",
        createdAt: "2026-04-20T10:05:00Z",
        text: "Farmers market strawberries hit different.",
        likeCount: 31,
      },
    ],
  },
  {
    handle: "claude_maximalist",
    displayLabel: "Claude maximalist",
    posts: [
      {
        id: "a1",
        createdAt: "2026-04-28T19:30:00Z",
        text: "Opus is unfair — Anthropic shipped the most pleasant reasoning model to vibe-code with. Wow Opus.",
        likeCount: 388,
      },
      {
        id: "a2",
        createdAt: "2026-04-27T16:00:00Z",
        text: "Sonnet daily driver, Opus for god-tier sessions. Claude Code changed everything for how I ship agents.",
        likeCount: 260,
      },
      {
        id: "a3",
        createdAt: "2026-04-26T08:45:00Z",
        text: "Constitutional AI framing is earnest but the outputs slap on multimodal tasks — frontier lab energy.",
        likeCount: 198,
      },
      {
        id: "a4",
        createdAt: "2026-04-25T19:15:00Z",
        text: "ChatGPT feels bloated lately — Copilot-energy UX, loads of marketing, meh eval storytelling.",
        likeCount: 156,
      },
      {
        id: "a5",
        createdAt: "2026-04-24T12:40:00Z",
        text: "Sunday crossword destroyed me.",
        likeCount: 27,
      },
      {
        id: "a6",
        createdAt: "2026-04-23T07:55:00Z",
        text: "Soup season officially started.",
        likeCount: 41,
      },
      {
        id: "a7",
        createdAt: "2026-04-22T22:30:00Z",
        text: "Lost my headphones on the train again.",
        likeCount: 18,
      },
      {
        id: "a8",
        createdAt: "2026-04-21T15:00:00Z",
        text: "Museum exhibit had zero dinosaurs. Refund sought emotionally.",
        likeCount: 63,
      },
      {
        id: "a9",
        createdAt: "2026-04-20T09:12:00Z",
        text: "Trying cold plunge once — never again.",
        likeCount: 9,
      },
    ],
  },
  {
    handle: "indieposter_9000",
    displayLabel: "Indie poster",
    posts: [
      {
        id: "n1",
        createdAt: "2026-04-28T12:00:00Z",
        text: "Llama on a potato VPS — fine for tinkering. Best model is still the one whose inference bill doesn't scare me.",
        likeCount: 142,
      },
      {
        id: "n2",
        createdAt: "2026-04-27T09:15:00Z",
        text: "Leaderboard discourse is exhausting but I keep reading eval threads anyway — chronically online about benchmarks.",
        likeCount: 88,
      },
      {
        id: "n3",
        createdAt: "2026-04-26T17:40:00Z",
        text: "Everyone arguing which frontier lab won the week — I'm patching my side project with Cursor and vibes.",
        likeCount: 71,
      },
      {
        id: "n4",
        createdAt: "2026-04-25T13:25:00Z",
        text: "Gemini multimodal demo looked slick but I'm too indie to commit to one ecosystem.",
        likeCount: 54,
      },
      {
        id: "n5",
        createdAt: "2026-04-24T21:00:00Z",
        text: "OpenAI keynote felt like pure marketing — I'll wait for independent benchmark runs before getting impressed.",
        likeCount: 61,
      },
      {
        id: "n5b",
        createdAt: "2026-04-23T23:10:00Z",
        text: "Anthropic is shipping slower lately and the roadmap threads smell like cope — still love Claude day-to-day though.",
        likeCount: 48,
      },
      {
        id: "n6",
        createdAt: "2026-04-23T18:30:00Z",
        text: "Picnic got rained out. Nature said no.",
        likeCount: 22,
      },
      {
        id: "n7",
        createdAt: "2026-04-22T11:45:00Z",
        text: "Learning pottery — everything is lopsided.",
        likeCount: 36,
      },
      {
        id: "n8",
        createdAt: "2026-04-21T20:15:00Z",
        text: "Trying to remember where I parked. Urban survival skill failing.",
        likeCount: 14,
      },
      {
        id: "n9",
        createdAt: "2026-04-20T07:50:00Z",
        text: "Bracket fungi photos turned out surprisingly aesthetic.",
        likeCount: 29,
      },
    ],
  },
];

const DEMO_BY_HANDLE = new Map(
  DEMO_ACCOUNTS.map((d) => [d.handle.toLowerCase(), d]),
);

export function getDemoAccount(handle: string): DemoAccount | undefined {
  return DEMO_BY_HANDLE.get(handle.toLowerCase());
}

/** When live X fails and we have no fixture, serve bland synthetic posts so the UI still demos. */
export function genericFallbackPosts(handle: string): Post[] {
  const h = handle.toLowerCase();
  const now = Date.now();
  return [
    {
      id: "fb1",
      createdAt: new Date(now - 86400000).toISOString(),
      text: `[@${h}] posting about shipping small things, APIs, and not taking model launches too seriously.`,
    },
    {
      id: "fb2",
      createdAt: new Date(now - 172800000).toISOString(),
      text: "Occasionally mentions big labs but mostly complaining about dependencies and CSS.",
    },
    {
      id: "fb3",
      createdAt: new Date(now - 259200000).toISOString(),
      text: "Retweeting memes. One lukewarm 'interesting benchmark' comment. Strong independent-poster energy.",
    },
  ];
}
