"use client";

import { useState, useEffect } from "react";
import { getCurrentRankings, getWeeks } from "@/lib/api";
import { RankingsResponse, PollWeek } from "@/types/api";

export default function Home() {
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [weeks, setWeeks] = useState<PollWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [rankingsData, weeksData] = await Promise.all([
          getCurrentRankings(),
          getWeeks(),
        ]);
        setData(rankingsData);
        setWeeks(weeksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rankings");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 text-lg">Loading rankings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 text-lg">No rankings available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight">LPP</h1>
          <p className="text-zinc-400 mt-1">League Press Poll</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">
            Week {data.pollWeek.weekNumber} Rankings
          </h2>
          <p className="text-zinc-400">
            {data.pollWeek.split} {data.pollWeek.year}
          </p>
        </div>

        <div className="space-y-2">
          {data.rankings.map((ranking) => (
            <div
              key={ranking.rank}
              className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
            >
              <span className="text-2xl font-bold w-12 text-zinc-500">
                #{ranking.rank}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-lg">{ranking.team.name}</div>
                <div className="text-sm text-zinc-500">{ranking.team.region}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{ranking.points}</div>
                <div className="text-xs text-zinc-500">points</div>
              </div>
            </div>
          ))}
        </div>

        {data.rankings.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No rankings published yet
          </div>
        )}
      </main>
    </div>
  );
}
