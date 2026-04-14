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
      <div className="min-h-screen flex items-center justify-center bg-[#010A13]">
        <div className="text-[#A8B4BE] text-lg">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
      <header className="border-b border-[#1E2328] bg-[#091220]/80">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif">LPP</h1>
            <p className="text-[#A8B4BE] mt-0.5 text-sm">League Press Poll</p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/pollsters" 
              className="text-[#A8B4BE] hover:text-[#C8AA6E] text-sm border-b border-transparent hover:border-[#C8AA6E]"
            >
              Pollsters
            </a>
            {voter ? (
              <div className="flex items-center gap-4">
                <span className="text-[#A8B4BE] text-sm">Welcome, {voter.name}</span>
                <a 
                  href="/admin" 
                  className="px-4 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] text-sm font-semibold"
                >
                  Vote
                </a>
                <button 
                  onClick={handleLogout} 
                  className="text-[#A8B4BE] hover:text-[#F0E6D2] text-sm border-b border-transparent hover:border-[#C8AA6E]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a 
                  href="/apply" 
                  className="px-4 py-1.5 text-[#C8AA6E] hover:text-[#F0E6D2] text-sm font-medium border border-[#C8AA6E]/30 hover:border-[#C8AA6E]"
                >
                  Apply
                </a>
                <a
                  href="/login"
                  className="px-4 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] text-sm font-semibold"
                >
                  Login
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between border-b border-[#1E2328] pb-6">
          <div>
            {!data?.pollWeek ? (
              <h2 className="text-2xl font-semibold font-serif">Rankings</h2>
            ) : (
              <>
                <h2 className="text-2xl font-semibold font-serif">
                  Week {data.pollWeek.weekNumber} Rankings
                </h2>
                <p className="text-[#A8B4BE] text-sm mt-1">
                  {data.pollWeek.split} {data.pollWeek.year}
                </p>
              </>
            )}
          </div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="p-2 bg-[#091220] border border-[#1E2328] text-[#F0E6D2] text-sm font-sans cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {!data?.pollWeek ? (
          <div className="text-center py-16 text-[#A8B4BE] border border-[#1E2328]">
            No rankings published yet
          </div>
        ) : !data?.rankings || data.rankings.length === 0 ? (
          <div className="text-center py-16 text-[#A8B4BE] border border-[#1E2328]">
            No rankings for this region
          </div>
        ) : (
          <div className="border border-[#1E2328]">
            <div className="grid grid-cols-12 gap-4 p-3 bg-[#091220] text-[#A8B4BE] text-xs uppercase tracking-wider border-b border-[#1E2328]">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-6 pl-2">Team</div>
              <div className="col-span-4 text-right pr-4">League</div>
              <div className="col-span-1 text-right">Pts</div>
            </div>
            {data.rankings.slice(0, 15).map((ranking, index) => (
              <div
                key={ranking.rank}
                className={`grid grid-cols-12 gap-4 p-3 items-center border-b border-[#1E2328] transition-all duration-200 hover:shadow-[0_0_20px_rgba(200,170,110,0.15)] hover:bg-[#091220]/50 cursor-default ${
                  index % 2 === 0 ? "bg-[#010A13]" : "bg-[#091220]/30"
                }`}
              >
                <div className={`col-span-1 text-center font-serif text-lg font-bold ${
                  ranking.rank <= 3 ? "text-[#C8AA6E]" : "text-[#A8B4BE]"
                }`}>
                  {ranking.rank}
                </div>
                <div className="col-span-6 flex items-center gap-3 pl-2">
                  {ranking.team.logo ? (
                    <img
                      src={ranking.team.logo}
                      alt={ranking.team.name}
                      className="w-8 h-8 object-contain bg-[#091220] border border-[#1E2328]"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#091220] border border-[#1E2328] flex items-center justify-center text-[#A8B4BE] font-bold text-sm">
                      {ranking.team.shortName ? ranking.team.shortName.slice(0, 2) : "??"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-[#F0E6D2]">{ranking.team.name}</div>
                    {ranking.team.shortName && (
                      <div className="text-xs text-[#786E4D]">{ranking.team.shortName}</div>
                    )}
                  </div>
                </div>
                <div className="col-span-4 text-right pr-4 text-sm text-[#A8B4BE]">
                  {ranking.team.region}
                </div>
                <div className="col-span-1 text-right font-serif text-lg text-[#C8AA6E] font-bold">
                  {ranking.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}