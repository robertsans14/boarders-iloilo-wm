'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, Check, Clipboard, FileCheck2, LogIn, RefreshCw, Search, ShieldAlert, UserRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'requests' | 'reviews' | 'complaints' | 'guides' | 'schedule'
type RequestRow = { id: string; full_name: string; email: string; mobile: string; property_id: string; preferred_date: string; preferred_time: string; viewing_mode: string; fee: number; status: string; notes: string | null; payment_method: string }
type PropertyContact = { id: string; title: string; details: Record<string, unknown> | null }
type ComplaintRow = { id: string; property_id: string | null; category: string; description: string; status: string; created_at: string; student_id: string }
type GuideRow = { id: string; full_name: string; email: string; school: string; service_area: string; availability: string; status: string; created_at: string }

const tabs: { id: Tab; label: string; icon: typeof CalendarClock }[] = [
  { id: 'requests', label: 'Viewing requests', icon: CalendarClock },
  { id: 'reviews', label: 'Property reviews', icon: FileCheck2 },
  { id: 'complaints', label: 'Complaints', icon: ShieldAlert },
  { id: 'guides', label: 'Guide applications', icon: UserRound },
  { id: 'schedule', label: 'Schedule decisions', icon: RefreshCw },
]

export function AdminPortal() {
  const supabase = useMemo(() => createClient(), [])
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('requests')
  const [query, setQuery] = useState('')
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [propertyContacts, setPropertyContacts] = useState<Record<string, PropertyContact>>({})
  const [complaints, setComplaints] = useState<ComplaintRow[]>([])
  const [guides, setGuides] = useState<GuideRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setIsAdmin(false); setLoading(false); return }
    const { data: admin } = await supabase.rpc('is_admin')
    setIsAdmin(Boolean(admin))
    if (!admin) { setLoading(false); return }
    const [requestsResult, propertiesResult, complaintsResult, guidesResult] = await Promise.all([
      supabase.from('viewing_requests').select('id, full_name, email, mobile, property_id, preferred_date, preferred_time, viewing_mode, fee, status, notes, payment_method').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, title, details'),
      supabase.from('complaints').select('id, property_id, category, description, status, created_at, student_id').order('created_at', { ascending: false }),
      supabase.from('student_guide_applications').select('id, full_name, email, school, service_area, availability, status, created_at').order('created_at', { ascending: false }),
    ])
    if (requestsResult.error || propertiesResult.error || complaintsResult.error || guidesResult.error) setError('Some admin records could not be loaded.')
    setRequests((requestsResult.data ?? []) as RequestRow[])
    setPropertyContacts(Object.fromEntries(((propertiesResult.data ?? []) as PropertyContact[]).map((property) => [property.id, property])))
    setComplaints((complaintsResult.data ?? []) as ComplaintRow[])
    setGuides((guidesResult.data ?? []) as GuideRow[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [supabase])

  const filteredRequests = requests.filter((item) => `${item.full_name} ${item.email} ${item.property_id} ${item.status}`.toLowerCase().includes(query.toLowerCase()))
  const filteredComplaints = complaints.filter((item) => `${item.category} ${item.property_id ?? ''} ${item.status} ${item.description}`.toLowerCase().includes(query.toLowerCase()))
  const filteredGuides = guides.filter((item) => `${item.full_name} ${item.email} ${item.school} ${item.status}`.toLowerCase().includes(query.toLowerCase()))
  const pendingRequests = requests.filter((item) => item.status === 'Pending' || item.status === 'Pending Admin Review').length
  const pendingGuides = guides.filter((item) => item.status === 'Pending Review').length
  const openComplaints = complaints.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length

  async function updateRequest(id: string, status: string) {
    setError(''); setNotice('')
    const note = status === 'Rejected' ? window.prompt('Optional rejection reason') : null
    if (status === 'Rejected' && note === null) return
    const { error: updateError } = await supabase.rpc('admin_update_request', { request_id: id, next_status: status, note })
    if (updateError) return setError('Request update was not saved.')
    setNotice(`Request marked ${status}. The student was notified.`)
    await load()
  }

  async function copyRequest(item: RequestRow) {
    await navigator.clipboard.writeText(`Boarders Iloilo viewing request ${item.id}\nStudent: ${item.full_name} (${item.email}, ${item.mobile})\nProperty: ${item.property_id}\nSchedule: ${item.preferred_date} at ${item.preferred_time}\nMode: ${item.viewing_mode}\nFee: ₱${item.fee.toLocaleString('en-PH')} via ${item.payment_method}\nStatus: ${item.status}\nNotes: ${item.notes ?? 'None'}`)
    setNotice('Request summary copied. External contact has not been marked as sent.')
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-6 text-[#102b4e]"><RefreshCw className="size-6 animate-spin" aria-label="Loading admin portal" /></main>
  if (isAdmin === false) return <main className="min-h-screen bg-[#f7f8fa] px-4 py-16 text-[#102b4e] sm:px-6"><div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"><LogIn className="mx-auto size-10 text-amber-500" /><h1 className="mt-4 text-2xl font-bold">Admin access required</h1><p className="mt-2 text-slate-500">Sign in with an authorized administrator account to open this portal.</p><a className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#102b4e] px-5 font-bold text-white" href="/profile">Go to Profile</a></div></main>

  return <main className="min-h-screen bg-[#f7f8fa] pb-10 text-[#102b4e]"><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-600">Boarders Iloilo</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Admin operations</h1><p className="mt-2 text-sm text-slate-500">Review decisions, protect student data, and keep viewing workflows moving.</p></div><button onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50"><RefreshCw className="size-4" />Refresh</button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Pending requests" value={pendingRequests} icon={CalendarClock} /><Metric label="Open complaints" value={openComplaints} icon={AlertTriangle} /><Metric label="Guide applications" value={pendingGuides} icon={UserRound} /><Metric label="Schedule decisions" value={requests.filter((item) => ['Reschedule Requested', 'Cancelled'].includes(item.status)).length} icon={RefreshCw} /></div></div></header><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><div className="flex gap-2 overflow-x-auto pb-2" role="tablist">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} role="tab" aria-selected={tab === id} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold ${tab === id ? 'bg-[#102b4e] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}><Icon className="size-4" />{label}</button>)}</div><div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4"><Search className="size-4 shrink-0 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full bg-transparent text-sm outline-none" placeholder="Search records" aria-label="Search admin records" /></div>{notice && <p role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}{error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}<section className="mt-6">{tab === 'requests' && <div className="grid gap-4">{filteredRequests.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Request {item.id.slice(0, 8)}</p><h2 className="mt-1 text-lg font-bold">{item.full_name} · {item.property_id}</h2><p className="mt-1 text-sm text-slate-500">{item.email} · {item.mobile}</p></div><span className="h-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{item.status}</span></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Schedule:</strong> {item.preferred_date} at {item.preferred_time}</p><p><strong>Mode:</strong> {item.viewing_mode}</p><p><strong>Fee:</strong> ₱{item.fee.toLocaleString('en-PH')} · {item.payment_method}</p><p><strong>Notes:</strong> {item.notes || 'None'}</p></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => void copyRequest(item)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold"><Clipboard className="size-4" />Copy summary</button><button onClick={() => void updateRequest(item.id, 'Approved')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-bold text-white"><Check className="size-4" />Approve</button><button onClick={() => void updateRequest(item.id, 'Rejected')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-bold text-white"><X className="size-4" />Reject</button></div></article>)}{!filteredRequests.length && <Empty text="No viewing requests match this search." />}</div>}{tab === 'complaints' && <div className="grid gap-4">{filteredComplaints.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Report {item.id.slice(0, 8)}</p><h2 className="mt-1 font-bold">{item.category}{item.property_id ? ` · ${item.property_id}` : ''}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.status}</span></div><p className="mt-4 text-sm text-slate-600">{item.description}</p><p className="mt-3 text-xs text-slate-400">Submitted {new Date(item.created_at).toLocaleString('en-PH')}</p></article>)}{!filteredComplaints.length && <Empty text="No complaints match this search." />}</div>}{tab === 'guides' && <div className="grid gap-4">{filteredGuides.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Application {item.id.slice(0, 8)}</p><h2 className="mt-1 font-bold">{item.full_name}</h2><p className="mt-1 text-sm text-slate-500">{item.email} · {item.school}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{item.status}</span></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Service area:</strong> {item.service_area}</p><p><strong>Availability:</strong> {item.availability}</p><p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleDateString('en-PH')}</p></div></article>)}{!filteredGuides.length && <Empty text="No guide applications match this search." />}</div>}{tab === 'reviews' && <Empty text="Review moderation is reserved for verified completed stays; no review queue is currently available." />}{tab === 'schedule' && <div className="grid gap-4">{requests.filter((item) => ['Reschedule Requested', 'Cancelled'].includes(item.status)).map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">{item.full_name} · {item.property_id}</h2><p className="mt-2 text-sm text-slate-500">Current status: {item.status}. Review the request details before contacting the landlord.</p><button onClick={() => void copyRequest(item)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold"><Clipboard className="size-4" />Copy landlord summary</button></article>)}{!requests.some((item) => ['Reschedule Requested', 'Cancelled'].includes(item.status)) && <Empty text="No cancellation or reschedule decisions are waiting." />}</div>}</section></div></main>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof CalendarClock }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><Icon className="size-4 text-amber-600" /><p className="mt-2 text-2xl font-bold">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div> }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">{text}</div> }
