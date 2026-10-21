'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, LogOut, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signup' | 'login'
type ViewingRequest = { id: string; property_id: string; preferred_date: string; preferred_time: string; viewing_mode: string; fee: number; status: string; payment_method: string }

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [requests, setRequests] = useState<ViewingRequest[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadAccount() {
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email ?? null)
      if (data.user) {
        const result = await supabase.from('viewing_requests').select('id, property_id, preferred_date, preferred_time, viewing_mode, fee, status, payment_method').order('created_at', { ascending: false })
        setRequests((result.data ?? []) as ViewingRequest[])
      } else setRequests([])
    }
    loadAccount()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      if (!session) setRequests([])
    })
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

  if (userEmail) return <section className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-sm font-bold uppercase tracking-[.18em] text-amber-600">Student area</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102b4e]">Your profile</h1><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-[#102b4e]"><UserRound /></div><div><h2 className="text-xl font-bold text-[#102b4e]">Welcome back</h2><p className="text-sm text-slate-500">{userEmail}</p></div></div><div className="mt-8 border-t border-slate-100 pt-6"><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-[#102b4e]">My viewing requests</h3><p className="mt-1 text-sm text-slate-500">Your private request history and payment state.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{requests.length}</span></div>{requests.length ? <div className="mt-4 flex flex-col gap-3">{requests.map((request) => <article key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-[#102b4e]">Property {request.property_id}</p><p className="mt-1 text-sm text-slate-500">{request.preferred_date} at {request.preferred_time} · {request.viewing_mode}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#102b4e]">{request.status}</span></div><p className="mt-3 text-sm font-semibold text-amber-700">Viewing fee: ₱{request.fee.toLocaleString('en-PH')} · {request.payment_method}</p></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">No viewing requests yet. Browse listings and request a viewing when you find a room.</p>}</div><button onClick={logout} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#102b4e] px-5 font-bold text-white transition hover:bg-[#1b416e]"><LogOut className="size-4" />Log out</button></div></section>

  return <section className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-sm font-bold uppercase tracking-[.18em] text-amber-600">Student area</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102b4e]">Your profile</h1><p className="mt-2 max-w-xl text-slate-500">Create an optional account to keep your housing journey in one place. You can browse every listing without signing up.</p><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Account access"><button role="tab" aria-selected={mode === 'signup'} onClick={() => switchMode('signup')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#102b4e] shadow-sm' : 'text-slate-500'}`}>Sign Up</button><button role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-[#102b4e] shadow-sm' : 'text-slate-500'}`}>Log In</button></div><form onSubmit={submit} className="mt-7 flex flex-col gap-5" noValidate>{mode === 'signup' && <label className="text-sm font-bold text-[#102b4e]">Full Name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="Maria Santos" /></label>}<label className="text-sm font-bold text-[#102b4e]">Email Address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="you@example.com" /></label><label className="text-sm font-bold text-[#102b4e]">Password<div className="relative mt-2"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-12 font-normal outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{message}</p>}<button type="submit" className="min-h-12 rounded-full bg-amber-400 px-5 font-bold text-[#102b4e] transition hover:bg-amber-300">{mode === 'signup' ? 'Create account' : 'Log in'}</button></form></div></section>
}
