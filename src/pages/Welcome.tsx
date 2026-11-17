import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Photo from '../components/Photo'
import WordReveal from '../components/WordReveal'
import Button from '../components/Button'

export default function Welcome() {
  const nav = useNavigate()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 20 })
  const sy = useSpring(my, { stiffness: 40, damping: 20 })
  const photoX = useTransform(sx, (v) => v * -16)
  const photoY = useTransform(sy, (v) => v * -12)
  const ringX = useTransform(sx, (v) => v * 22)
  const ringY = useTransform(sy, (v) => v * 16)

  // Gentle parallax, only for devices with a real pointer.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const move = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])

  return (
    <PageShell particles={16}>
      <div className="mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Photograph: arch frame, drifting champagne ring, handwritten date */}
        <div className="order-first flex justify-center lg:order-last">
          <motion.div
            className="relative w-[min(56vw,250px)] sm:w-[min(50vw,300px)] lg:w-[min(36vw,400px)]"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              style={{ x: ringX, y: ringY }}
              className="absolute -inset-4 rounded-t-[999px] rounded-b-[2rem] border border-gold/50"
              aria-hidden
            />
            <motion.div style={{ x: photoX, y: photoY }} className="relative">
              <div className="absolute -inset-8 -z-10 rounded-full bg-dusty/25 blur-3xl" aria-hidden />
              <Photo src="/photos/deva-1.jpg" alt="Deva, smiling softly with her eyes closed" position="55% 38%" className="aspect-[4/5] w-full" />
            </motion.div>
            <motion.span
              className="absolute -bottom-3 -left-2 -rotate-6 font-hand text-2xl text-dusty sm:-left-6 sm:text-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.2 }}
            >
              28 November
            </motion.span>
          </motion.div>
        </div>

        <div className="text-center lg:text-left">
          <motion.p
            className="mb-5 font-sans text-[.7rem] font-medium tracking-[.38em] text-dusty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            A LITTLE SURPRISE FOR YOU
          </motion.p>
          <h1 className="font-display text-[3.6rem] leading-[1.02] sm:text-7xl lg:text-8xl">
            <WordReveal text="Hey" delay={0.5} />{' '}
            <span className="italic text-dusty">
              <WordReveal text="Deva." delay={0.7} />
            </span>
          </h1>
          <motion.p
            className="mx-auto mt-6 max-w-md font-serif text-[1.65rem] italic leading-snug text-wine/90 lg:mx-0 lg:text-3xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.3 }}
          >
            Some moments deserve a little more magic.
          </motion.p>
          <motion.p
            className="mx-auto mt-5 max-w-sm font-sans text-[.95rem] font-light leading-relaxed text-wine/70 lg:mx-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.8 }}
          >
            Someone has prepared something special for you...
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 2.3 }} className="mt-9">
            <Button onClick={() => nav('/questions')}>Discover Your Surprise</Button>
          </motion.div>
        </div>
      </div>
    </PageShell>
  )
}
