"use client";

import { useCallback, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HandleForm } from "@/components/handle-form";
import { ResultCard } from "@/components/result-card";
import { StateMessage } from "@/components/state-message";
import { Skeleton } from "@/components/ui/skeleton";
import type { SlopScoreResult } from "@/lib/scoring/types";

type ApiError = { error: string };

function isSlopScoreResult(data: unknown): data is SlopScoreResult {
  if (typeof data !== "object" || data === null || "error" in data) {
    return false;
  }
  const scores = (data as { scores?: unknown }).scores;
  if (typeof scores !== "object" || scores === null) return false;
  const s = scores as Record<string, unknown>;
  const d = data as Record<string, unknown>;
  return (
    typeof s.openAI === "number" &&
    typeof s.anthropic === "number" &&
    typeof s.tossUp === "number" &&
    typeof d.aiRelevantPct === "number"
  );
}

export function SlopHome() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SlopScoreResult | null>(null);
  /** Bumps when a new score payload is applied so ResultCard remounts and clears Referee UI. */
  const [resultGen, setResultGen] = useState(0);
  const [touched, setTouched] = useState(false);

  const runScore = useCallback(async (raw: string) => {
    const h = raw.trim().replace(/^@+/, "");
    if (!h) {
      setError("Enter a public X username.");
      setResult(null);
      return;
    }
    setTouched(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: h }),
      });
      const data: unknown = await res.json();
      if (!res.ok || (typeof data === "object" && data !== null && "error" in data)) {
        setResult(null);
        setError(
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as ApiError).error === "string"
            ? (data as ApiError).error
            : "Something went wrong. Try again.",
        );
        return;
      }
      if (!isSlopScoreResult(data)) {
        setResult(null);
        setError("Unexpected response from server. Try again.");
        return;
      }
      setResult(data);
      setResultGen((n) => n + 1);
    } catch {
      setResult(null);
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Slop Sentiment Score
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Political compass for the timeline.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <HandleForm
          value={handle}
          onChange={setHandle}
          disabled={loading}
          onSubmit={() => runScore(handle)}
        />

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Well, that slopped</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4">
            <Skeleton className="h-8 w-3/4 max-w-md mx-auto" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : null}

        {!loading && result ? (
          <ResultCard key={resultGen} result={result} />
        ) : null}

        {!loading &&
        !result &&
        !error &&
        !touched ? (
          <StateMessage
            title="Pick a profile"
            description="Enter a handle above."
          />
        ) : null}
      </main>

      <footer className="mt-auto border-t border-border/50 px-4 py-4 text-center text-[0.7rem] text-muted-foreground">
        Ethan Frost 2026
      </footer>
    </div>
  );
}
