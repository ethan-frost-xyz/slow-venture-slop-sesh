"use client";

import { useCallback, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExamplesRow } from "@/components/examples-row";
import { HandleForm } from "@/components/handle-form";
import { ResultCard } from "@/components/result-card";
import { StateMessage } from "@/components/state-message";
import { Skeleton } from "@/components/ui/skeleton";
import type { SlopScoreResult } from "@/lib/scoring/types";

type ApiError = { error: string };

export function SlopHome() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SlopScoreResult | null>(null);
  const [touched, setTouched] = useState(false);

  const runScore = useCallback(async (raw: string) => {
    const h = raw.trim().replace(/^@+/, "");
    if (!h) {
      setError("Enter a handle—or tap a demo account.");
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
      const data = (await res.json()) as SlopScoreResult | ApiError;
      if (!res.ok || "error" in data) {
        setResult(null);
        setError(
          "error" in data ? data.error : "Something went wrong. Try a demo.",
        );
        return;
      }
      setResult(data);
    } catch {
      setResult(null);
      setError("Network hiccup. Demos still work offline.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border/60 bg-card/40 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Slop Sentiment Index
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            How{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-orange-500 bg-clip-text text-transparent">
              lab-coded
            </span>{" "}
            is your timeline?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Enter a public X handle. We score{" "}
            <strong>posting-style similarity</strong> to OpenAI-coded vs
            Anthropic-coded hype—not employment, bribery, or sponsorship.
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

        <ExamplesRow
          disabled={loading}
          onPick={(h) => {
            setHandle(h);
            void runScore(h);
          }}
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

        {!loading && result ? <ResultCard result={result} /> : null}

        {!loading &&
        !result &&
        !error &&
        !touched ? (
          <StateMessage
            title="Waiting for your first specimen"
            description="Try @gpt_hype_architect, @claude_maximalist, or @indieposter_9000 — or roll your own handle and we’ll mock it if X is being X."
          />
        ) : null}
      </main>

      <footer className="mt-auto border-t border-border/50 px-4 py-4 text-center text-[0.7rem] text-muted-foreground">
        Hackathon MVP · Live posts optional via{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">
          SLOP_TRY_LIVE_X=1
        </code>{" "}
        +{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">
          X_BEARER_TOKEN
        </code>
      </footer>
    </div>
  );
}
