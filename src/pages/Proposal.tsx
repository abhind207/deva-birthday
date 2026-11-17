import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import WordReveal from '../components/WordReveal'
import HeartBurst from '../components/HeartBurst'
import { useMusic } from '../components/Music'
import { recordNo, recordYes, sleep, withTimeout } from '../lib/api'

interface Pt { x: number; y: number }
interface Box { left: number; top: number; right: number; bottom: number }

const pad = (r: DOMRect, p: number): Box => ({ left: r.left - p, top: r.top - p, right: r.right + p, bottom: r.bottom + p })
const hits = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

const NO_CLASS =
  'min-h-[3rem] min-w-[7rem] rounded-full border border-gold/70 bg-transparent px-8 font-sans text-[.8rem] font-medium uppercase tracking-[.22em] text-ivory/90 backdrop-blur-sm'

export default function Proposal() {
  const nav = useNavigate()
  const music = useMusic()
  const [ready, setReady] = useState(false)
  const [saidYes, setSaidYes] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [noStart, setNoStart] = useState<Pt | null>(null)
  const [noPos, setNoPos] = useState<Pt | null>(null)

  const textRef = useRef<HTMLDivElement>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const slotRef = useRef<HTMLButtonElement>(null)
  const lastCount = useRef(0)
  const sizeRef = useRef({ w: 120, h: 48 })

  // Buttons appear only after the words have been revealed slowly.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 7600)
    return () => clearTimeout(t)
  }, [])

  const dodge = useCallback(() => {
    if (saidYes) return
    const now = Date.now()
    if (now - lastCount.current > 450) {
      lastCount.current = now
      setAttempts((a) => a + 1)
      void recordNo() // every attempt is saved with a timestamp
    }
    const slot = slotRef.current
    if (slot) {
      const r = slot.getBoundingClientRect()
      if (r.width) sizeRef.current = { w: r.width, h: r.height }
      if (!noStart) setNoStart({ x: r.left, y: r.top })
    }
    const { w, h } = sizeRef.current
    const vw = window.innerWidth
    const vh = window.innerHeight
    const m = 14
    // Keep clear of the question text and the YES button so the page stays usable.
    const avoid = [textRef.current, yesRef.current].filter((e): e is HTMLElement => !!e).map((e) => pad(e.getBoundingClientRect(), 14))
    let target: Pt | null = null
    for (let i = 0; i < 60 && !target; i++) {
      const c = { x: m + Math.random() * Math.max(1, vw - w - 2 * m), y: m + Math.random() * Math.max(1, vh - h - 2 * m) }
      const box = { left: c.x, top: c.y, right: c.x + w, bottom: c.y + h }
      const far = !noPos || Math.hypot(c.x - noPos.x, c.y - noPos.y) > 120
      if (far && !avoid.some((a) => hits(box, a))) target = c
    }
    if (!target) {
      const corners: Pt[] = [{ x: m, y: vh - h - m }, { x: vw - w - m, y: vh - h - m }, { x: m, y: m }, { x: vw - w - m, y: m }]
      target = corners[Math.floor(Math.random() * corners.length)]
    }
    setNoPos(target)
  }, [noPos, noStart, saidYes])

  // Keep the dodging button on-screen if the viewport changes.
  useEffect(() => {
    if (!noPos) return
    const onResize = () => setNoPos((p) => p && { x: Math.min(p.x, window.innerWidth - sizeRef.current.w - 14), y: Math.min(p.y, window.innerHeight - sizeRef.current.h - 14) })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [noPos])

  const sayYes = async () => {
    if (saidYes) return
    setSaidYes(true)
    void music.fadeOutAndStop()
    const saved = recordYes()
    await Promise.all([sleep(4200), withTimeout(saved, 5000, false)])
    nav('/letter')
  }

  const noHandlers = {
    onPointerEnter: (e: RPointerEvent) => { if (e.pointerType === 'mouse') dodge() },
    onPointerDown: (e: RPointerEvent) => { if (e.pointerType !== 'mouse') { e.preventDefault(); dodge() } },
    onClick: () => dodge(), // keyboard activation or a very fast mouse click
  }

  return (
    <PageShell tone="wine" particles={22}>
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center justify-center px-6 py-14 text-center">
        <div ref={textRef} className="max-w-2xl">
          <p className="font-serif text-2xl italic leading-snug text-blush/90 sm:text-[2rem]">
            <WordReveal text="Hey Deva, there's something I've been wanting to ask you..." delay={0.9} stagger={0.2} />
          </p>
          <h1 className="mt-10 font-display text-[2.1rem] leading-[1.2] sm:text-5xl">
            <WordReveal text="Would you like to be more than just a friend?" delay={4.6} stagger={0.28} />
          </h1>
        </div>

        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-5"
          initial={{ opacity: 0, y: 14 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1.2 }}
          style={{ pointerEvents: ready && !saidYes ? 'auto' : 'none' }}
        >
          <button ref={yesRef} onClick={() => void sayYes()} className="btn btn-gold min-w-[9rem]" disabled={!ready}>
            YES ❤️
          </button>
          {/* Static slot keeps the layout stable once the real NO button starts moving */}
          <button
            ref={slotRef}
            {...noHandlers}
            tabIndex={noPos ? -1 : 0}
            aria-hidden={noPos ? true : undefined}
            className={`${NO_CLASS} ${noPos ? 'invisible' : ''}`}
          >
            NO
          </button>
        </motion.div>

        <p className="mt-6 h-5 font-hand text-xl text-gold/90">{attempts >= 4 && !saidYes ? 'The other button is much easier to reach…' : ''}</p>
      </div>

      {noPos && noStart && !saidYes &&
        createPortal(
          <motion.button
            key="no-runner"
            {...noHandlers}
            className={`${NO_CLASS} fixed left-0 top-0 z-[45] touch-none`}
            initial={{ x: noStart.x, y: noStart.y }}
            animate={{ x: noPos.x, y: noPos.y }}
            transition={{ type: 'spring', stiffness: 130, damping: 15 }}
          >
            NO
          </motion.button>,
          document.body,
        )}

      <AnimatePresence>{saidYes && <HeartBurst />}</AnimatePresence>
    </PageShell>
  )
}
