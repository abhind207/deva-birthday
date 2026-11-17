import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Button from '../components/Button'
import { submitReply, withTimeout } from '../lib/api'

type View = 'write' | 'sent' | 'later'
const DRAFT = 'deva.replyDraft'

export default function Reply() {
  const [view, setView] = useState<View>('write')
  const [text, setText] = useState(() => { try { return localStorage.getItem(DRAFT) || '' } catch { return '' } })
  const [busy, setBusy] = useState<'' | 'send' | 'skip'>('')
  const [error, setError] = useState('')

  useEffect(() => {
    try { localStorage.setItem(DRAFT, text) } catch { /* ignore */ }
  }, [text])

  const send = async () => {
    if (!text.trim()) { setError('Write a few words first, or choose “Maybe Later”.'); return }
    setBusy('send')
    setError('')
    const ok = await withTimeout(submitReply(text, 'submitted'), 12000, false)
    setBusy('')
    if (ok) {
      try { localStorage.removeItem(DRAFT) } catch { /* ignore */ }
      setView('sent')
    } else {
      setError("Your message couldn't be sent just now. It's still here — please try again in a moment.")
    }
  }

  const later = async () => {
    setBusy('skip')
    setError('')
    await withTimeout(submitReply(null, 'skipped'), 4000, false)
    setBusy('')
    setView('later')
  }

  return (
    <PageShell particles={8}>
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col justify-center px-5 py-12">
        <AnimatePresence mode="wait">
          {view === 'write' && (
            <motion.section key="write" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.8 }}>
              <h1 className="font-display text-4xl leading-tight sm:text-6xl">Your words matter.</h1>
              <p className="mt-4 font-serif text-2xl italic text-wine/80 sm:text-[1.7rem]">Whatever is in your heart, I'd love to hear it.</p>
              <div className="relative mt-9 rounded-[1.25rem] border border-gold/60 bg-ivory/75 p-2 shadow-[0_40px_80px_-45px_rgba(64,30,48,.4)] backdrop-blur-sm">
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setError('') }}
                  rows={9}
                  maxLength={8000}
                  aria-label="Your reply"
                  placeholder="Start writing…"
                  className="journal-lines block w-full resize-none rounded-[1rem] bg-transparent px-5 pb-2 pt-[.45rem] font-serif text-[1.4rem] leading-[2.1rem] text-wine outline-none placeholder:italic placeholder:text-wine/35"
                />
              </div>
              <p className="mt-3 min-h-[1.5rem] text-sm text-dusty" role="alert">{error}</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={() => void send()} disabled={busy !== ''}>{busy === 'send' ? 'Sending…' : 'Send My Message'}</Button>
                <Button variant="ghost" onClick={() => void later()} disabled={busy !== ''}>{busy === 'skip' ? 'One moment…' : 'Maybe Later'}</Button>
              </div>
            </motion.section>
          )}

          {view === 'sent' && (
            <motion.section key="sent" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <svg viewBox="0 0 80 80" className="mx-auto h-24 w-24" fill="none" aria-hidden>
                <motion.circle cx="40" cy="40" r="34" stroke="#D8B88C" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
                <motion.path d="M26 41l10 10 19-21" stroke="#A65F78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 1 }} />
              </svg>
              <motion.h1 className="mt-8 font-display text-4xl sm:text-5xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1 }}>
                Message sent.
              </motion.h1>
              <motion.p className="mt-4 font-serif text-2xl italic text-wine/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}>
                Thank you for sharing it with me, Deva.
              </motion.p>
            </motion.section>
          )}

          {view === 'later' && (
            <motion.section key="later" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="font-display text-4xl sm:text-5xl">That's completely okay.</h1>
              <p className="mx-auto mt-4 max-w-md font-serif text-2xl italic text-wine/80">There's no hurry. Come back whenever you feel like writing.</p>
              <div className="mt-8 flex justify-center">
                <Button variant="ghost" onClick={() => setView('write')}>Write a reply</Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
