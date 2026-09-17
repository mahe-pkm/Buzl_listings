"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMethod = "otp" | "password";
type OtpStep = "request" | "verify";

function getSafeRedirectUrl(raw: string | null): string {
  if (!raw) return "/dashboard";
  const trimmed = raw.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const urlError = searchParams.get("error");
  const redirectPath = getSafeRedirectUrl(rawRedirect);

  const [method, setMethod] = useState<AuthMethod>("otp");
  const [otpStep, setOtpStep] = useState<OtpStep>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === "account_inactive"
      ? "Your account is inactive or suspended. Please contact the administrator."
      : null
  );
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Rate-limiting & Cooldown
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const supabase = createClient();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (cooldownSeconds > 0) {
      setErrorMessage(`Please wait ${cooldownSeconds}s before requesting another code.`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
          setErrorMessage("Too many code requests. Please wait a few minutes before trying again.");
        } else {
          setErrorMessage(error.message || "Failed to send verification code. Please try again.");
        }
        setLoading(false);
        return;
      }

      setOtpStep("verify");
      setCooldownSeconds(60);
      setFailedAttempts(0);
      setLockoutUntil(null);
      setInfoMessage(`We've sent a 6-digit verification code to ${cleanEmail}`);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = otpToken.trim();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setErrorMessage(`Too many failed attempts. Please wait ${remainingSeconds}s before retrying.`);
      return;
    }

    if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "email",
      });

      if (error) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 5) {
          const lockTime = Date.now() + 5 * 60 * 1000;
          setLockoutUntil(lockTime);
          setErrorMessage("Too many incorrect attempts. Verification locked for 5 minutes.");
        } else {
          setErrorMessage(`Invalid or expired verification code. (${5 - nextFailed} attempts remaining)`);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Safe navigation based on verified role
        const role = data.user.app_metadata?.role;
        let target = redirectPath;
        if (redirectPath === "/dashboard") {
          if (role === "admin") {
            target = "/admin/businesses";
          } else if (role === "buzl_member") {
            target = "/admin/businesses/import";
          }
        }
        router.push(target);
        router.refresh();
      }
    } catch {
      setErrorMessage("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMessage("Invalid email or password. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (data.user) {
        const role = data.user.app_metadata?.role;
        let target = redirectPath;
        if (redirectPath === "/dashboard") {
          if (role === "admin") {
            target = "/admin/businesses";
          } else if (role === "buzl_member") {
            target = "/admin/businesses/import";
          }
        }
        router.push(target);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const fillDemoAccount = async (account: "owner" | "member" | "admin") => {
    setDemoLoading(account);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/internal/demo-credentials", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Demo credentials are unavailable.");
      }

      const { accounts } = await response.json();
      const demoAccount = accounts?.[account];
      if (!demoAccount?.email || !demoAccount?.password) {
        throw new Error("Demo credentials are unavailable.");
      }

      setEmail(demoAccount.email);
      setPassword(demoAccount.password);
      // Switch to password mode for demo logins so operator can test immediately with one click
      setMethod("password");
    } catch {
      setErrorMessage("Demo credentials are unavailable. Please contact the Buzl admin.");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[12px] border border-[#DCE2E8] shadow-sm">
      <h2 className="text-xl font-bold text-[#2A3547] text-center mb-1">
        Sign in to your account
      </h2>
      <p className="text-xs text-[#5D6776] text-center mb-5">
        Access your dashboard with Email OTP or your password
      </p>

      {/* Auth Method Selector Tabs */}
      <div role="tablist" className="flex border-b border-[#DCE2E8] mb-5">
        <button
          type="button"
          role="tab"
          aria-selected={method === "otp"}
          onClick={() => {
            setMethod("otp");
            setErrorMessage(null);
            setInfoMessage(null);
          }}
          className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            method === "otp"
              ? "border-[#004AAD] text-[#004AAD]"
              : "border-transparent text-[#7D8795] hover:text-[#2A3547]"
          }`}
        >
          Email Code (OTP)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === "password"}
          onClick={() => {
            setMethod("password");
            setErrorMessage(null);
            setInfoMessage(null);
          }}
          className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            method === "password"
              ? "border-[#004AAD] text-[#004AAD]"
              : "border-transparent text-[#7D8795] hover:text-[#2A3547]"
          }`}
        >
          Password
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-[#FDECEE] border border-[#F8B4B4] rounded-[8px] flex items-start gap-2.5" role="alert">
          <span className="text-[#C52707] shrink-0 text-sm">⚠</span>
          <div className="text-xs text-[#C52707] font-medium">{errorMessage}</div>
        </div>
      )}

      {infoMessage && (
        <div className="mb-4 p-3 bg-[#EBF5FF] border border-[#B8DBFF] rounded-[8px] flex items-start gap-2.5">
          <span className="text-[#004AAD] shrink-0 text-sm">ℹ</span>
          <div className="text-xs text-[#004AAD] font-medium">{infoMessage}</div>
        </div>
      )}

      {/* Mode 1: EMAIL OTP */}
      {method === "otp" && (
        <div>
          {otpStep === "request" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="otp-email">
                  Email address
                </label>
                <input
                  id="otp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                />
                <p className="text-[11px] text-[#7D8795] mt-1.5">
                  We will send a 6-digit one-time code to this address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                {loading
                  ? "Sending code..."
                  : cooldownSeconds > 0
                  ? `Wait ${cooldownSeconds}s`
                  : "Continue with Email OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[#7D8795]">Sending code to: </span>
                  <span className="font-semibold text-[#2A3547]">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("request");
                    setOtpToken("");
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs font-semibold text-[#004AAD] hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="otp-token">
                  Enter 6-digit verification code
                </label>
                <input
                  id="otp-token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-center font-mono text-xl tracking-[0.4em] text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpToken.length !== 6}
                className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                {loading ? "Verifying..." : "Verify and Sign In"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={loading || cooldownSeconds > 0}
                  onClick={() => void handleSendOtp()}
                  className="text-xs text-[#004AAD] hover:underline font-semibold disabled:text-[#94A3B8] disabled:no-underline"
                >
                  {cooldownSeconds > 0 ? `Resend code in ${cooldownSeconds}s` : "Resend verification code"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Mode 2: PASSWORD LOGIN */}
      {method === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="password-email">
              Email address
            </label>
            <input
              id="password-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              autoComplete="email"
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {loading ? "Signing in..." : "Sign In with Password"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-[#5D6776]">
        New business?{" "}
        <Link href="/signup" className="font-semibold text-[#004AAD]">
          Create an owner account
        </Link>
      </p>

      {/* Demo account helper pills */}
      <div className="mt-8 pt-6 border-t border-[#DCE2E8]">
        <p className="text-xs font-semibold text-[#7D8795] uppercase tracking-wider text-center mb-3">
          Prototype Demo Accounts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void fillDemoAccount("owner")}
            disabled={demoLoading !== null}
            className="text-left p-2.5 border border-[#DCE2E8] rounded-lg hover:border-[#004AAD] hover:bg-[#F2F5FA] transition-colors text-xs"
          >
            <div className="font-semibold text-[#2A3547]">Business Owner</div>
            <div className="text-[#5D6776] truncate text-[11px]">owner@buzl.test</div>
          </button>
          <button
            type="button"
            onClick={() => void fillDemoAccount("member")}
            disabled={demoLoading !== null}
            className="text-left p-2.5 border border-[#DCE2E8] rounded-lg hover:border-[#6929C4] hover:bg-[#F0EBFF]/40 transition-colors text-xs"
          >
            <div className="font-semibold text-[#6929C4]">Buzl Member</div>
            <div className="text-[#5D6776] truncate text-[11px]">member@buzl.test</div>
          </button>
          <button
            type="button"
            onClick={() => void fillDemoAccount("admin")}
            disabled={demoLoading !== null}
            className="text-left p-2.5 border border-[#DCE2E8] rounded-lg hover:border-[#087C3C] hover:bg-[#E3F2EA]/40 transition-colors text-xs"
          >
            <div className="font-semibold text-[#087C3C]">Platform Admin</div>
            <div className="text-[#5D6776] truncate text-[11px]">admin@buzl.test</div>
          </button>
        </div>
        <p className="text-[11px] text-[#7D8795] text-center mt-3">
          Prototype staging accounts. OTP or password verification supported.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F2F5FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#004AAD] flex items-center justify-center text-white font-bold text-xl tracking-wider shadow-sm">
            B
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold text-[#2A3547] tracking-tight">
          Buzl Listing
        </h1>
        <p className="text-center text-xs text-[#7D8795] mt-1">
          Business Profile Directory • Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="bg-white p-6 sm:p-8 rounded-[12px] border border-[#DCE2E8] shadow-sm text-center text-xs text-[#5D6776]">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
