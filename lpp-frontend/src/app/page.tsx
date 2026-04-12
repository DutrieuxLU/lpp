"use client";

import { useState, useEffect } from "react";
import { getCurrentRankings } from "@/lib/api";
import { RankingsResponse } from "@/types/api";

const REGIONS = [
  { value: "global", label: "Global" },
  { value: "LCK", label: "LCK (Korea)" },
  { value: "LPL", label: "LPL (China)" },
  { value: "LEC", label: "LEC (Europe)" },
  { value: "LCS", label: "LCS (North America)" },
  { value: "LCP", label: "LCP (Pacific)" },
  { value: "CBLOL", label: "CBLOL (Brazil)" },
];

export default function Home() {
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("global");

  const [voter, setVoter] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const storedVoter = localStorage.getItem("voter");
    if (storedVoter) {
      setVoter(JSON.parse(storedVoter));
    }
    loadData();
  }, [region]);

  async function loadData() {
    try {
      setLoading(true);
      const rankingsData = await getCurrentRankings(region);
      setData(rankingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rankings");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("voter");
    localStorage.removeItem("token");
    setVoter(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 text-lg">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LPP</h1>
            <p className="text-zinc-400 mt-1">League Press Poll</p>
          </div>
          <div>
            {voter ? (
              <div className="flex items-center gap-4">
                <span className="text-zinc-400">Welcome, {voter.name}</span>
                <a href="/admin" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">
                  Vote
                </a>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-zinc-300 text-sm">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a href="/apply" className="px-4 py-2 text-zinc-400 hover:text-zinc-300 text-sm font-medium">
                  Apply
                </a>
                <a
                  href="/login"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium"
                >
                  Login
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            {!data?.pollWeek ? (
              <h2 className="text-2xl font-semibold">Rankings</h2>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">
                  Week {data.pollWeek.weekNumber} Rankings
                </h2>
                <p className="text-zinc-400">
                  {data.pollWeek.split} {data.pollWeek.year}
                </p>
              </>
            )}
          </div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {!data?.pollWeek ? (
          <div className="text-center py-12 text-zinc-500">
            No rankings published yet
          </div>
        ) : data.rankings.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No rankings for this region
          </div>
        ) : (
          <div className="space-y-2">
            {data.rankings.slice(0, 15).map((ranking) => (
              <div
                key={ranking.rank}
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
              >
                <span className="text-2xl font-bold w-12 text-zinc-500">
                  #{ranking.rank}
                </span>
                {ranking.team.logo ? (
                  <img
                    src={ranking.team.logo}
                    alt={ranking.team.name}
                    className="w-12 h-12 rounded-full object-contain bg-zinc-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-lg">
                    {ranking.team.shortName ? ranking.team.shortName.slice(0, 2) : "??"}
                  </div>
                )}
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
        )}
      </main>
    </div>
  );
}