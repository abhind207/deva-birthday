import { motion } from 'framer-motion'

interface Props { text: string; delay?: number; stagger?: number; className?: string }

export default function WordReveal({ text, delay = 0, stagger = 0.12, className = '' }: Props) {
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          {i > 0 && ' '}
          <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '115%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.95, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          </span>
        </span>
      ))}
    </span>
  )
}
