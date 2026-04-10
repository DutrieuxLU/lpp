"use client";

import { useState, useEffect } from "react";
import { getTeams, getWeeks, submitVote, calculateRankings } from "@/lib/api";
import { Team, PollWeek, TeamRanking, Ranking } from "@/types/api";

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [weeks, setWeeks] = useState<PollWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [voterId, setVoterId] = useState<number>(1);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      if (rank > 0) {
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
    return <div className="min-h-screen p-8 bg-zinc-950 text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Admin - Submit Vote</h1>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === "success" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Week</h2>
          <select
            value={selectedWeek || ""}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg mb-4"
          >
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                Week {week.weekNumber} - {week.split} {week.year} ({week.status})
              </option>
            ))}
          </select>

          <h2 className="text-xl font-semibold mb-4">Voter ID</h2>
          <input
            type="number"
            value={voterId}
            onChange={(e) => setVoterId(Number(e.target.value))}
            className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg mb-4"
          />

          <h2 className="text-xl font-semibold mb-4">Your Ballot ({rankings.length} teams)</h2>
          <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {rankings.map((r) => {
              const team = teams.find((t) => t.id === r.teamId);
              return (
                <div key={r.teamId} className="flex items-center gap-3 p-2 bg-zinc-900 rounded">
                  <span className="w-8 font-bold">#{r.rank}</span>
                  <span className="flex-1">{team?.name}</span>
                  <button
                    onClick={() => handleRankChange(r.teamId, 0)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || rankings.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold"
          >
            {saving ? "Submitting..." : "Submit Vote"}
          </button>

          <button
            onClick={handleCalculate}
            disabled={saving || !selectedWeek}
            className="w-full mt-3 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold"
          >
            {saving ? "Calculating..." : "Calculate Rankings"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Rank Teams</h2>
          <p className="text-zinc-500 text-sm mb-4">Click to assign a rank</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {teams.map((team) => {
              const existingRank = rankings.find((r) => r.teamId === team.id);
              return (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800"
                  onClick={() => {
                    if (!existingRank) {
                      const nextRank = rankings.length + 1;
                      handleRankChange(team.id, nextRank);
                    }
                  }}
                >
                  {existingRank ? (
                    <>
                      <span className="w-8 font-bold text-green-400">#{existingRank.rank}</span>
                      <span className="flex-1 font-semibold">{team.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-8 text-zinc-600">-</span>
                      <span className="flex-1">{team.name}</span>
                      <span className="text-xs text-zinc-600">{team.region}</span>
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
