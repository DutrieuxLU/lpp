"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPollsters } from "@/lib/api";
import { PollstersListResponse, PollsterProfile } from "@/types/api";

export default function PollstersPage() {
  const [data, setData] = useState<PollstersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    try {
      setLoading(true);
      const pollstersData = await getPollsters(page, 20);
      setData(pollstersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pollsters");
    } finally {
      setLoading(false);
    }
  }

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data && page < data.totalPages) setPage(page + 1);
  };

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
          <nav className="flex items-center gap-6">
            <Link href="/pollsters" className="text-[#C8AA6E] text-sm font-medium">
              Pollsters
            </Link>
            <Link href="/login" className="px-4 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] text-sm font-semibold">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 border-b border-[#1E2328] pb-6">
          <h2 className="text-2xl font-semibold font-serif">Pollster Directory</h2>
          <p className="text-[#A8B4BE] text-sm mt-1">
            Browse registered pollsters for League Press Poll
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#A8B4BE]">Loading pollsters...</div>
        ) : error ? (
          <div className="text-center py-16 text-[#E84057]">{error}</div>
        ) : !data?.pollsters || data.pollsters.length === 0 ? (
          <div className="text-center py-16 text-[#A8B4BE] border border-[#1E2328]">
            No pollsters found
          </div>
        ) : (
          <>
            <div className="border border-[#1E2328]">
              <div className="grid grid-cols-12 gap-4 p-3 bg-[#091220] text-[#A8B4BE] text-xs uppercase tracking-wider border-b border-[#1E2328]">
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Outlet</div>
                <div className="col-span-2">Region</div>
                <div className="col-span-2 text-right pr-4">Status</div>
              </div>
              {data.pollsters.map((pollster) => (
                <PollsterRow key={pollster.id} pollster={pollster} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-4 py-2 border border-[#1E2328] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#C8AA6E]"
                >
                  Previous
                </button>
                <span className="text-[#A8B4BE] text-sm">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page >= data.totalPages}
                  className="px-4 py-2 border border-[#1E2328] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#C8AA6E]"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function PollsterRow({ pollster }: { pollster: PollsterProfile }) {
  return (
    <div className="grid grid-cols-12 gap-4 p-3 items-center border-b border-[#1E2328] hover:bg-[#091220]/50">
      <div className="col-span-4 font-medium">{pollster.name}</div>
      <div className="col-span-4 text-[#A8B4BE] text-sm">{pollster.outlet}</div>
      <div className="col-span-2 text-sm text-[#A8B4BE]">{pollster.region}</div>
      <div className="col-span-2 text-right pr-4">
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
    </div>
  );
}