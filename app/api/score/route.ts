import { resolvePostsForHandle } from "@/lib/providers";
import { normalizeHandle } from "@/lib/providers/types";
import { scoreSlopVibes } from "@/lib/scoring/heuristic";
import { NextResponse } from "next/server";

type Body = {
  handle?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Send JSON with a `handle` string." },
      { status: 400 },
    );
  }

  const handle =
    typeof body.handle === "string" ? body.handle.trim() : "";

  const fetchResult = await resolvePostsForHandle(handle);
  if (!fetchResult.ok) {
    return NextResponse.json(
      { error: fetchResult.error },
      { status: 400 },
    );
  }

  const scored = scoreSlopVibes({
    handle: normalizeHandle(handle),
    posts: fetchResult.posts,
    meta: fetchResult.meta,
  });

  // TEMP: local debugging — remove before shipping
  console.log(JSON.stringify(scored, null, 2));

  return NextResponse.json(scored);
}
