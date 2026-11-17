import { useMemo, type CSSProperties } from 'react'

interface Props { count?: number; dark?: boolean }

export default function Particles({ count = 14, dark = false }: Props) {
  const items = useMemo(() => {
    const small = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
    const n = small ? Math.ceil(count / 2) : count
    return Array.from({ length: n }, () => ({
      left: Math.random() * 100,
      size: 2 + Math.random() * 3.5,
      dur: 16 + Math.random() * 16,
      delay: -Math.random() * 28,
      dx: (Math.random() - 0.5) * 70,
      op: 0.25 + Math.random() * 0.45,
    }))
  }, [count])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: dark ? '#EBD3AB' : '#D8B88C',
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              '--dx': `${p.dx}px`,
              '--op': p.op,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
