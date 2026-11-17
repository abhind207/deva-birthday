import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import Particles from './Particles'

interface Props {
  tone?: 'ivory' | 'wine'
  particles?: number
  className?: string
  children: ReactNode
}

// Opacity-only transitions on purpose: transforms/filters on this wrapper would break fixed-position children.
export default function PageShell({ tone = 'ivory', particles = 14, className = '', children }: Props) {
  const dark = tone === 'wine'
  return (
    <motion.main
      className={`relative min-h-[100dvh] w-full overflow-x-hidden ${dark ? 'scene-wine text-ivory' : 'scene-ivory text-wine'} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className={`absolute -left-24 top-[-10%] h-[28rem] w-[28rem] rounded-full blur-3xl ${dark ? 'bg-dusty/30' : 'bg-blush'}`}
          animate={{ x: [0, 40, 0], y: [0, 24, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -right-24 bottom-[-12%] h-[26rem] w-[26rem] rounded-full blur-3xl ${dark ? 'bg-gold/15' : 'bg-gold/25'}`}
          animate={{ x: [0, -30, 0], y: [0, -26, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <Particles count={particles} dark={dark} />
      <div className="grain" aria-hidden />
      <div className="relative z-10">{children}</div>
    </motion.main>
  )
}
