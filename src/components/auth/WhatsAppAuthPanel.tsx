'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { resolveAuthenticatedRoute } from '@/lib/auth-routing';
import { normalizePhoneNumber } from '@/lib/whatsapp/phone';

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+49', label: 'Germany (+49)' },
];

const RESEND_COOLDOWN_SECONDS = 60;

export function maskPhoneNumber(e164: string): string {
  const prefix = COUNTRY_CODES
    .map((country) => country.code)
    .sort((left, right) => right.length - left.length)
    .find((code) => e164.startsWith(code));
  if (!prefix) {
    const digits = e164.replace(/\D/g, '');
    return `+${'*'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
  }
  const national = e164.slice(prefix.length);
  const visibleDigits = national.slice(-4);
  return `${prefix} ${'*'.repeat(Math.max(4, national.length - 4))}${visibleDigits}`;
}

function safeRequestError(status?: number, message?: string): string {
  if (status === 429 || message?.toLowerCase().includes('rate limit')) {
    return 'Please wait before requesting another code.';
  }
  return "We couldn't send a verification code. Please try again.";
}

type WhatsAppAuthPanelProps = {
  requestedPath?: string;
};

export default function WhatsAppAuthPanel({ requestedPath = '/dashboard' }: WhatsAppAuthPanelProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const requestOtp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (cooldown > 0 || loading) return;

    setErrorMessage(null);
    setInfoMessage(null);
    const normalized = normalizePhoneNumber(phoneInput, countryCode);
    if (!normalized.success || !normalized.e164) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized.e164,
        options: {
          shouldCreateUser: true,
          // CAPTCHA can be added here through Supabase's supported captchaToken option.
        },
      });

      if (error) {
        setErrorMessage(safeRequestError(error.status, error.message));
        return;
      }

      setVerifiedPhone(normalized.e164);
      setStep('verify');
      setToken('');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setInfoMessage('If the number can receive WhatsApp messages, a verification code is on its way.');
    } catch {
      setErrorMessage("We couldn't send a verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifiedPhone || !/^\d{6}$/.test(token)) {
      setErrorMessage('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: verifiedPhone,
        token,
        type: 'sms',
      });

      if (error || !data.user || !data.session) {
        setErrorMessage('The verification code is invalid or expired.');
        return;
      }

      const destination = await resolveAuthenticatedRoute(supabase, data.user, requestedPath);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message === 'ACCOUNT_INACTIVE') {
        await supabase.auth.signOut();
        setErrorMessage('Your account is inactive or suspended. Please contact the administrator.');
      } else {
        setErrorMessage('We could not complete sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const changeNumber = () => {
    setStep('request');
    setVerifiedPhone(null);
    setToken('');
    setErrorMessage(null);
    setInfoMessage(null);
  };

  return (
    <div data-testid="whatsapp-auth-panel">
      {errorMessage && (
        <div className="mb-4 rounded-[8px] border border-[#F8B4B4] bg-[#FDECEE] p-3 text-xs font-medium text-[#C52707]" role="alert">
          {errorMessage}
        </div>
      )}
      {infoMessage && (
        <div className="mb-4 rounded-[8px] border border-[#B8DBFF] bg-[#EBF5FF] p-3 text-xs font-medium text-[#004AAD]" role="status">
          {infoMessage}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={requestOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#2A3547]" htmlFor="whatsapp-country">
              Country
            </label>
            <select
              id="whatsapp-country"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="w-full rounded-[8px] border border-[#DCE2E8] bg-white px-3.5 py-2.5 text-sm text-[#2A3547] focus:border-[#004AAD] focus:outline-none focus:ring-1 focus:ring-[#004AAD]"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>{country.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#2A3547]" htmlFor="whatsapp-phone">
              Mobile number
            </label>
            <input
              id="whatsapp-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="98765 43210"
              className="w-full rounded-[8px] border border-[#DCE2E8] bg-white px-3.5 py-2.5 text-sm text-[#2A3547] focus:border-[#004AAD] focus:outline-none focus:ring-1 focus:ring-[#004AAD]"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#7D8795]">
              New here? We will create your Business Owner account after verification.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full rounded-[8px] bg-[#087C3C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#06612F] focus:outline-none focus:ring-2 focus:ring-[#087C3C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Sending code...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Continue with WhatsApp'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#2A3547]">Verify WhatsApp</h3>
            <p className="mt-1 text-xs text-[#5D6776]">Enter the 6-digit code sent to your WhatsApp.</p>
            <p className="mt-2 font-mono text-xs font-semibold text-[#2A3547]" data-testid="masked-whatsapp-phone">
              {verifiedPhone ? maskPhoneNumber(verifiedPhone) : ''}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#2A3547]" htmlFor="whatsapp-token">
              Verification code
            </label>
            <input
              id="whatsapp-token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-[8px] border border-[#DCE2E8] bg-white px-3.5 py-2.5 text-center font-mono text-xl tracking-[0.35em] text-[#2A3547] focus:border-[#004AAD] focus:outline-none focus:ring-1 focus:ring-[#004AAD]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="w-full rounded-[8px] bg-[#087C3C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#06612F] focus:outline-none focus:ring-2 focus:ring-[#087C3C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify and continue'}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <button type="button" onClick={changeNumber} disabled={loading} className="font-semibold text-[#004AAD] hover:underline disabled:opacity-50">
              Change number
            </button>
            <button type="button" onClick={() => void requestOtp()} disabled={loading || cooldown > 0} className="font-semibold text-[#004AAD] hover:underline disabled:text-[#94A3B8] disabled:no-underline">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
