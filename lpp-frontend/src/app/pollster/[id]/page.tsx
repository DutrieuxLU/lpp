"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPollster, getPollsterVotes } from "@/lib/api";
import { PollsterResponse, PollsterVotesResponse, PollsterVote } from "@/types/api";

export default function PollsterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<PollsterResponse | null>(null);
  const [votesData, setVotesData] = useState<PollsterVotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [page, setPage] = useState(1);
  const [voter, setVoter] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const storedVoter = localStorage.getItem("voter");
    if (storedVoter) {
      setVoter(JSON.parse(storedVoter));
    }
    loadData();
  }, [resolvedParams.id, page]);

  async function loadData() {
    try {
      setLoading(true);
      setAuthError(false);
      const pollsterData = await getPollster(Number(resolvedParams.id));
      setData(pollsterData);
      if (pollsterData.pollster) {
        const votes = await getPollsterVotes(Number(resolvedParams.id), page, 10);
        setVotesData(votes);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        setAuthError(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pollster");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("voter");
    localStorage.removeItem("token");
    router.push("/");
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (votesData && page < votesData.totalPages) setPage(page + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
        <div className="text-center py-16 text-[#A8B4BE]">Loading...</div>
      </div>
    );
  }

  if (authError || !voter) {
    return (
      <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
        <header className="border-b border-[#1E2328] bg-[#091220]/80">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link href="/" className="cursor-pointer">
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-serif">LPP</h1>
                <p className="text-[#A8B4BE] mt-0.5 text-sm">League Press Poll</p>
              </div>
            </Link>
            <Link href="/login" className="px-4 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] text-sm font-semibold">
              Login
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="border border-[#E84057]/30 bg-[#E84057]/10 p-6">
            <h2 className="text-xl font-semibold text-[#E84057] mb-2">Authentication Required</h2>
            <p className="text-[#A8B4BE]">You must be logged in to view pollster profiles.</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
        <header className="border-b border-[#1E2328] bg-[#091220]/80">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link href="/" className="cursor-pointer">
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-serif">LPP</h1>
                <p className="text-[#A8B4BE] mt-0.5 text-sm">League Press Poll</p>
              </div>
            </Link>
            <Link href="/pollsters" className="text-[#C8AA6E] text-sm hover:text-[#F0E6D2]">
              Pollsters
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-16 text-center text-[#E84057]">
          {error}
        </main>
      </div>
    );
  }

  if (!data?.pollster) {
    return (
      <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
        <header className="border-b border-[#1E2328] bg-[#091220]/80">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link href="/" className="cursor-pointer">
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-serif">LPP</h1>
                <p className="text-[#A8B4BE] mt-0.5 text-sm">League Press Poll</p>
              </div>
            </Link>
            <Link href="/pollsters" className="text-[#C8AA6E] text-sm hover:text-[#F0E6D2]">
              Pollsters
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-16 text-center text-[#A8B4BE]">
          Pollster not found
        </main>
      </div>
    );
  }

  const { pollster, latestVote } = data;

  return (
    <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
      <header className="border-b border-[#1E2328] bg-[#091220]/80">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-serif">LPP</h1>
              <p className="text-[#A8B4BE] mt-0.5 text-sm">League Press Poll</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pollsters" className="text-[#C8AA6E] text-sm hover:text-[#F0E6D2]">
              Pollsters
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-[#A8B4BE] text-sm">{voter.name}</span>
              <button
                onClick={handleLogout}
                className="text-[#A8B4BE] hover:text-[#F0E6D2] text-sm border-b border-transparent hover:border-[#C8AA6E]"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 border-b border-[#1E2328] pb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-semibold font-serif">{pollster.name}</h2>
            <span
              className={`inline-block px-2 py-0.5 text-xs ${
                pollster.isActive
                  ? "bg-[#43B581]/20 text-[#43B581]"
                  : "bg-[#786E4D]/20 text-[#786E4D]"
              }`}
            >
              {pollster.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-6 text-[#A8B4BE] text-sm">
            <span>{pollster.outlet}</span>
            <span>{pollster.region}</span>
            <span className="text-[#786E4D]">{pollster.role}</span>
          </div>
        </div>

        {latestVote && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold font-serif mb-4">Latest Vote</h3>
            <div className="border border-[#1E2328]">
              <div className="p-3 bg-[#091220] border-b border-[#1E2328]">
                <span className="text-[#A8B4BE] text-sm">
                  Week {latestVote.weekNumber} - {latestVote.split} {latestVote.year}
                </span>
              </div>
              <VoteRankings rankings={latestVote.rankings} />
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold font-serif mb-4">Vote History</h3>
          {!votesData?.votes || votesData.votes.length === 0 ? (
            <div className="text-center py-8 text-[#A8B4BE] border border-[#1E2328]">
              No votes submitted yet
            </div>
          ) : (
            <>
              <div className="border border-[#1E2328]">
                {votesData.votes.map((vote) => (
                  <VoteCard key={vote.id} vote={vote} />
                ))}
              </div>

              {votesData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="px-4 py-2 border border-[#1E2328] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#C8AA6E]"
                  >
                    Previous
                  </button>
                  <span className="text-[#A8B4BE] text-sm">
                    Page {page} of {votesData.totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={page >= votesData.totalPages}
                    className="px-4 py-2 border border-[#1E2328] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#C8AA6E]"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function VoteRankings({ rankings }: { rankings: PollsterVote["rankings"] }) {
  return (
    <div className="divide-y divide-[#1E2328]">
      {rankings.map((ranking) => (
        <div key={ranking.teamId} className="grid grid-cols-12 gap-4 p-3 items-center">
          <div className="col-span-1 text-center font-serif text-lg font-bold text-[#C8AA6E]">
            {ranking.rank}
          </div>
          <div className="col-span-10 flex items-center gap-3">
            {ranking.teamLogo ? (
              <img
                src={ranking.teamLogo}
                alt={ranking.teamName}
                className="w-8 h-8 object-contain bg-[#091220] border border-[#1E2328]"
              />
            ) : (
              <div className="w-8 h-8 bg-[#091220] border border-[#1E2328] flex items-center justify-center text-[#A8B4BE] font-bold text-sm">
                {ranking.teamShort?.slice(0, 2) || "??"}
              </div>
            )}
            <div>
              <div className="font-medium">{ranking.teamName}</div>
              <div className="text-xs text-[#786E4D]">{ranking.teamShort}</div>
            </div>
          </div>
          <div className="col-span-1 text-right text-sm text-[#A8B4BE]">
            {ranking.teamRegion}
          </div>
        </div>
      ))}
    </div>
  );
}

function VoteCard({ vote }: { vote: PollsterVote }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[#1E2328]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-[#091220]/50"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Week {vote.weekNumber}</span>
            <span className="text-[#A8B4BE] mx-2">•</span>
            <span className="text-[#A8B4BE]">{vote.split} {vote.year}</span>
          </div>
          <span className="text-[#786E4D] text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>
      {expanded && <VoteRankings rankings={vote.rankings} />}
    </div>
  );
}