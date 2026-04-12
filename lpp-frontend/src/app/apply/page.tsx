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
    <div className="min-h-screen bg-[#010A13] text-[#F0E6D2] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-block border-b-2 border-[#C8AA6E] pb-1 mb-2">
            <h1 className="text-3xl font-bold font-serif tracking-wide">Apply to Vote</h1>
          </div>
          <p className="text-[#A8B4BE] mt-2 text-sm">
            Join the LPP panel as a pollster
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 text-sm border ${
            message.includes("success") 
              ? "bg-[#43B581]/10 text-[#43B581] border-[#43B581]/30" 
              : "bg-[#E84057]/10 text-[#E84057] border-[#E84057]/30"
          }`}>
            {message}
          </div>
        )}

        <div className="border border-[#1E2328] bg-[#091220]/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Outlet / Organization</label>
              <input
                type="text"
                value={form.outlet}
                onChange={(e) => setForm({ ...form, outlet: e.target.value })}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Region Coverage</label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E] cursor-pointer"
              >
                <option value="" className="bg-[#010A13]">Select region...</option>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#010A13]">{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Experience / Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E] h-28 resize-none"
                placeholder="Tell us about your experience covering LoL esports..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] disabled:bg-[#1E2328] disabled:text-[#786E4D] font-semibold text-sm tracking-wide"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-[#786E4D] hover:text-[#C8AA6E] text-sm border-b border-transparent hover:border-[#C8AA6E]"
          >
            Back to Rankings
          </a>
        </div>
      </div>
    </div>
  );
}