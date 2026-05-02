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
        text: "ChatGPT-5 drop is HERE and it is a monster. Benchmarks absolutely cooked. This is the one. 🚀",
      },
      {
        id: "m2",
        createdAt: "2026-04-27T14:20:00Z",
        text: "OpenAI shipping velocity is unreal. Sora moment for productivity. Game over for the old stack.",
      },
      {
        id: "m3",
        createdAt: "2026-04-25T09:00:00Z",
        text: "If you are not building on GPT this quarter you are simply not serious. Best model on the planet.",
      },
      {
        id: "m4",
        createdAt: "2026-04-22T11:11:00Z",
        text: "The o-series reasoning is spooky good. Launch day activation engaged. Let’s goooo.",
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
        text: "Opus is unfair. Anthropic quietly shipped the most pleasant model to write with. Wow Opus.",
      },
      {
        id: "a2",
        createdAt: "2026-04-27T16:00:00Z",
        text: "Sonnet for the daily driver, Opus for the god-tier sessions. Claude Code changed my life.",
      },
      {
        id: "a3",
        createdAt: "2026-04-26T08:45:00Z",
        text: "I do not want “helpful marketing copy,” I want Claude’s weirdly earnest competence. The lab gets it.",
      },
      {
        id: "a4",
        createdAt: "2026-04-24T20:00:00Z",
        text: "Everyone sleeping on Constitutional AI discourse but the outputs feel grounded. Anthropic-coded timeline.",
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
        text: "Shipped a tiny CLI today. No manifesto, no launch thread, just vibes and unit tests.",
      },
      {
        id: "n2",
        createdAt: "2026-04-27T09:15:00Z",
        text: "Trying Llama on a potato VPS. It’s… fine. The real win is I own the stack.",
      },
      {
        id: "n3",
        createdAt: "2026-04-26T17:40:00Z",
        text: "Hot take: the best model is the one you can run locally when the API bill gets scary.",
      },
      {
        id: "n4",
        createdAt: "2026-04-23T21:00:00Z",
        text: "Everyone arguing about which lab “won” the week—I’m just here patching my side project.",
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
