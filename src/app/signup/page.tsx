'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function signup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null); setLoading(true);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!fullName || password.length < 8 || password !== String(form.get('confirmPassword') || '')) { setMessage('Use a full name, matching passwords, and at least 8 password characters.'); setLoading(false); return; }
    const { data, error } = await createClient().auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/dashboard` } });
    if (error) { setMessage(error.message); setLoading(false); return; }
    if (data.session) router.replace('/dashboard'); else setMessage('Check your email to complete account confirmation.');
    setLoading(false);
  }
  return <main className="min-h-screen bg-[#F2F5FA] flex items-center justify-center p-6"><form onSubmit={signup} className="w-full max-w-md space-y-4 rounded-xl border border-[#DCE2E8] bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-[#2A3547]">Create your Buzl owner account</h1><p className="text-sm text-[#5D6776]">Create listings as drafts and submit them for Buzl review.</p>{message && <p role="alert" className="rounded bg-[#FDECEE] p-3 text-sm text-[#C52707]">{message}</p>}<label className="block text-sm font-medium">Full name<input name="fullName" required className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" minLength={8} required className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm font-medium">Confirm password<input name="confirmPassword" type="password" minLength={8} required className="mt-1 w-full rounded border p-2" /></label><button disabled={loading} className="w-full rounded bg-[#004AAD] py-2 font-semibold text-white disabled:opacity-50">{loading ? 'Creating account…' : 'Create account'}</button><p className="text-center text-sm">Already have an account? <Link className="text-[#004AAD]" href="/login">Sign in</Link></p></form></main>;
}
