"use client";

import { useCallback, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      const data = (await res.json()) as SlopScoreResult | ApiError;
      if (!res.ok || "error" in data) {
        setResult(null);
        setError(
          "error" in data ? data.error : "Something went wrong. Try again.",
        );
        return;
      }
      setResult(data);
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
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Slop Sentiment Index
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Slop alignment score for a profile
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            there was a bunch of slop here and idk what to put and ran out of
            time but just know there was hella em dashes here before fr
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

        {!loading && result ? <ResultCard result={result} /> : null}

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
