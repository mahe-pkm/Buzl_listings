'use client';

import Link from 'next/link';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type SignupMethod = 'otp' | 'password';
type OtpStep = 'request' | 'verify';

export default function SignupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<SignupMethod>('otp');
  const [otpStep, setOtpStep] = useState<OtpStep>('request');

  // Form states
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  // Handle OTP Send
  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
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
        if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
          setErrorMessage('Too many code requests. Please wait a few minutes before trying again.');
        } else {
          setErrorMessage(error.message || 'Failed to send verification code. Please try again.');
        }
        setLoading(false);
        return;
      }

      setOtpStep('verify');
      setCooldownSeconds(60);
      setFailedAttempts(0);
      setLockoutUntil(null);
      setInfoMessage(`We've sent a 6-digit verification code to ${cleanEmail}`);
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verify
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = otpToken.trim();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setErrorMessage(`Too many failed attempts. Please wait ${remainingSeconds}s before retrying.`);
      return;
    }

    if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 5) {
          const lockTime = Date.now() + 5 * 60 * 1000;
          setLockoutUntil(lockTime);
          setErrorMessage('Too many incorrect attempts. Verification locked for 5 minutes.');
        } else {
          setErrorMessage(`Invalid or expired verification code. (${5 - nextFailed} attempts remaining)`);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErrorMessage('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle Password Signup
  const handlePasswordSignup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanFullName },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.replace('/dashboard');
      } else {
        setInfoMessage('Account created. Check your email to confirm your account or sign in with Email OTP.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F5FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#004AAD] flex items-center justify-center text-white font-bold text-xl tracking-wider shadow-sm">
            B
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold text-[#2A3547] tracking-tight">
          Create your Buzl account
        </h1>
        <p className="text-center text-xs text-[#7D8795] mt-1">
          Create listings as drafts and submit them for review
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-8 rounded-[12px] border border-[#DCE2E8] shadow-sm">
          {/* Method Selector Tabs */}
          <div className="flex border-b border-[#DCE2E8] mb-5">
            <button
              type="button"
              onClick={() => {
                setMethod('otp');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
                method === 'otp'
                  ? 'border-[#004AAD] text-[#004AAD]'
                  : 'border-transparent text-[#7D8795] hover:text-[#2A3547]'
              }`}
            >
              Email Code (OTP)
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('password');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
                method === 'password'
                  ? 'border-[#004AAD] text-[#004AAD]'
                  : 'border-transparent text-[#7D8795] hover:text-[#2A3547]'
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

          {/* Mode 1: EMAIL OTP SIGNUP / FAST ONBOARDING */}
          {method === 'otp' && (
            <div>
              {otpStep === 'request' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="signup-otp-email">
                      Email address
                    </label>
                    <input
                      id="signup-otp-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      autoComplete="email"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                    />
                    <p className="text-[11px] text-[#7D8795] mt-1.5">
                      We will send a 6-digit code. No password required.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || cooldownSeconds > 0}
                    className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    {loading
                      ? 'Sending code...'
                      : cooldownSeconds > 0
                      ? `Wait ${cooldownSeconds}s`
                      : 'Continue with Email OTP'}
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
                        setOtpStep('request');
                        setOtpToken('');
                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      className="text-xs font-semibold text-[#004AAD] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="signup-otp-token">
                      Enter 6-digit verification code
                    </label>
                    <input
                      id="signup-otp-token"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      autoComplete="one-time-code"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-center font-mono text-xl tracking-[0.4em] text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpToken.length !== 6}
                    className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    {loading ? 'Verifying...' : 'Verify and Create Account'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={loading || cooldownSeconds > 0}
                      onClick={() => void handleSendOtp()}
                      className="text-xs text-[#004AAD] hover:underline font-semibold disabled:text-[#94A3B8] disabled:no-underline"
                    >
                      {cooldownSeconds > 0 ? `Resend code in ${cooldownSeconds}s` : 'Resend verification code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Mode 2: PASSWORD SIGNUP */}
          {method === 'password' && (
            <form onSubmit={handlePasswordSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="signup-fullname">
                  Full name
                </label>
                <input
                  id="signup-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="signup-email">
                  Email address
                </label>
                <input
                  id="signup-email"
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
                <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="signup-password">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                />
                <p className="text-[11px] text-[#7D8795] mt-1">Minimum 8 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A3547] mb-1.5" htmlFor="signup-confirm-password">
                  Confirm password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE2E8] rounded-[8px] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#004AAD] text-white font-semibold rounded-[8px] text-sm hover:bg-[#003882] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                {loading ? 'Creating account...' : 'Create Account with Password'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-[#5D6776]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#004AAD]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
