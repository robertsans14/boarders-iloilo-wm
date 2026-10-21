'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, LogOut, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signup' | 'login'

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user?.email ?? null))
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  function switchMode(nextMode: Mode) {
    setMode(nextMode); setError(''); setMessage(''); setPassword('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.')
    if (mode === 'signup' && password.length < 8) return setError('Use at least 8 characters for your password.')
    const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { full_name: fullName.trim() } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) return setError(mode === 'login' ? 'Invalid email or password.' : 'We could not create your account. Check your details and try again.')
    if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account, then come back to log in.')
    else setMessage(mode === 'signup' ? 'Your account is ready.' : 'You are logged in.')
  }

  async function logout() { await supabase.auth.signOut(); setMessage('You have been logged out.') }

  if (userEmail) return <section className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-sm font-bold uppercase tracking-[.18em] text-amber-600">Student area</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102b4e]">Your profile</h1><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-[#102b4e]"><UserRound /></div><div><h2 className="text-xl font-bold text-[#102b4e]">Welcome back</h2><p className="text-sm text-slate-500">{userEmail}</p></div></div><button onClick={logout} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#102b4e] px-5 font-bold text-white transition hover:bg-[#1b416e]"><LogOut className="size-4" />Log out</button></div></section>

  return <section className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-sm font-bold uppercase tracking-[.18em] text-amber-600">Student area</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102b4e]">Your profile</h1><p className="mt-2 max-w-xl text-slate-500">Create an optional account to keep your housing journey in one place. You can browse every listing without signing up.</p><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Account access"><button role="tab" aria-selected={mode === 'signup'} onClick={() => switchMode('signup')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#102b4e] shadow-sm' : 'text-slate-500'}`}>Sign Up</button><button role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-[#102b4e] shadow-sm' : 'text-slate-500'}`}>Log In</button></div><form onSubmit={submit} className="mt-7 flex flex-col gap-5" noValidate>{mode === 'signup' && <label className="text-sm font-bold text-[#102b4e]">Full Name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="Maria Santos" /></label>}<label className="text-sm font-bold text-[#102b4e]">Email Address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="you@example.com" /></label><label className="text-sm font-bold text-[#102b4e]">Password<div className="relative mt-2"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-12 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{message}</p>}<button type="submit" className="min-h-12 rounded-full bg-amber-400 px-5 font-bold text-[#102b4e] transition hover:bg-amber-300">{mode === 'signup' ? 'Create account' : 'Log in'}</button></form></div></section>
}
