"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const redirectPath = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        const target = redirectPath !== "/dashboard"
          ? redirectPath
          : role === "admin"
          ? "/admin/businesses"
          : "/dashboard";
        
        router.push(target);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F2F5FA]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#004AAD] text-white font-bold text-2xl mb-3 shadow-sm">
            B
          </div>
          <h1 className="text-2xl font-bold text-[#2A3547]">Buzl Listing</h1>
          <p className="text-sm text-[#5D6776] mt-1">Sign in to manage your business directory listings</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#DCE2E8] rounded-xl shadow-sm p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-[#FDECEE] border border-[#E36B5D]/30 text-sm text-[#E36B5D] flex items-start gap-2">
              <span className="font-bold text-base leading-none">!</span>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2A3547] mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-lg text-sm text-[#2A3547] placeholder-[#7D8795] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2A3547] mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-lg text-sm text-[#2A3547] placeholder-[#7D8795] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#004AAD] hover:bg-[#003E91] text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004AAD] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo account helper pills */}
          <div className="mt-8 pt-6 border-t border-[#DCE2E8]">
            <p className="text-xs font-semibold text-[#7D8795] uppercase tracking-wider text-center mb-3">
              Prototype Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("owner@buzl.test")}
                className="text-left p-2.5 border border-[#DCE2E8] rounded-lg hover:border-[#004AAD] hover:bg-[#F2F5FA] transition-colors text-xs"
              >
                <div className="font-semibold text-[#2A3547]">Business Owner</div>
                <div className="text-[#5D6776] truncate">owner@buzl.test</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin@buzl.test")}
                className="text-left p-2.5 border border-[#DCE2E8] rounded-lg hover:border-[#004AAD] hover:bg-[#F2F5FA] transition-colors text-xs"
              >
                <div className="font-semibold text-[#2A3547]">Platform Admin</div>
                <div className="text-[#5D6776] truncate">admin@buzl.test</div>
              </button>
            </div>
            <p className="text-[11px] text-[#7D8795] text-center mt-3">
              No public registration. Contact Buzl admin for account access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
