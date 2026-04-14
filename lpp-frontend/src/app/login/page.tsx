"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("dev-bypass");

  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (sitekey && typeof window !== "undefined" && (window as any).turnstile) {
      (window as any).turnstile.render("#turnstile-container", {
        sitekey,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password, turnstileToken);
      localStorage.setItem("voter", JSON.stringify(res.voter));
      localStorage.setItem("token", res.accessToken);
      router.push("/vote");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010A13] text-[#F0E6D2] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block border-b-2 border-[#C8AA6E] pb-1 mb-2">
            <h1 className="text-3xl font-bold font-serif tracking-wide">LPP</h1>
          </div>
          <p className="text-[#A8B4BE] text-sm">League Press Poll</p>
        </div>

        <div className="border border-[#1E2328] bg-[#091220]/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#E84057]/10 text-[#E84057] text-sm border border-[#E84057]/30">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E]"
                placeholder="voter@lpp.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#A8B4BE] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm focus:border-[#C8AA6E]"
                placeholder="Enter password"
                required
              />
            </div>

            <div id="turnstile-container" className="flex justify-center"></div>

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full py-3 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] disabled:bg-[#1E2328] disabled:text-[#786E4D] font-semibold text-sm tracking-wide"
            >
              {loading ? "Authenticating..." : "Sign In"}
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