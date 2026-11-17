import { useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { QUESTIONS } from '../data/content'
import { fmt, shortId, type MusicRow } from './types'
import type { AdminData } from './useAdminData'

const card = 'rounded-xl border border-gold/15 bg-ink2 p-5'
const label = 'text-[11px] font-medium uppercase tracking-[.16em] text-mauve/80'

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className={card}>
      <div className={label}>{title}</div>
      <div className="mt-3 text-4xl font-light tabular-nums text-gold">{value}</div>
    </div>
  )
}

export function Header({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gold/15 pb-4">
      <div>
        <h2 className="text-xl font-medium text-[#EFE7E2]">{title}</h2>
        {sub && <p className="mt-1 text-sm text-[#EFE7E2]/55">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true } catch {
    const ta = document.createElement('textarea')
    ta.value = t
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => { if (await copyText(text)) { setDone(true); setTimeout(() => setDone(false), 1500) } }}
      className="rounded-md border border-gold/30 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10"
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

const distinct = (rows: { session_id: string }[]) => new Set(rows.map((r) => r.session_id)).size

export function Overview({ d }: { d: AdminData }) {
  const views = d.analytics.filter((a) => a.event_type === 'page_view')
  const onPath = (p: string) => distinct(views.filter((v) => v.path === p))
  const completed = distinct(d.analytics.filter((a) => a.event_type === 'questions_completed'))
  return (
    <>
      <Header title="Overview" sub="Counted from real visits only — nothing here is sample data." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat title="Total visitors" value={distinct(d.analytics)} />
        <Stat title="Completed questions" value={completed} />
        <Stat title="Proposal page visits" value={onPath('/proposal')} />
        <Stat title="YES selections" value={d.proposals.filter((p) => p.final_choice === 'yes').length} />
        <Stat title="NO attempts" value={d.proposals.reduce((n, p) => n + p.no_attempts, 0)} />
        <Stat title="Letter page visits" value={onPath('/letter')} />
        <Stat title="Replies submitted" value={d.replies.filter((r) => r.status === 'submitted').length} />
        <Stat title="Replies skipped" value={d.replies.filter((r) => r.status === 'skipped').length} />
      </div>
      <p className="mt-6 text-xs text-[#EFE7E2]/40">Visitors are counted per browser (an anonymous id stored on the device). Visits are distinct browsers per page.</p>
    </>
  )
}

export function QuestionsPanel({ d }: { d: AdminData }) {
  const bySession = new Map<string, typeof d.questions>()
  d.questions.forEach((r) => bySession.set(r.session_id, [...(bySession.get(r.session_id) ?? []), r]))
  const sessions = [...bySession.entries()]
  return (
    <>
      <Header title="Question responses" sub="Exact answers, as typed." />
      {sessions.length === 0 && <p className="text-[#EFE7E2]/55">No answers yet.</p>}
      <div className="space-y-5">
        {sessions.map(([sid, rows]) => (
          <div key={sid} className={card}>
            <div className="mb-4 flex items-center justify-between text-xs text-[#EFE7E2]/45">
              <span>Session {shortId(sid)}</span>
              <span>Last update {fmt(rows.map((r) => r.updated_at).sort().pop())}</span>
            </div>
            <div className="space-y-4">
              {QUESTIONS.map((q) => {
                const r = rows.find((x) => x.question_number === q.n)
                return (
                  <div key={q.n} className="border-l-2 border-dusty/60 pl-4">
                    <div className={label}>Question {q.n}</div>
                    <div className="mt-1 text-sm text-[#EFE7E2]/60">{q.text}</div>
                    {r ? (
                      <>
                        <div className="mt-2 whitespace-pre-wrap break-words text-base text-[#F4E9E3]">
                          {r.answer_choice ? r.answer_choice.toUpperCase() : r.answer_text}
                        </div>
                        <div className="mt-1 text-xs text-[#EFE7E2]/40">Saved {fmt(r.created_at)}{r.updated_at !== r.created_at && ` · edited ${fmt(r.updated_at)}`}</div>
                      </>
                    ) : <div className="mt-2 text-sm italic text-[#EFE7E2]/35">Not answered</div>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function ProposalPanel({ d }: { d: AdminData }) {
  const total = d.proposals.reduce((n, p) => n + p.no_attempts, 0)
  const yes = d.proposals.filter((p) => p.final_choice === 'yes').length
  return (
    <>
      <Header title="Proposal responses" />
      <div className="mb-6 grid grid-cols-2 gap-4"><Stat title="Total NO attempts" value={total} /><Stat title="YES selections" value={yes} /></div>
      {d.proposals.length === 0 && <p className="text-[#EFE7E2]/55">No proposal interactions yet.</p>}
      <div className="space-y-4">
        {d.proposals.map((p) => (
          <div key={p.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#EFE7E2]/45">Session {shortId(p.session_id)}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.final_choice === 'yes' ? 'bg-gold/20 text-gold' : 'bg-white/5 text-[#EFE7E2]/55'}`}>
                {p.final_choice === 'yes' ? 'Final: YES' : 'No final selection yet'}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className={label}>NO attempts</dt><dd className="mt-1 tabular-nums text-[#F4E9E3]">{p.no_attempts}</dd></div>
              <div><dt className={label}>First interaction</dt><dd className="mt-1 text-[#F4E9E3]">{fmt(p.first_seen_at)}</dd></div>
              <div><dt className={label}>YES at</dt><dd className="mt-1 text-[#F4E9E3]">{fmt(p.final_at)}</dd></div>
            </dl>
            {p.no_attempt_times.length > 0 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-gold">NO attempt timestamps ({p.no_attempt_times.length})</summary>
                <ol className="mt-2 max-h-56 list-decimal space-y-1 overflow-auto pl-5 text-[#EFE7E2]/65">
                  {p.no_attempt_times.map((t, i) => <li key={i}>{fmt(t)}</li>)}
                </ol>
              </details>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export function RepliesPanel({ d }: { d: AdminData }) {
  return (
    <>
      <Header title="Personal replies" />
      {d.replies.length === 0 && <p className="text-[#EFE7E2]/55">No replies yet.</p>}
      <div className="space-y-4">
        {d.replies.map((r) => (
          <div key={r.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.status === 'submitted' ? 'bg-gold/20 text-gold' : 'bg-white/5 text-[#EFE7E2]/55'}`}>{r.status}</span>
                <span className="text-xs text-[#EFE7E2]/45">{fmt(r.created_at)} · session {shortId(r.session_id)}</span>
              </div>
              {r.reply_text && <CopyButton text={r.reply_text} />}
            </div>
            {r.reply_text
              ? <p className="mt-4 whitespace-pre-wrap break-words text-base leading-relaxed text-[#F4E9E3]">{r.reply_text}</p>
              : <p className="mt-4 text-sm italic text-[#EFE7E2]/40">Chose “Maybe Later” — no message.</p>}
          </div>
        ))}
      </div>
    </>
  )
}

export function MusicPanel({ music, onChanged }: { music: MusicRow | null; onChanged: () => void }) {
  const sb = supabase
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [fade, setFade] = useState(String(music?.fade_out_seconds ?? 3))
  if (!sb) return null
  const url = music?.file_path ? sb.storage.from('music').getPublicUrl(music.file_path).data.publicUrl : null

  const run = async (fn: () => Promise<string>) => {
    setBusy(true)
    setMsg(null)
    try { setMsg({ ok: true, text: await fn() }); onChanged() } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) }) }
    setBusy(false)
  }
  const update = async (patch: Partial<MusicRow>) => {
    const { error } = await sb.from('music_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1)
    if (error) throw new Error(error.message)
  }

  const upload = (file: File) => run(async () => {
    if (!/\.mp3$/i.test(file.name) && file.type !== 'audio/mpeg') throw new Error('Please choose an MP3 file.')
    if (file.size > 20 * 1024 * 1024) throw new Error('File is larger than 20 MB.')
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`
    const up = await sb.storage.from('music').upload(path, file, { contentType: 'audio/mpeg', cacheControl: '3600', upsert: false })
    if (up.error) throw new Error(up.error.message)
    const old = music?.file_path
    await update({ file_path: path, file_name: file.name, ...(old ? {} : { enabled: true }) })
    if (old) await sb.storage.from('music').remove([old])
    return old ? 'Music replaced.' : 'Music uploaded and enabled.'
  })

  const remove = () => run(async () => {
    if (!music?.file_path) return 'Nothing to remove.'
    const rm = await sb.storage.from('music').remove([music.file_path])
    if (rm.error) throw new Error(rm.error.message)
    await update({ file_path: null, file_name: null, enabled: false })
    return 'Music removed.'
  })

  const toggle = () => run(async () => { await update({ enabled: !music?.enabled }); return music?.enabled ? 'Music disabled.' : 'Music enabled.' })

  const saveFade = () => run(async () => {
    const n = Number(fade)
    if (!Number.isFinite(n) || n < 0.5 || n > 15) throw new Error('Fade-out must be between 0.5 and 15 seconds.')
    await update({ fade_out_seconds: Math.round(n * 10) / 10 })
    return 'Fade-out duration saved.'
  })

  const btn = 'rounded-lg border border-gold/30 px-4 py-2 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-40'
  return (
    <>
      <Header title="Music" sub="Plays on the welcome, questions and proposal pages. Fades out when she says YES." />
      <div className={`${card} space-y-6`}>
        <div>
          <div className={label}>Current track</div>
          <div className="mt-2 text-[#F4E9E3]">{music?.file_name ?? 'No file uploaded'}</div>
          {url && <audio controls src={url} className="mt-3 w-full" preload="none" />}
          <div className="mt-4 flex flex-wrap gap-3">
            <input ref={fileRef} type="file" accept=".mp3,audio/mpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = '' }} />
            <button className={btn} disabled={busy} onClick={() => fileRef.current?.click()}>{music?.file_path ? 'Replace MP3' : 'Upload MP3'}</button>
            <button className={btn} disabled={busy || !music?.file_path} onClick={() => void remove()}>Remove</button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gold/10 pt-5">
          <div>
            <div className="text-[#F4E9E3]">Music on the public site</div>
            <div className="text-sm text-[#EFE7E2]/50">{music?.file_path ? (music.enabled ? 'Enabled' : 'Disabled') : 'Upload a file first'}</div>
          </div>
          <button role="switch" aria-checked={!!music?.enabled} disabled={busy || !music?.file_path} onClick={() => void toggle()}
            className={`relative h-7 w-12 rounded-full transition disabled:opacity-40 ${music?.enabled ? 'bg-gold' : 'bg-white/15'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-ink transition-all ${music?.enabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className="border-t border-gold/10 pt-5">
          <label className={label} htmlFor="fade">Fade-out duration (seconds)</label>
          <div className="mt-2 flex gap-3">
            <input id="fade" value={fade} onChange={(e) => setFade(e.target.value)} inputMode="decimal"
              className="w-28 rounded-lg border border-gold/25 bg-ink px-3 py-2 text-[#F4E9E3] outline-none focus:border-gold" />
            <button className={btn} disabled={busy} onClick={() => void saveFade()}>Save</button>
          </div>
        </div>
        {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-gold' : 'text-[#E58BA3]'}`}>{msg.text}</p>}
      </div>
    </>
  )
}
