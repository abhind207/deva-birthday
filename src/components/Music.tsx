import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { track } from '../lib/api'

const TARGET_VOLUME = 0.6
const KEY = 'deva.music'

interface Ctx {
  available: boolean
  playing: boolean
  muted: boolean
  retired: boolean
  toggle: () => void
  toggleMute: () => void
  fadeOutAndStop: () => Promise<void>
}
const MusicContext = createContext<Ctx | null>(null)

function readSaved(): { muted: boolean; retired: boolean } {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || '{}') as { muted?: boolean; retired?: boolean }
    return { muted: !!v.muted, retired: !!v.retired }
  } catch {
    return { muted: false, retired: false }
  }
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const saved = useMemo(readSaved, [])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeSecRef = useRef(3)
  const mutedRef = useRef(saved.muted)
  const rafRef = useRef<number | null>(null)
  const loggedRef = useRef(false)
  const [available, setAvailable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(saved.muted)
  const [retired, setRetired] = useState(saved.retired)

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ muted, retired })) } catch { /* ignore */ }
  }, [muted, retired])

  // Load admin-managed music settings once per visit (the <audio> element lives above the router, so it survives navigation).
  useEffect(() => {
    const sb = supabase
    if (!sb) return
    let cancelled = false
    void sb
      .from('music_settings')
      .select('enabled,file_path,fade_out_seconds')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data || !data.enabled || !data.file_path) return
        const url = sb.storage.from('music').getPublicUrl(data.file_path as string).data.publicUrl
        const a = new Audio(url)
        a.loop = true
        a.preload = 'auto'
        a.volume = TARGET_VOLUME
        a.muted = mutedRef.current
        audioRef.current = a
        fadeSecRef.current = Number(data.fade_out_seconds) || 3
        setAvailable(true)
      })
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      a.volume = TARGET_VOLUME
      a.play().then(
        () => {
          setPlaying(true)
          if (!loggedRef.current) { loggedRef.current = true; void track('music_play', window.location.pathname) }
        },
        (e) => console.warn('[music] playback blocked', e),
      )
    } else {
      a.pause()
      setPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const a = audioRef.current
    const next = !mutedRef.current
    mutedRef.current = next
    if (a) a.muted = next
    setMuted(next)
  }, [])

  const fadeOutAndStop = useCallback(
    () =>
      new Promise<void>((resolve) => {
        setRetired(true) // never restarts again during this visit
        const a = audioRef.current
        if (!a || a.paused) return resolve()
        const ms = Math.max(300, fadeSecRef.current * 1000)
        const from = a.volume
        const t0 = performance.now()
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / ms)
          a.volume = Math.max(0, from * (1 - k) * (1 - k))
          if (k < 1) {
            rafRef.current = requestAnimationFrame(step)
          } else {
            a.pause()
            a.currentTime = 0
            a.volume = TARGET_VOLUME
            setPlaying(false)
            resolve()
          }
        }
        rafRef.current = requestAnimationFrame(step)
      }),
    [],
  )

  const value = useMemo(
    () => ({ available, playing, muted, retired, toggle, toggleMute, fadeOutAndStop }),
    [available, playing, muted, retired, toggle, toggleMute, fadeOutAndStop],
  )
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic(): Ctx {
  const c = useContext(MusicContext)
  if (!c) throw new Error('useMusic must be used inside MusicProvider')
  return c
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
const ICONS = {
  play: 'M8 5.5v13l11-6.5z',
  pause: 'M8 5v14M16 5v14',
  vol: 'M4 9.5v5h4l5 4v-13l-5 4zM16.5 9a4 4 0 010 6M18.8 6.7a7.3 7.3 0 010 10.6',
  mute: 'M4 9.5v5h4l5 4v-13l-5 4zM17 9.5l4 5M21 9.5l-4 5',
  note: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
}

const MUSIC_ROUTES = ['/', '/questions', '/proposal']

export function MusicControl() {
  const { pathname } = useLocation()
  const m = useMusic()
  if (!m.available || m.retired || !MUSIC_ROUTES.includes(pathname)) return null
  const dark = pathname === '/proposal'
  const base = `fixed z-40 right-4 flex items-center gap-1 rounded-full border border-gold/60 px-1.5 py-1.5 shadow-lg backdrop-blur-md transition-colors bottom-[max(1rem,env(safe-area-inset-bottom))] ${
    dark ? 'bg-wine/50 text-ivory' : 'bg-ivory/60 text-wine'
  }`
  const round = 'flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gold/25'

  if (!sessionStarted) {
    return (
      <button onClick={() => { sessionStarted = true; m.toggle() }} className={`${base} gap-2 pl-4 pr-5 font-sans text-[.8rem] tracking-wide`} aria-label="Play some music">
        <Icon d={ICONS.note} />
        Play some music?
      </button>
    )
  }
  return (
    <div className={base} role="group" aria-label="Music controls">
      <button onClick={m.toggle} className={round} aria-label={m.playing ? 'Pause music' : 'Play music'}>
        <Icon d={m.playing ? ICONS.pause : ICONS.play} />
      </button>
      <button onClick={m.toggleMute} className={round} aria-label={m.muted ? 'Unmute music' : 'Mute music'}>
        <Icon d={m.muted ? ICONS.mute : ICONS.vol} />
      </button>
    </div>
  )
}

// Once the visitor has pressed play, the prompt turns into compact controls for the rest of the visit.
let sessionStarted = false
