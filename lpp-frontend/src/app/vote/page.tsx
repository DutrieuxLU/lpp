"use client";

import { useState, useEffect } from "react";
import { getTeams, getWeeks, submitVote, calculateRankings } from "@/lib/api";
import { Team, PollWeek, TeamRanking } from "@/types/api";

export default function VotePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [weeks, setWeeks] = useState<PollWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [voterId, setVoterId] = useState<number>(0);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedVoter = localStorage.getItem("voter");
    if (storedVoter) {
      const voter = JSON.parse(storedVoter);
      setVoterId(voter.id);
    }
  }, []);

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
    if (rank === 0) {
      // Removing a team
      setRankings((prev) => prev.filter((r) => r.teamId !== teamId));
      return;
    }

    // Check if this team is already ranked somewhere
    if (rankings.some((r) => r.teamId === teamId && r.rank !== rank)) {
      return; // Team already in rankings with different rank
    }

    // Check if this rank is already taken by another team
    const existingTeamAtRank = rankings.find((r) => r.rank === rank && r.teamId !== teamId);
    if (existingTeamAtRank) {
      // Swap: remove the team currently at this rank and add the new one
      setRankings((prev) => {
        const filtered = prev.filter((r) => r.rank !== rank);
        return [...filtered, { teamId, rank }].sort((a, b) => a.rank - b.rank);
      });
      return;
    }

    setRankings((prev) => {
      const filtered = prev.filter((r) => r.teamId !== teamId);
      if (rank > 0 && rank <= 15) {
        return [...filtered, { teamId, rank }].sort((a, b) => a.rank - b.rank);
      }
      return filtered;
    });
  };

  const handleSubmit = async () => {
    if (!selectedWeek) {
      setMessage({ type: "error", text: "Please select a week" });
      return;
    }

    if (rankings.length !== 15) {
      setMessage({ type: "error", text: "You must rank all 15 teams" });
      return;
    }

    if (!voterId) {
      setMessage({ type: "error", text: "Voter not found. Please log in again." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await submitVote(selectedWeek, voterId, rankings);
      await calculateRankings(selectedWeek);
      setMessage({ type: "success", text: "Vote submitted and rankings calculated!" });
      setRankings([]);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to submit" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8 bg-[#010A13] text-[#F0E6D2]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#010A13] text-[#F0E6D2] p-6">
      <header className="mb-6 pb-4 border-b border-[#1E2328]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-[#C8AA6E] hover:text-[#F0E6D2]">
              <span className="text-2xl font-bold font-serif tracking-wide">LPP</span>
            </a>
            <div className="h-6 w-px bg-[#1E2328]"></div>
            <div>
              <h1 className="text-xl font-bold font-serif">Ballot Submission</h1>
              <p className="text-[#A8B4BE] text-sm mt-0.5">Submit your weekly rankings</p>
            </div>
          </div>
          <a 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 bg-[#091220] border border-[#1E2328] text-[#C8AA6E] hover:border-[#C8AA6E] hover:text-[#F0E6D2] text-sm font-medium transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
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
            disabled={saving || rankings.length !== 15}
            className="w-full py-3 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] disabled:bg-[#1E2328] disabled:text-[#786E4D] font-semibold text-sm tracking-wide"
          >
            {saving ? "Submitting..." : `Submit Vote (${rankings.length}/15)`}
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
                    if (existingRank) {
                      handleRankChange(team.id, 0);
                      return;
                    }
                    if (rankings.length >= 15) return;
                    
                    // Find the first available rank
                    const usedRanks = new Set(rankings.map(r => r.rank));
                    let newRank = 1;
                    while (usedRanks.has(newRank) && newRank <= 15) {
                      newRank++;
                    }
                    if (newRank <= 15) {
                      handleRankChange(team.id, newRank);
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