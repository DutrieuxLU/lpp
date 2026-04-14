"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("dev-bypass");
  const codeInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (require2FA && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [require2FA]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      if (data.require2FA) {
        setRequire2FA(true);
        setTempToken(data.tempToken);
      } else {
        localStorage.setItem("voter", JSON.stringify(data.voter));
        localStorage.setItem("token", data.accessToken);
        router.push("/vote");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: verificationCode }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      
      localStorage.setItem("voter", JSON.stringify(data.voter));
      localStorage.setItem("token", data.accessToken);
      router.push("/vote");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequire2FA(false);
    setTempToken("");
    setVerificationCode("");
    setError(null);
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
          {!require2FA ? (
            <form onSubmit={handleLogin} className="space-y-4">
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
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#E84057]/10 text-[#E84057] text-sm border border-[#E84057]/30">
                  {error}
                </div>
              )}

              <div className="text-center mb-4">
                <p className="text-[#A8B4BE] text-sm">
                  Enter the 6-digit code sent to<br />
                  <span className="text-[#F0E6D2]">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm text-[#A8B4BE] mb-2">Verification Code</label>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-3 bg-[#010A13] border border-[#1E2328] text-[#F0E6D2] text-sm text-center tracking-widest font-mono focus:border-[#C8AA6E]"
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 bg-[#C8AA6E] text-[#010A13] hover:bg-[#F0E6D2] disabled:bg-[#1E2328] disabled:text-[#786E4D] font-semibold text-sm tracking-wide"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-[#A8B4BE] hover:text-[#F0E6D2] text-sm"
              >
                Back to Login
              </button>
            </form>
          )}
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