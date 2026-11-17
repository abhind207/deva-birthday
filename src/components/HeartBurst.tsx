import { motion } from 'framer-motion'
import { useMemo } from 'react'

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

/** Elegant celebration: one large heart drawn in champagne gold, with small hearts drifting upward. */
export default function HeartBurst() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: (Math.random() - 0.5) * 90,
        size: 14 + Math.random() * 26,
        delay: 0.5 + Math.random() * 1.6,
        dur: 2.6 + Math.random() * 1.6,
        rise: 38 + Math.random() * 50,
        gold: i % 3 === 0,
      })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1] }}
        transition={{ duration: 1.6 }}
        style={{ background: 'radial-gradient(60% 50% at 50% 50%, rgba(166,95,120,.55), rgba(64,30,48,.92))' }}
      />
      {hearts.map((h, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute bottom-[-8vh]"
          style={{ left: `${50 + h.x}%`, width: h.size, height: h.size }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: `-${h.rise + 30}vh`, opacity: [0, 0.9, 0], scale: 1 }}
          transition={{ duration: h.dur, delay: h.delay, ease: 'easeOut' }}
        >
          <path d={HEART} fill={h.gold ? '#D8B88C' : '#B88A9A'} />
        </motion.svg>
      ))}
      <motion.svg viewBox="0 0 24 24" className="relative w-40 sm:w-52" initial={{ scale: 0.85 }} animate={{ scale: [0.85, 1, 1.06, 1] }} transition={{ duration: 2.4 }}>
        <motion.path
          d={HEART}
          fill="none"
          stroke="#D8B88C"
          strokeWidth={0.45}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
        <motion.path d={HEART} fill="#D8B88C" initial={{ fillOpacity: 0 }} animate={{ fillOpacity: 0.9 }} transition={{ delay: 1.3, duration: 1 }} />
      </motion.svg>
    </div>
  )
}
