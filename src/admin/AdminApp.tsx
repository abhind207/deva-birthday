import { useEffect, useState, type FormEvent } from 'react'
import { isConfigured, supabase } from '../lib/supabase'
import { useAdminData } from './useAdminData'
import { MusicPanel, Overview, ProposalPanel, QuestionsPanel, RepliesPanel } from './panels'

type Auth = 'loading' | 'anon' | 'denied' | 'ok'
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'questions', label: 'Questions' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'replies', label: 'Replies' },
  { id: 'music', label: 'Music' },
] as const
type Tab = (typeof TABS)[number]['id']

const shell = 'min-h-screen bg-ink font-sans text-[#EFE7E2] antialiased'

function Login({ denied }: { denied: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      const message = err.message || 'Unknown sign-in error.'
      const friendly = message.toLowerCase().includes('invalid login credentials')
        ? 'The email or password is incorrect for this Supabase project.'
        : `Sign-in failed: ${message}`
      setError(friendly)
    }

    setBusy(false)
  }
  const input = 'w-full rounded-lg border border-gold/25 bg-ink px-4 py-3 text-[#F4E9E3] outline-none transition focus:border-gold'
  return (
    <div className={`${shell} flex items-center justify-center px-5`}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-gold/20 bg-ink2 p-8 shadow-2xl">
        <div className="mb-1 h-0.5 w-10 bg-gold" />
        <h1 className="mt-4 text-xl font-medium">Console sign-in</h1>
        <p className="mt-1 text-sm text-[#EFE7E2]/50">Authorized administrators only.</p>
        {denied && <p className="mt-4 rounded-lg bg-[#E58BA3]/10 p-3 text-sm text-[#E58BA3]">This account is not an administrator. Sign in with a different account.</p>}
        <label className="mt-6 block text-[11px] uppercase tracking-[.16em] text-mauve/80" htmlFor="em">Email</label>
        <input id="em" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-2`} />
        <label className="mt-4 block text-[11px] uppercase tracking-[.16em] text-mauve/80" htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mt-2`} />
        {error && <p role="alert" className="mt-4 text-sm text-[#E58BA3]">{error}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-gold py-3 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {denied && <button type="button" onClick={() => void supabase?.auth.signOut()} className="mt-3 w-full text-sm text-[#EFE7E2]/50 hover:text-gold">Sign out</button>}
      </form>
    </div>
  )
}

function Dashboard() {
  const { data, loading, error, reload } = useAdminData()
  const [tab, setTab] = useState<Tab>('overview')
  return (
    <div className={`${shell} lg:flex`}>
      <aside className="border-b border-gold/15 bg-ink2 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 pt-5 lg:block">
          <div>
            <div className="h-0.5 w-8 bg-gold" />
            <div className="mt-3 text-sm font-medium tracking-wide">Surprise Console</div>
            <div className="text-xs text-[#EFE7E2]/40">Private · admin</div>
          </div>
          <button onClick={() => void supabase?.auth.signOut()} className="text-xs text-[#EFE7E2]/50 hover:text-gold lg:mt-8 lg:block">Sign out</button>
        </div>
        <nav className="hide-scrollbar mt-4 flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-lg px-4 py-2.5 text-left text-sm transition ${tab === t.id ? 'bg-wine text-gold' : 'text-[#EFE7E2]/65 hover:bg-white/5'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-end gap-3 text-xs text-[#EFE7E2]/45">
            {loading && <span>Loading…</span>}
            <button onClick={() => void reload()} className="rounded-md border border-gold/25 px-3 py-1.5 text-gold hover:bg-gold/10">Refresh</button>
          </div>
          {error && <p role="alert" className="mb-5 rounded-lg bg-[#E58BA3]/10 p-3 text-sm text-[#E58BA3]">Could not load some data: {error}</p>}
          {tab === 'overview' && <Overview d={data} />}
          {tab === 'questions' && <QuestionsPanel d={data} />}
          {tab === 'proposal' && <ProposalPanel d={data} />}
          {tab === 'replies' && <RepliesPanel d={data} />}
          {tab === 'music' && <MusicPanel key={data.music?.updated_at ?? 'none'} music={data.music} onChanged={() => void reload()} />}
        </div>
      </main>
    </div>
  )
}

export default function AdminApp() {
  const [auth, setAuth] = useState<Auth>('loading')

  useEffect(() => {
    document.title = 'Console'
    const sb = supabase
    if (!sb) return
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      // Defer: calling Supabase inside this callback can deadlock the auth client.
      setTimeout(async () => {
        if (!session) return setAuth('anon')
        const { data, error } = await sb.rpc('is_admin')
        setAuth(!error && data === true ? 'ok' : 'denied')
      }, 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <div className={`${shell} flex items-center justify-center px-5`}>
        <div className="max-w-md rounded-2xl border border-gold/20 bg-ink2 p-8">
          <h1 className="text-lg font-medium">Supabase is not configured</h1>
          <p className="mt-3 text-sm text-[#EFE7E2]/60">Copy <code>.env.example</code> to <code>.env</code>, set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server. See README.md.</p>
        </div>
      </div>
    )
  }
  if (auth === 'loading') return <div className={shell} />
  if (auth === 'ok') return <Dashboard />
  return <Login denied={auth === 'denied'} />
}
