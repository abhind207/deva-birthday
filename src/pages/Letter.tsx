import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Photo from '../components/Photo'
import Button from '../components/Button'
import { LETTER } from '../data/content'
import { sleep } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const

function Envelope({ onOpen }: { onOpen: () => void }) {
  const [opened, setOpened] = useState(false)
  const [flapBehind, setFlapBehind] = useState(false)

  const open = async () => {
    if (opened) return
    setOpened(true)
    await sleep(450)
    setFlapBehind(true) // once the flap passes vertical it sits behind the rising letter
    await sleep(2400)
    onOpen()
  }

  return (
    <motion.div
      key="envelope"
      className="flex min-h-[100dvh] flex-col items-center justify-center px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <button
        onClick={() => void open()}
        aria-label="Open the envelope"
        className="relative aspect-[4/3] w-[min(88vw,440px)] cursor-pointer"
        style={{ perspective: 1400 }}
      >
        <div className="absolute inset-0 rounded-[6px] bg-gradient-to-b from-[#EBD3C6] to-[#DDBBA7] shadow-[0_40px_70px_-30px_rgba(64,30,48,.55)]" />
        <motion.div
          className="paper absolute inset-x-[6%] top-[6%] z-[5] h-[88%] rounded-[3px] border border-gold/40 shadow-md"
          animate={opened ? { y: '-48%' } : { y: 0 }}
          transition={{ delay: 0.95, duration: 1.2, ease: EASE }}
        />
        {/* Front pocket */}
        <div className="absolute inset-0 z-10 rounded-[6px] bg-[#E3C4B2]" style={{ clipPath: 'polygon(0 0, 50% 56%, 0 100%)' }} />
        <div className="absolute inset-0 z-10 rounded-[6px] bg-[#E3C4B2]" style={{ clipPath: 'polygon(100% 0, 50% 56%, 100% 100%)' }} />
        <div className="absolute inset-0 z-10 rounded-[6px] bg-gradient-to-t from-[#DDBBA7] to-[#E8CDBD]" style={{ clipPath: 'polygon(0 100%, 50% 46%, 100% 100%)' }} />
        {/* Flap */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[58%] origin-top rounded-t-[6px] bg-gradient-to-b from-[#EED8CB] to-[#E0BFAC]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', zIndex: flapBehind ? 1 : 20 }}
          animate={{ rotateX: opened ? 180 : 0 }}
          transition={{ duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
        />
        {/* Wax seal */}
        <motion.div
          className="absolute left-1/2 top-[56%] z-30 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-dusty to-wine font-display text-lg text-gold shadow-lg ring-1 ring-gold/60"
          animate={opened ? { opacity: 0, scale: 0.7 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          D
        </motion.div>
      </button>
      <motion.p
        className="mt-10 font-hand text-2xl text-dusty"
        animate={{ opacity: opened ? 0 : [0.55, 1, 0.55] }}
        transition={opened ? { duration: 0.3 } : { duration: 3.2, repeat: Infinity }}
      >
        tap to open
      </motion.p>
    </motion.div>
  )
}

export default function Letter() {
  const nav = useNavigate()
  const [stage, setStage] = useState<'sealed' | 'read'>('sealed')

  return (
    <PageShell particles={8}>
      <AnimatePresence mode="wait">
        {stage === 'sealed' ? (
          <Envelope key="sealed" onOpen={() => setStage('read')} />
        ) : (
          <motion.div
            key="read"
            className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)] lg:items-start lg:gap-16 lg:py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Photograph — printed-photo treatment beside the letter; first on small screens */}
            <motion.aside
              className="order-first mx-auto w-[min(62vw,260px)] lg:sticky lg:top-16 lg:order-last lg:w-full lg:max-w-[340px] lg:justify-self-center"
              initial={{ opacity: 0, y: 24, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: -1.8 }}
              transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
            >
              <Photo variant="print" src="/photos/deva-1.jpg" alt="Deva, smiling softly with her eyes closed" position="55% 34%" className="aspect-[4/5] w-full" />
            </motion.aside>

            <div>
              <motion.article
                className="paper relative rounded-[6px] border border-gold/50 px-6 py-9 shadow-[0_40px_80px_-40px_rgba(64,30,48,.5),0_2px_0_rgba(216,184,140,.4)] sm:px-12 sm:py-14"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.3, delay: 0.2, ease: EASE }}
              >
                <div className="pointer-events-none absolute inset-3 rounded-[3px] border border-gold/30" aria-hidden />
                <div className="relative whitespace-pre-wrap font-serif text-[1.3rem] font-medium leading-[1.85] text-wine sm:text-[1.45rem]">{LETTER}</div>
              </motion.article>
              <motion.div className="mt-10 flex justify-center lg:justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }}>
                <Button onClick={() => nav('/reply')}>Continue</Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
