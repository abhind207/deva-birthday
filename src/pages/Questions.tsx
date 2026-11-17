import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Photo from '../components/Photo'
import Button from '../components/Button'
import { QUESTIONS } from '../data/content'
import { saveAnswer, sleep, track, withTimeout } from '../lib/api'

type Choice = '' | 'yes' | 'no'
interface Answers { 1: string; 2: string; 3: Choice }

const STORE = 'deva.questions'
const EMPTY: Answers = { 1: '', 2: '', 3: '' }

function load(): { step: number; answers: Answers } {
  try {
    const v = JSON.parse(sessionStorage.getItem(STORE) || 'null') as { step: number; answers: Answers } | null
    if (v && v.step >= 0 && v.step <= 2) return { step: v.step, answers: { ...EMPTY, ...v.answers } }
  } catch { /* ignore */ }
  return { step: 0, answers: EMPTY }
}

export default function Questions() {
  const nav = useNavigate()
  const init = useMemo(load, [])
  const [step, setStep] = useState(init.step)
  const [answers, setAnswers] = useState<Answers>(init.answers)
  const [dir, setDir] = useState(1)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const q = QUESTIONS[step]
  const value = answers[q.n]

  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ step, answers })) } catch { /* ignore */ }
  }, [step, answers])

  // Focus the field after each transition on desktop only (avoids surprise keyboards on phones).
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const t = setTimeout(() => inputRef.current?.focus(), 450)
    return () => clearTimeout(t)
  }, [step])

  const answered = (n: 1 | 2 | 3) => answers[n].trim().length > 0
  const firstOpen = ([1, 2, 3] as const).findIndex((n) => !answered(n))
  const reachable = Math.max(step, firstOpen === -1 ? 2 : firstOpen)

  const persist = (n: 1 | 2 | 3) => {
    if (!answered(n)) return Promise.resolve(false)
    const choice = n === 3
    return saveAnswer(n, choice ? null : answers[n], choice ? answers[n] : null)
  }

  const setValue = (v: string) => {
    setError('')
    setAnswers((a) => ({ ...a, [q.n]: v }))
  }

  const goTo = (i: number) => {
    if (i === step || i > reachable) return
    void persist(q.n)
    setError('')
    setDir(i > step ? 1 : -1)
    setStep(i)
  }

  const next = async () => {
    if (!answered(q.n)) {
      setError(q.kind === 'choice' ? 'Please choose one to continue.' : 'Please write something before moving on.')
      return
    }
    if (step < 2) {
      void persist(q.n)
      setDir(1)
      setStep(step + 1)
      return
    }
    setDone(true)
    const saves = Promise.all([persist(1), persist(2), persist(3), track('questions_completed', '/questions')])
    await Promise.all([sleep(2400), withTimeout(saves, 4000, [false, false, false, false])])
    nav('/proposal')
  }

  return (
    <PageShell particles={10}>
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col justify-center gap-7 px-5 py-10 md:grid md:grid-cols-[minmax(0,1fr)_220px] md:items-center md:gap-14">
        {/* Small personal photograph — secondary to the questions */}
        <aside className="order-first mx-auto md:order-last">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="relative">
            <Photo src="/photos/deva-3.jpg" alt="Deva in a white and gold saree" position="50% 14%" className="aspect-[3/4] w-24 sm:w-28 md:w-[220px]" />
            <span className="absolute -bottom-4 -right-3 rotate-[-5deg] font-hand text-xl text-dusty md:-right-6 md:text-2xl">just between us</span>
          </motion.div>
        </aside>

        <section className="relative rounded-[1.75rem] border border-gold/60 bg-ivory/70 p-6 shadow-[0_40px_80px_-40px_rgba(64,30,48,.35)] backdrop-blur-md sm:p-10">
          <nav className="mb-6 flex items-center gap-5" aria-label="Question progress">
            {QUESTIONS.map((x, i) => (
              <button
                key={x.n}
                onClick={() => goTo(i)}
                disabled={i > reachable}
                aria-current={i === step ? 'step' : undefined}
                className={`font-serif text-lg tracking-widest transition-colors disabled:cursor-default ${
                  i === step ? 'text-dusty' : i <= reachable ? 'text-wine/55 hover:text-dusty' : 'text-wine/25'
                }`}
              >
                {String(x.n).padStart(2, '0')}
                <span className={`mt-1 block h-px transition-all duration-500 ${i === step ? 'w-full bg-gold' : 'w-0 bg-gold'}`} />
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -36 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="font-display text-7xl leading-none text-dusty/20 sm:text-8xl">{String(q.n).padStart(2, '0')}</div>
              <h2 className="-mt-3 mb-7 font-serif text-[1.65rem] italic leading-snug sm:text-[2rem]">{q.text}</h2>

              {q.kind === 'text' && (
                <input
                  ref={inputRef}
                  className="field"
                  value={value}
                  maxLength={300}
                  placeholder={q.placeholder}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void next() }}
                  aria-label={q.text}
                  autoComplete="off"
                />
              )}
              {q.kind === 'textarea' && (
                <textarea
                  ref={inputRef}
                  className="field-area"
                  rows={5}
                  value={value}
                  maxLength={4000}
                  placeholder={q.placeholder}
                  onChange={(e) => setValue(e.target.value)}
                  aria-label={q.text}
                />
              )}
              {q.kind === 'choice' && (
                <div className="flex gap-3" role="radiogroup" aria-label={q.text}>
                  {(['yes', 'no'] as const).map((c) => (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={value === c}
                      onClick={() => setValue(c)}
                      className={`min-h-[3rem] flex-1 rounded-full border px-6 text-[.78rem] font-medium uppercase tracking-[.22em] transition-all ${
                        value === c ? 'border-dusty bg-dusty text-ivory shadow-lg' : 'border-gold/70 bg-white/40 text-wine hover:bg-gold/20'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-3 min-h-[1.25rem] text-sm text-dusty" role="alert">{error}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0} className="!px-6">Back</Button>
            <Button onClick={() => void next()}>{step === 2 ? 'Finish' : 'Next'}</Button>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            className="scene-ivory fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          >
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, delay: 0.3 }} className="mb-6 h-px w-24 bg-gold" />
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="font-serif text-4xl italic text-wine">
              Thank you.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }} className="mt-3 font-sans text-sm font-light tracking-wide text-wine/65">
              One more moment...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
