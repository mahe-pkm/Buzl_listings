"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const redirectPath = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
    } catch {
      setErrorMessage("Demo credentials are unavailable. Please contact the Buzl admin.");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[12px] border border-[#DCE2E8] shadow-sm">
      <h2 className="text-xl font-bold text-[#2A3547] text-center mb-1">
        Sign in to your account
      </h2>
      <p className="text-xs text-[#5D6776] text-center mb-6">
        Enter your authorized credentials to access your dashboard
      </p>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-[#FDECEE] border border-[#F8B4B4] rounded-[8px] flex items-start gap-2.5">
          <svg className="w-4 h-4 text-[#C52707] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-[#C52707] font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@business.com"
            suppressHydrationWarning
            className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            suppressHydrationWarning
            className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-[#5D6776]">New business? <Link href="/signup" className="font-semibold text-[#004AAD]">Create an owner account</Link></p>

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
          No public registration. Contact Buzl admin for account access.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F2F5FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
          Rapid MVP Prototype • Day 1 Foundation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="bg-white p-8 rounded-[12px] border border-[#DCE2E8] shadow-sm text-center text-xs text-[#5D6776]">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
