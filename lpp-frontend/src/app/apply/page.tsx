"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REGIONS = [
  { value: "LCS", label: "LCS (North America)" },
  { value: "LEC", label: "LEC (Europe)" },
  { value: "LCK", label: "LCK (Korea)" },
  { value: "LPL", label: "LPL (China)" },
  { value: "LCP", label: "LCP (Pacific)" },
  { value: "CBLOL", label: "CBLOL (Brazil)" },
];

export default function ApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    outlet: "",
    region: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:8080/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setMessage("Application submitted successfully!");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setMessage("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Apply to Vote</h1>
          <p className="text-zinc-400 mt-2">
            Join the LPP panel as a pollster
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes("success") ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Outlet / Organization</label>
            <input
              type="text"
              value={form.outlet}
              onChange={(e) => setForm({ ...form, outlet: e.target.value })}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Region Coverage</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
            >
              <option value="">Select region...</option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Experience / Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 h-32"
              placeholder="Tell us about your experience covering LoL esports..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 rounded-lg font-medium"
          >
            {loading ? "Submitting..." : "Apply"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-zinc-500 hover:text-zinc-400 text-sm">
            Back to Rankings
          </a>
        </div>
      </div>
    </div>
  );
}