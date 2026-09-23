'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HennaFloralMotif } from '@/components/ui/icons';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user && !data.session) {
          setSuccessMsg(
            'Admin account created! Please check your email inbox to confirm your account before logging in.'
          );
        } else {
          router.push(redirectPath);
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push(redirectPath);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF3EE] border border-[#E8D9CD] flex items-center justify-center text-[#B95945]">
            <HennaFloralMotif size={28} />
          </div>
        </Link>

        <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16]">
          Henna by Aayesha
        </h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#847269] font-medium">
          Admin Portal Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-[#EADFD3]">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#FAF3EE] p-1 mb-6 border border-[#EADBCE]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#4E2714] shadow-xs'
                  : 'text-[#847269] hover:text-[#261B16]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#4E2714] shadow-xs'
                  : 'text-[#847269] hover:text-[#261B16]'
              }`}
            >
              First Time Setup (Register)
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F8D7DA] text-xs text-[#9B2C2C] leading-relaxed">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#EAFBF0] border border-[#D0F4DE] text-xs text-[#1EBE5D] leading-relaxed">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Admin Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hennabyaayesha.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#4E2714] text-white text-sm font-semibold hover:bg-[#381A0E] focus:outline-none focus:ring-2 focus:ring-[#4E2714] focus:ring-offset-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : mode === 'signin' ? (
                'Sign In to Dashboard'
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>

          {/* Quick Guidance Box */}
          <div className="mt-6 pt-5 border-t border-[#F0E5D8] text-xs text-[#847269] space-y-2">
            <p>
              🔒 <strong>Secure Supabase Auth:</strong> Admin accounts are authenticated through your Supabase project.
            </p>
            <p>
              Return to{' '}
              <Link href="/" className="text-[#B95945] font-semibold hover:underline">
                Public Website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
