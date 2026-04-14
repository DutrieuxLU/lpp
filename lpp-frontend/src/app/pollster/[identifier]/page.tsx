"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPollster, getPollsterVotes, updatePollsterProfile } from "@/lib/api";
import { PollsterResponse, PollsterVotesResponse, PollsterVote, PollsterProfile } from "@/types/api";

export default function PollsterProfilePage({ params }: { params: Promise<{ identifier: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<PollsterResponse | null>(null);
  const [votesData, setVotesData] = useState<PollsterVotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [voter, setVoter] = useState<{ id: number; name: string; role: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedVoter = localStorage.getItem("voter");
    if (storedVoter) {
      setVoter(JSON.parse(storedVoter));
    }
    loadData();
  }, [resolvedParams.identifier, page]);

  async function loadData() {
    try {
      setLoading(true);
      const pollsterData = await getPollster(resolvedParams.identifier);
      setData(pollsterData);
      if (pollsterData.pollster) {
        setEditBio(pollsterData.pollster.bio || "");
        setEditPhoto(pollsterData.pollster.photo || "");
        const votes = await getPollsterVotes(resolvedParams.identifier, page, 10);
        setVotesData(votes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pollster");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);
      const updated = await updatePollsterProfile(editBio, editPhoto);
      setData((prev) => prev ? { ...prev, pollster: updated } : null);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
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

  const isOwnProfile = voter && data?.pollster && voter.id === data.pollster.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010A13] text-[#F0E6D2]">
        <div className="text-center py-16 text-[#A8B4BE]">Loading...</div>
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
            {voter ? (
              <div className="flex items-center gap-3">
                <span className="text-[#A8B4BE] text-sm">{voter.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-[#A8B4BE] hover:text-[#F0E6D2] text-sm border-b border-transparent hover:border-[#C8AA6E]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="px-4 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] text-sm font-semibold">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 border-b border-[#1E2328] pb-6">
          <div className="flex items-start gap-6">
            {pollster.photo ? (
              <img
                src={pollster.photo}
                alt={pollster.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#C8AA6E]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#091220] border-2 border-[#C8AA6E] flex items-center justify-center text-[#C8AA6E] text-3xl font-serif">
                {pollster.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
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
              <div className="flex items-center gap-6 text-[#A8B4BE] text-sm mb-3">
                <span>{pollster.outlet}</span>
                <span>{pollster.region}</span>
                <span className="text-[#786E4D]">{pollster.role}</span>
              </div>
              
              {isEditing ? (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-sm text-[#A8B4BE] mb-1">Photo URL</label>
                    <input
                      type="text"
                      value={editPhoto}
                      onChange={(e) => setEditPhoto(e.target.value)}
                      className="w-full p-2 bg-[#091220] border border-[#1E2328] text-[#F0E6D2] text-sm"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#A8B4BE] mb-1">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full p-2 bg-[#091220] border border-[#1E2328] text-[#F0E6D2] text-sm h-24"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] text-sm font-semibold disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 border border-[#1E2328] text-[#A8B4BE] hover:text-[#F0E6D2] text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {pollster.bio && (
                    <p className="text-[#A8B4BE] text-sm mb-3">{pollster.bio}</p>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[#C8AA6E] text-sm hover:text-[#F0E6D2] border-b border-transparent hover:border-[#C8AA6E]"
                    >
                      Edit Profile
                    </button>
                  )}
                </>
              )}
            </div>
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