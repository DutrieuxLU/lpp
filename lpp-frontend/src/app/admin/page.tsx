"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateRankings, clearRankings, getWeeks } from "@/lib/api";

interface Voter {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  region: string;
  isActive: boolean;
  outlet: string;
}

interface PollWeek {
  id: number;
  year: number;
  split: string;
  weekNumber: number;
  status: string;
  publishDate: string;
}

interface Application {
  id: number;
  name: string;
  email: string;
  outlet: string;
  region: string;
  notes: string;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [voter, setVoter] = useState<Voter | null>(null);
  const [activeTab, setActiveTab] = useState<"weeks" | "voters" | "applications">("weeks");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [weeks, setWeeks] = useState<PollWeek[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const storedVoter = localStorage.getItem("voter");
    if (storedVoter) {
      const parsed = JSON.parse(storedVoter);
      if (parsed.role !== "admin") {
        router.push("/");
        return;
      }
      setVoter(parsed);
    } else {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    if (typeof window === "undefined") return;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");
    
    const fetchWithAuth = async <T,>(endpoint: string, opts?: RequestInit): Promise<T> => {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...opts,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    };

    try {
      const [votersData, weeksData, appsData] = await Promise.all([
        fetchWithAuth<Voter[]>("/voters"),
        fetchWithAuth<PollWeek[]>("/weeks"),
        fetchWithAuth<Application[]>("/applications"),
      ]);
      setVoters(votersData);
      setWeeks(weeksData);
      setApplications(appsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleVoter(voterId: number, currentStatus: boolean) {
    setSaving(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");
    
    try {
      await fetch(`${API_URL}/voters/${voterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      setVoters(voters.map(v => v.id === voterId ? { ...v, isActive: !currentStatus } : v));
      setMessage({ type: "success", text: "Voter status updated" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update voter" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCalculateRankings(weekId: number) {
    setSaving(true);
    setMessage(null);
    try {
      await calculateRankings(weekId);
      setMessage({ type: "success", text: "Rankings calculated successfully" });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to calculate rankings" });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearRankings(weekId: number) {
    if (!confirm("Are you sure you want to clear rankings for this week?")) return;
    setSaving(true);
    setMessage(null);
    try {
      await clearRankings(weekId);
      setMessage({ type: "success", text: "Rankings cleared successfully" });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to clear rankings" });
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveApplication(appId: number) {
    setSaving(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");
    
    try {
      await fetch(`${API_URL}/applications/${appId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(applications.filter(a => a.id !== appId));
      loadData();
      setMessage({ type: "success", text: "Application approved" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to approve application" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectApplication(appId: number) {
    setSaving(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");
    
    try {
      await fetch(`${API_URL}/applications/${appId}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(applications.filter(a => a.id !== appId));
      setMessage({ type: "success", text: "Application rejected" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to reject application" });
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("voter");
    localStorage.removeItem("token");
    router.push("/");
  };

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
              <h1 className="text-xl font-bold font-serif">Admin Dashboard</h1>
              <p className="text-[#A8B4BE] text-sm mt-0.5">Manage poll weeks, voters, and applications</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#A8B4BE] text-sm">Welcome, {voter?.name}</span>
            <a href="/vote" className="px-3 py-1.5 text-[#A8B4BE] hover:text-[#C8AA6E] text-sm border border-[#1E2328] hover:border-[#C8AA6E]">
              Voting
            </a>
            <button onClick={handleLogout} className="text-[#A8B4BE] hover:text-[#F0E6D2] text-sm">
              Logout
            </button>
          </div>
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

      <div className="flex gap-2 mb-6 border-b border-[#1E2328] pb-2">
        <button
          onClick={() => setActiveTab("weeks")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "weeks" 
              ? "text-[#C8AA6E] border-b-2 border-[#C8AA6E]" 
              : "text-[#A8B4BE] hover:text-[#F0E6D2]"
          }`}
        >
          Poll Weeks
        </button>
        <button
          onClick={() => setActiveTab("voters")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "voters" 
              ? "text-[#C8AA6E] border-b-2 border-[#C8AA6E]" 
              : "text-[#A8B4BE] hover:text-[#F0E6D2]"
          }`}
        >
          Voters ({voters.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "applications" 
              ? "text-[#C8AA6E] border-b-2 border-[#C8AA6E]" 
              : "text-[#A8B4BE] hover:text-[#F0E6D2]"
          }`}
        >
          Applications ({applications.length})
        </button>
      </div>

      {activeTab === "weeks" && (
        <div className="border border-[#1E2328] bg-[#091220]/30">
          <div className="p-4 border-b border-[#1E2328]">
            <h2 className="font-semibold font-serif">Poll Weeks</h2>
          </div>
          <div className="divide-y divide-[#1E2328]">
            {weeks.length === 0 ? (
              <div className="p-4 text-[#786E4D] text-center">No poll weeks found</div>
            ) : (
              weeks.map((week) => (
                <div key={week.id} className="p-4 flex items-center justify-between hover:bg-[#091220]/50">
                  <div>
                    <div className="font-medium">Week {week.weekNumber} - {week.split} {week.year}</div>
                    <div className="text-sm text-[#786E4D]">Status: {week.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCalculateRankings(week.id)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] disabled:bg-[#1E2328] disabled:text-[#786E4D] text-sm font-medium"
                    >
                      Calculate
                    </button>
                    <button
                      onClick={() => handleClearRankings(week.id)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-[#E84057]/10 text-[#E84057] hover:bg-[#E84057]/20 border border-[#E84057]/30 text-sm font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "voters" && (
        <div className="border border-[#1E2328] bg-[#091220]/30">
          <div className="p-4 border-b border-[#1E2328]">
            <h2 className="font-semibold font-serif">All Voters</h2>
          </div>
          <div className="divide-y divide-[#1E2328]">
            {voters.length === 0 ? (
              <div className="p-4 text-[#786E4D] text-center">No voters found</div>
            ) : (
              voters.map((v) => (
                <div key={v.id} className="p-4 flex items-center justify-between hover:bg-[#091220]/50">
                  <div>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-sm text-[#786E4D]">{v.email} • {v.role} • {v.region || "No region"}</div>
                    {v.outlet && <div className="text-xs text-[#786E4D]">{v.outlet}</div>}
                  </div>
                  <button
                    onClick={() => handleToggleVoter(v.id, v.isActive)}
                    disabled={saving}
                    className={`px-3 py-1.5 text-sm font-medium ${
                      v.isActive 
                        ? "bg-[#E84057]/10 text-[#E84057] border border-[#E84057]/30 hover:bg-[#E84057]/20"
                        : "bg-[#43B581]/10 text-[#43B581] border border-[#43B581]/30 hover:bg-[#43B581]/20"
                    }`}
                  >
                    {v.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "applications" && (
        <div className="border border-[#1E2328] bg-[#091220]/30">
          <div className="p-4 border-b border-[#1E2328]">
            <h2 className="font-semibold font-serif">Pending Applications</h2>
          </div>
          <div className="divide-y divide-[#1E2328]">
            {applications.length === 0 ? (
              <div className="p-4 text-[#786E4D] text-center">No pending applications</div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="p-4 hover:bg-[#091220]/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{app.name}</div>
                      <div className="text-sm text-[#786E4D]">{app.email}</div>
                      {app.outlet && <div className="text-sm text-[#A8B4BE]">{app.outlet}</div>}
                      {app.region && <div className="text-xs text-[#786E4D]">Region: {app.region}</div>}
                      {app.notes && <div className="text-xs text-[#786E4D] mt-1">Notes: {app.notes}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveApplication(app.id)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-[#43B581]/10 text-[#43B581] hover:bg-[#43B581]/20 border border-[#43B581]/30 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectApplication(app.id)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-[#E84057]/10 text-[#E84057] hover:bg-[#E84057]/20 border border-[#E84057]/30 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}