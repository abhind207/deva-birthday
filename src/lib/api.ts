import { supabase } from './supabase'

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function uuid(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()

  const b = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(b)
  } else {
    for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256)
  }

  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

let memoryId: string | null = null
export function getSessionId(): string {
  try {
    let id = localStorage.getItem('deva.sid')
    if (!id) {
      id = uuid()
      localStorage.setItem('deva.sid', id)
    }
    return id
  } catch {
    return (memoryId ??= uuid())
  }
}

/* ---- Small retry queue for non-critical writes (answers, analytics, NO attempts) ---- */
interface Pending { fn: string; args: Record<string, unknown>; tries: number }
const QKEY = 'deva.pending'

function readQueue(): Pending[] {
  try { return JSON.parse(localStorage.getItem(QKEY) || '[]') as Pending[] } catch { return [] }
}
function writeQueue(q: Pending[]) {
  try { localStorage.setItem(QKEY, JSON.stringify(q.slice(-60))) } catch { /* storage unavailable */ }
}

async function call(fn: string, args: Record<string, unknown>): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.rpc(fn, args)
    if (error) throw error
    return true
  } catch (e) {
    console.warn(`[supabase] ${fn} failed`, e)
    return false
  }
}

let flushing = false
async function flush() {
  if (flushing) return
  flushing = true
  try {
    const q = readQueue()
    const keep: Pending[] = []
    for (const item of q) {
      if (!(await call(item.fn, item.args)) && item.tries < 5) keep.push({ ...item, tries: item.tries + 1 })
    }
    writeQueue(keep)
  } finally { flushing = false }
}

async function rpc(fn: string, args: Record<string, unknown>, queue = true): Promise<boolean> {
  if (!supabase) {
    if (import.meta.env.DEV) console.warn(`[supabase] not configured — "${fn}" was not saved`)
    return false
  }
  const ok = await call(fn, args)
  if (ok) { if (readQueue().length) void flush() }
  else if (queue) writeQueue([...readQueue(), { fn, args, tries: 1 }])
  return ok
}

export const track = (event: 'page_view' | 'questions_completed' | 'music_play', path: string) =>
  rpc('track_event', { p_session: getSessionId(), p_event: event, p_path: path, p_meta: {} })

export const saveAnswer = (n: number, text: string | null, choice: string | null) =>
  rpc('save_answer', { p_session: getSessionId(), p_number: n, p_text: text, p_choice: choice })

export const recordNo = () =>
  rpc('proposal_no_attempt', { p_session: getSessionId(), p_at: new Date().toISOString() })

export const recordYes = () => rpc('proposal_yes', { p_session: getSessionId() })

// Replies are never queued: the person must know whether the message actually reached Abhi.
export const submitReply = (text: string | null, status: 'submitted' | 'skipped') =>
  rpc('submit_reply', { p_session: getSessionId(), p_text: text, p_status: status }, false)

export const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([p, sleep(ms).then(() => fallback)])
