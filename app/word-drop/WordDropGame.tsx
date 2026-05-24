'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const WORD_LIST = [
  'startup', 'founder', 'unicorn', 'pivot', 'seed', 'venture', 'traction',
  'product', 'market', 'growth', 'scale', 'pitch', 'equity', 'valuation',
  'runway', 'launch', 'beta', 'mvp', 'saas', 'fintech', 'edtech', 'revenue',
  'profit', 'churn', 'metrics', 'kpi', 'bootstrap', 'disrupt', 'nfactorial',
  'astana', 'almaty', 'hackathon', 'investor', 'dilution', 'demo', 'cohort',
  'iteration', 'burnrate', 'acquisition', 'retention', 'conversion', 'funnel',
  'angel', 'exit', 'ipo', 'accelerator', 'incubator', 'series', 'term',
  'sheet', 'dilute', 'vesting', 'cliff', 'option', 'stake', 'board',
]

interface FallingWord {
  id: number
  text: string
  x: number
  y: number
  speed: number
}

let wordId = 0

export default function WordDropGame({ username }: { username: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [displayWords, setDisplayWords] = useState<FallingWord[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [combo, setCombo] = useState(0)
  const [pop, setPop] = useState<{ id: number; label: string; x: number; y: number } | null>(null)

  const wordsRef = useRef<FallingWord[]>([])
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const comboRef = useRef(0)
  const phaseRef = useRef<'idle' | 'playing' | 'gameover'>('idle')
  const arenaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function startGame() {
    wordId = 0
    wordsRef.current = []
    scoreRef.current = 0
    livesRef.current = 3
    comboRef.current = 0
    phaseRef.current = 'playing'
    setDisplayWords([])
    setScore(0)
    setLives(3)
    setCombo(0)
    setInput('')
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Physics loop — 20fps is smooth enough for falling words
  useEffect(() => {
    if (phase !== 'playing') return
    const tick = setInterval(() => {
      const arenaH = arenaRef.current?.clientHeight ?? 460
      let lost = 0
      const alive: FallingWord[] = []
      for (const w of wordsRef.current) {
        const ny = w.y + w.speed
        if (ny >= arenaH - 52) { lost++ } else { alive.push({ ...w, y: ny }) }
      }
      wordsRef.current = alive
      setDisplayWords([...alive])
      if (lost > 0) {
        comboRef.current = 0
        setCombo(0)
        livesRef.current = Math.max(0, livesRef.current - lost)
        setLives(livesRef.current)
        if (livesRef.current <= 0) {
          phaseRef.current = 'gameover'
          setBestScore(prev => Math.max(prev, scoreRef.current))
          setPhase('gameover')
        }
      }
    }, 50)
    return () => clearInterval(tick)
  }, [phase])

  // Spawner — speeds up as score grows
  useEffect(() => {
    if (phase !== 'playing') return
    const spawnInterval = setInterval(() => {
      if (phaseRef.current !== 'playing') return
      const level = Math.floor(scoreRef.current / 100)
      const speed = Math.min(7, 1.4 + level * 0.25 + Math.random() * 0.4)
      const text = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
      const x = 4 + Math.random() * 70
      const word: FallingWord = { id: wordId++, text, x, y: -8, speed }
      wordsRef.current = [...wordsRef.current, word]
    }, 1400)
    return () => clearInterval(spawnInterval)
  }, [phase])

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase()
    setInput(val)
    const match = wordsRef.current.find(w => w.text === val)
    if (!match) return
    wordsRef.current = wordsRef.current.filter(w => w.id !== match.id)
    comboRef.current += 1
    const pts = 10 + (comboRef.current - 1) * 3
    scoreRef.current += pts
    setScore(scoreRef.current)
    setCombo(comboRef.current)
    setPop({ id: match.id, label: `+${pts}`, x: match.x, y: match.y })
    setTimeout(() => setPop(null), 500)
    setInput('')
  }

  function wordColor(y: number): string {
    const arenaH = arenaRef.current?.clientHeight ?? 460
    const pct = y / arenaH
    if (pct > 0.72) return '#ff4444'
    if (pct > 0.42) return '#ffaa00'
    return '#ffffff'
  }

  const typed = input.toLowerCase()

  // ── IDLE ──
  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-grid flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] blur-[120px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #ff4444 0%, transparent 70%)' }} />
        <button onClick={() => router.push('/')}
          className="absolute top-5 left-5 text-white/30 hover:text-white/60 text-sm transition-colors">← Back</button>

        <div className="text-center max-w-xs relative z-10">
          <p className="text-[#ff4444] text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Survival Mode</p>
          <h1 className="text-7xl font-black text-white tracking-tighter leading-none mb-1">WORD<br/>DROP</h1>
          <p className="text-white/25 text-sm mt-3 mb-8 leading-relaxed">
            Words fall from the sky.<br/>Type them before they hit the ground.<br/>Miss 3 — startup bankrupt.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={startGame}
            className="w-full py-4 bg-white text-black font-black rounded-xl text-lg hover:bg-[#eee] transition-colors"
            style={{ boxShadow: '0 0 40px rgba(255,255,255,0.1)' }}
          >
            START DROP
          </motion.button>
          {bestScore > 0 && (
            <p className="text-white/20 text-sm mt-4">Best score: <span className="text-white/40 font-bold">{bestScore}</span></p>
          )}
        </div>
      </div>
    )
  }

  // ── GAME OVER ──
  if (phase === 'gameover') {
    const isNewBest = score >= bestScore && score > 0
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center max-w-xs w-full"
        >
          <p className="text-[#ff4444] text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Bankrupt 💀</p>
          <h1 className="text-4xl font-black text-white mb-1">Game Over</h1>
          <p className="text-white/20 text-sm mb-6">@{username}</p>

          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Final Score</p>
            <p className="text-6xl font-black font-mono text-white">{score}</p>
            {isNewBest && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#ffaa00] text-sm font-bold mt-2"
              >
                🏆 New personal best!
              </motion.p>
            )}
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={startGame}
              className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-[#eee] transition-colors">
              RETRY
            </motion.button>
            <button onClick={() => router.push('/')}
              className="flex-1 border border-[#333] text-white font-semibold py-3 rounded-lg hover:border-[#555] transition-colors">
              HOME
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] flex-shrink-0">
        <div>
          <p className="text-white/25 text-[10px] uppercase tracking-widest">Score</p>
          <p className="text-2xl font-black text-white font-mono leading-none">{score}</p>
        </div>

        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              key={combo}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-black text-sm"
              style={{ color: '#ffaa00' }}
            >
              {combo}× COMBO 🔥
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={i >= lives ? { scale: [1, 1.3, 1] } : {}}
              className="text-lg sm:text-xl"
            >
              {i < lives ? '❤️' : '🖤'}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Arena */}
      <div ref={arenaRef} className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {/* Danger zone indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(255,68,68,0.06), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#ff4444] opacity-10" />

        {/* Falling words */}
        {displayWords.map(w => {
          const color = wordColor(w.y)
          const isHighlighted = typed.length > 0 && w.text.startsWith(typed)
          const matched = typed.length > 0 && w.text === typed
          return (
            <div
              key={w.id}
              className="absolute font-mono font-bold text-sm sm:text-base whitespace-nowrap select-none pointer-events-none transition-colors"
              style={{
                left: `${w.x}%`,
                top: w.y,
                color: matched ? '#00ff88' : isHighlighted ? '#ffaa00' : color,
                textShadow: isHighlighted
                  ? '0 0 12px rgba(255,170,0,0.7)'
                  : color === '#ff4444'
                  ? '0 0 10px rgba(255,68,68,0.5)'
                  : 'none',
                transform: isHighlighted ? 'scale(1.08)' : 'scale(1)',
                transformOrigin: 'left center',
              }}
            >
              {isHighlighted && typed.length > 0 ? (
                <>
                  <span style={{ color: '#00ff88' }}>{w.text.slice(0, typed.length)}</span>
                  <span>{w.text.slice(typed.length)}</span>
                </>
              ) : w.text}
            </div>
          )
        })}

        {/* Score pop */}
        <AnimatePresence>
          {pop && (
            <motion.div
              key={pop.id}
              className="absolute font-black text-[#00ff88] text-sm pointer-events-none"
              style={{ left: `${pop.x}%`, top: pop.y }}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -50, scale: 1.4 }}
              transition={{ duration: 0.5 }}
            >
              {pop.label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-3 sm:px-4 py-3 border-t border-[#1a1a1a] flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={onInput}
          placeholder="type a falling word..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/20 font-mono text-base focus:outline-none transition-all"
        />
      </div>
    </div>
  )
}
