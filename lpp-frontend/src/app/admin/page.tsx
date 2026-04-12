"use client";

import { useState, useEffect } from "react";
import { getTeams, getWeeks, submitVote, calculateRankings } from "@/lib/api";
import { Team, PollWeek, TeamRanking } from "@/types/api";

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [weeks, setWeeks] = useState<PollWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [voterId, setVoterId] = useState<number>(1);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsData, weeksData] = await Promise.all([getTeams(), getWeeks()]);
        setTeams(teamsData);
        setWeeks(weeksData);
        if (weeksData.length > 0) {
          setSelectedWeek(weeksData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRankChange = (teamId: number, rank: number) => {
    setRankings((prev) => {
      const filtered = prev.filter((r) => r.teamId !== teamId);
      if (rank > 0 && rank <= 15) {
        return [...filtered, { teamId, rank }].sort((a, b) => a.rank - b.rank);
      }
      return filtered;
    });
  };

  const handleSubmit = async () => {
    if (!selectedWeek || rankings.length === 0) {
      setMessage({ type: "error", text: "Please select a week and add rankings" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await submitVote(selectedWeek, voterId, rankings);
      setMessage({ type: "success", text: "Vote submitted successfully!" });
      setRankings([]);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to submit" });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedWeek) return;

    setSaving(true);
    try {
      await calculateRankings(selectedWeek);
      setMessage({ type: "success", text: "Rankings calculated!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to calculate" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen p-8 bg-[#010A13] text-[#F0E6D2]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#010A13] text-[#F0E6D2] p-6">
      <header className="mb-8 pb-4 border-b border-[#1E2328]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Ballot Submission</h1>
            <p className="text-[#A8B4BE] text-sm mt-1">Submit your weekly rankings</p>
          </div>
          <a 
            href="/" 
            className="text-[#786E4D] hover:text-[#C8AA6E] text-sm border-b border-transparent hover:border-[#C8AA6E]"
          >
            Back to Rankings
          </a>
        </div>
      </header>

      {message && (
        <div className={`mb-6 p-4 text-sm border ${
          message.type === "success" 
            ? "bg-[#43B581]/10 text-[#43B581] border-[#43B581]/30" 
            : "bg-[#E84057]/10 text-[#E84057] border-[#E84057]/30"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#1E2328] bg-[#091220]/30 p-5">
          <h2 className="text-lg font-semibold font-serif mb-4 border-b border-[#1E2328] pb-2">Week Selection</h2>
          <select
            value={selectedWeek || ""}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm mb-4 cursor-pointer"
          >
            {weeks.map((week) => (
              <option key={week.id} value={week.id} className="bg-[#010A13]">
                Week {week.weekNumber} - {week.split} {week.year}
              </option>
            ))}
          </select>

          <h2 className="text-lg font-semibold font-serif mb-4 border-b border-[#1E2328] pb-2">Voter ID</h2>
          <input
            type="number"
            value={voterId}
            onChange={(e) => setVoterId(Number(e.target.value))}
            className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm mb-6"
          />

          <h2 className="text-lg font-semibold font-serif mb-4 border-b border-[#1E2328] pb-2">
            Your Ballot <span className="text-[#C8AA6E] text-sm font-normal">({rankings.length}/15)</span>
          </h2>
          <div className="space-y-1 mb-6 max-h-80 overflow-y-auto border border-[#1E2328]">
            {rankings.length === 0 ? (
              <div className="p-4 text-center text-[#786E4D] text-sm">
                Click teams on the right to add them to your ballot
              </div>
            ) : (
              rankings.map((r) => {
                const team = teams.find((t) => t.id === r.teamId);
                return (
                  <div 
                    key={r.teamId} 
                    className="flex items-center gap-3 p-3 bg-[#091220]/50 border-b border-[#1E2328] last:border-b-0"
                  >
                    <span className="w-8 font-serif font-bold text-[#C8AA6E]">#{r.rank}</span>
                    <span className="flex-1 text-sm">{team?.name}</span>
                    <button
                      onClick={() => handleRankChange(r.teamId, 0)}
                      className="text-[#E84057] hover:text-[#E84057]/70 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || rankings.length === 0}
            className="w-full py-3 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] disabled:bg-[#1E2328] disabled:text-[#786E4D] font-semibold text-sm tracking-wide mb-3"
          >
            {saving ? "Submitting..." : "Submit Vote"}
          </button>

          <button
            onClick={handleCalculate}
            disabled={saving || !selectedWeek}
            className="w-full py-3 bg-[#091220] border border-[#1E2328] text-[#A8B4BE] hover:border-[#C8AA6E] hover:text-[#C8AA6E] disabled:bg-[#1E2328] disabled:text-[#786E4D] font-semibold text-sm"
          >
            {saving ? "Calculating..." : "Calculate Rankings"}
          </button>
        </div>

        <div className="border border-[#1E2328] bg-[#091220]/30 p-5">
          <h2 className="text-lg font-semibold font-serif mb-4 border-b border-[#1E2328] pb-2">Select Teams</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm mb-4"
          />
          <div className="space-y-1 max-h-[500px] overflow-y-auto border border-[#1E2328]">
            {teams
              .filter(t => 
                t.name.toLowerCase().includes(search.toLowerCase()) || 
                t.shortName.toLowerCase().includes(search.toLowerCase())
              )
              .map((team) => {
              const existingRank = rankings.find((r) => r.teamId === team.id);
              return (
                <div
                  key={team.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 hover:shadow-[0_0_15px_rgba(200,170,110,0.1)] ${
                    existingRank 
                      ? "bg-[#C8AA6E]/10 border-l-2 border-[#C8AA6E]" 
                      : "bg-[#091220]/30 hover:bg-[#091220]/60"
                  } border-b border-[#1E2328] last:border-b-0`}
                  onClick={() => {
                    if (!existingRank && rankings.length < 15) {
                      const nextRank = rankings.length + 1;
                      handleRankChange(team.id, nextRank);
                    }
                  }}
                >
                  {existingRank ? (
                    <>
                      <span className="w-8 font-serif font-bold text-[#C8AA6E]">#{existingRank.rank}</span>
                      <span className="flex-1 font-semibold text-sm">{team.name}</span>
                      <span className="text-xs text-[#786E4D]">{team.region}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-8 text-[#786E4D]">-</span>
                      <span className="flex-1 text-sm">{team.name}</span>
                      <span className="text-xs text-[#786E4D]">{team.region}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}