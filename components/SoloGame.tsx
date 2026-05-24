'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getCharacter } from '@/data/characters'
import { calcWPM, calcProgress, getValuationStage } from '@/lib/game'
import { createClient } from '@/lib/supabase'
import { playElimination, playWin, playGameOver } from '@/lib/sounds'
import { fireWinConfetti } from '@/lib/confetti'
import TypingArea from './TypingArea'
import EliminationOverlay from './EliminationOverlay'
import RaceTrack from './RaceTrack'
import type { Bot, Difficulty } from '@/app/solo/SoloClient'

interface Props {
  userId: string
  username: string
  characterId: string
  difficulty: Difficulty
  text: string
  initialBots: Bot[]
  onRestart: () => void
}

const ELIMINATION_INTERVAL = 30000
const BOT_TICK = 150

interface Racer {
  id: string
  name: string
  character_id: string
  targetWpm: number
  isPlayer: boolean
}

export default function SoloGame({ userId, username, characterId, difficulty, text, initialBots, onRestart }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // All racers (player + bots), built once
  const racers = useRef<Racer[]>([
    { id: 'player', name: username, character_id: characterId, targetWpm: 0, isPlayer: true },
    ...initialBots.map((b) => ({ id: b.id, name: b.name, character_id: b.character_id, targetWpm: b.wpm, isPlayer: false })),
  ])

  // Progress & state stored in refs for use inside intervals (no stale closure issues)
  const progressRef = useRef<Record<string, number>>({})
  const wpmRef = useRef<Record<string, number>>({})
  const eliminatedRef = useRef<Record<string, boolean>>({})
  const gameOverRef = useRef(false)
  const startTimeRef = useRef(Date.now())

  // Initialise refs
  useEffect(() => {
    racers.current.forEach((r) => {
      progressRef.current[r.id] = 0
      wpmRef.current[r.id] = 0
      eliminatedRef.current[r.id] = false
    })
  }, [])

  // UI state (updated from refs periodically)
  const [uiProgress, setUiProgress] = useState<Record<string, number>>({})
  const [uiEliminated, setUiEliminated] = useState<Record<string, boolean>>({})
  const [playerTypedCount, setPlayerTypedCount] = useState(0)
  const [playerWpm, setPlayerWpm] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [shaking, setShaking] = useState(false)
  const [showElimination, setShowElimination] = useState(false)
  const [eliminatedInfo, setEliminatedInfo] = useState<{ name: string; character_id: string } | null>(null)

  // Game over state
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Racer | null>(null)
  const [finalRanks, setFinalRanks] = useState<{ racer: Racer; progress: number; wpm: number }[]>([])

  function triggerElimOverlay(racer: Racer) {
    setEliminatedInfo({ name: racer.name, character_id: racer.character_id })
    setShowElimination(true)
    playElimination()
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    setTimeout(() => setShowElimination(false), 3000)
  }

  const endGame = useCallback((winnerRacer: Racer) => {
    if (gameOverRef.current) return
    gameOverRef.current = true
    if (winnerRacer.isPlayer) { playWin(); fireWinConfetti() } else { playGameOver() }

    const ranks = racers.current
      .map((r) => ({ racer: r, progress: progressRef.current[r.id] ?? 0, wpm: wpmRef.current[r.id] ?? 0 }))
      .sort((a, b) => b.progress - a.progress)

    setFinalRanks(ranks)
    setWinner(winnerRacer)
    setGameOver(true)

    // Save to DB
    if (winnerRacer.isPlayer) supabase.rpc('increment_wins', { uid: userId })
    supabase.rpc('update_best_wpm', { uid: userId, new_wpm: wpmRef.current['player'] ?? 0 })
    supabase.rpc('increment_total_games', { uid: userId })
  }, [supabase, userId])

  // Bot simulation — stable interval, uses refs only
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOverRef.current) return
      racers.current.forEach((r) => {
        if (r.isPlayer || eliminatedRef.current[r.id]) return
        if (progressRef.current[r.id] >= 100) return

        const charsPerTick = (r.targetWpm * 5) / (60000 / BOT_TICK)
        const variance = 0.8 + Math.random() * 0.4
        const stutter = Math.random() < 0.05 ? 0 : 1
        const currentChars = (progressRef.current[r.id] / 100) * text.length
        const newChars = Math.min(text.length, currentChars + charsPerTick * variance * stutter)
        const newProgress = (newChars / text.length) * 100

        progressRef.current[r.id] = newProgress
        wpmRef.current[r.id] = r.targetWpm

        // Bot finished — they win if player hasn't finished
        if (newProgress >= 100 && !gameOverRef.current) {
          endGame(r)
        }
      })
    }, BOT_TICK)
    return () => clearInterval(interval)
  }, [text.length, endGame])

  // UI sync — update UI from refs every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOverRef.current) return
      setUiProgress({ ...progressRef.current })
      setUiEliminated({ ...eliminatedRef.current })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Elimination timer — stable, uses refs only
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOverRef.current) return

      const active = racers.current.filter((r) => !eliminatedRef.current[r.id])
      if (active.length <= 1) return

      // Sort ascending by progress — lowest is eliminated
      active.sort((a, b) => (progressRef.current[a.id] ?? 0) - (progressRef.current[b.id] ?? 0))
      const loser = active[0]

      eliminatedRef.current[loser.id] = true
      triggerElimOverlay(loser)
      setUiEliminated((prev) => ({ ...prev, [loser.id]: true }))

      // Check if only 1 left
      const stillActive = racers.current.filter((r) => !eliminatedRef.current[r.id])
      if (stillActive.length === 1) {
        endGame(stillActive[0])
      }
    }, ELIMINATION_INTERVAL)
    return () => clearInterval(interval)
  }, [endGame])

  // Countdown display (cosmetic only)
  useEffect(() => {
    const interval = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleType = useCallback((count: number, isError: boolean) => {
    setHasError(isError)
    if (isError) return

    setPlayerTypedCount(count)
    const currentWpm = calcWPM(count, startTimeRef.current)
    setPlayerWpm(currentWpm)
    const progress = calcProgress(count, text.length)
    progressRef.current['player'] = progress
    wpmRef.current['player'] = currentWpm

    if (count >= text.length) {
      endGame(racers.current[0]) // player finished first
    }
  }, [text.length, endGame])

  const myProgress = uiProgress['player'] ?? 0
  const myStage = getValuationStage(myProgress)
  const playerEliminated = uiEliminated['player'] ?? false

  // ── WINNER SCREEN ──
  if (gameOver && winner) {
    const winnerChar = getCharacter(winner.character_id)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="text-center w-full max-w-xl">
          <p className="text-[#ffaa00] text-xs uppercase tracking-[0.3em] mb-4 font-semibold">
            {winner.isPlayer ? '🦄 UNICORN FOUNDER DETECTED 🦄' : '💀 BETTER LUCK NEXT TIME 💀'}
          </p>
          <div className="relative w-48 h-64 mx-auto mb-6 rounded-2xl overflow-hidden border-2 shadow-[0_0_40px_rgba(255,170,0,0.3)]"
            style={{ borderColor: winner.isPlayer ? '#ffaa00' : '#ff4444' }}>
            {winnerChar && <Image src={winnerChar.image} alt={winnerChar.name} fill className="object-cover object-top" sizes="192px" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{winnerChar?.name ?? winner.name}</h1>
          {winner.isPlayer
            ? <p className="text-[#00ff88] text-sm font-bold mb-1">That&apos;s YOU! 🎉</p>
            : <p className="text-[#ff4444] text-sm font-bold mb-1">The AI smoked you.</p>}
          <p className="text-[#ffaa00] font-bold mb-1">
            {winner.isPlayer ? 'has officially built a $1B Unicorn!' : 'reached Unicorn status first.'}
          </p>
          <p className="text-[#555] text-sm mb-8">
            {winner.isPlayer ? `@${username}` : winner.name} · {finalRanks.find(r => r.racer.id === winner.id)?.wpm ?? 0} WPM
          </p>

          <p className="text-[#555] text-xs uppercase tracking-widest mb-4">Cap Table — Final Standings</p>
          <div className="space-y-2 mb-8">
            {finalRanks.map((entry, i) => {
              const char = getCharacter(entry.racer.character_id)
              const stage = getValuationStage(entry.progress)
              const isWinner = entry.racer.id === winner.id
              return (
                <motion.div key={entry.racer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${isWinner ? 'border-[#ffaa00] bg-[#ffaa0015]' : 'border-[#1a1a1a] bg-[#111]'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[#555] text-sm w-4">#{i + 1}</span>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#333] flex-shrink-0">
                      {char && <Image src={char.image} alt={char.name} fill className="object-cover object-top" sizes="32px" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {entry.racer.isPlayer ? `@${username}` : entry.racer.name}
                      </p>
                      {entry.racer.isPlayer && <p className="text-[10px] text-[#555]">YOU</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: isWinner ? '#ffaa00' : stage.color }}>
                      {isWinner ? '🦄 $1B UNICORN' : `Bankrupt at ${stage.label}`}
                    </p>
                    <p className="text-xs text-[#555]">{entry.wpm} WPM</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={onRestart} className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-[#eee] transition-colors">PLAY AGAIN</button>
            <button onClick={() => router.push('/')} className="flex-1 border border-[#333] text-white font-semibold py-3 rounded-lg hover:border-[#555] transition-colors">HOME</button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── GAME SCREEN ──
  const raceData = racers.current.map((r) => ({
    id: r.id,
    name: r.name,
    character_id: r.character_id,
    isPlayer: r.isPlayer,
    progress: r.isPlayer ? myProgress : (uiProgress[r.id] ?? 0),
    eliminated: r.isPlayer ? playerEliminated : (uiEliminated[r.id] ?? false),
  }))

  const countdownPct = (countdown / 30) * 100
  const barColor = countdown <= 5 ? '#ff4444' : countdown <= 10 ? '#ffaa00' : '#00ff88'

  return (
    <div className={`min-h-screen bg-[#0a0a0a] flex flex-col ${shaking ? 'shake' : ''}`}>
      {/* Elimination countdown bar */}
      <div className="h-1 w-full bg-white/5 flex-shrink-0">
        <motion.div
          className="h-full"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${countdownPct}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </div>

      {/* Race track */}
      <div className="border-b border-[#1a1a1a]">
        <RaceTrack racers={raceData} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="w-full max-w-3xl">
          {/* Valuation + WPM row */}
          <div className="mb-3 sm:mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/30 uppercase tracking-widest mb-0.5 sm:mb-1">Valuation</p>
              <p className="font-bold text-sm sm:text-lg" style={{ color: myStage.color }}>{myStage.label}</p>
              <p className="text-white/30 text-[10px] sm:text-xs hidden sm:block">{myStage.valuation}</p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[10px] sm:text-xs mb-0.5 sm:mb-1">WPM</p>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{playerWpm}</p>
            </div>
          </div>

          <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full mb-4 sm:mb-6 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: myStage.color }}
              animate={{ width: `${myProgress}%` }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} />
          </div>

          <TypingArea text={text} typedCount={playerTypedCount} onType={handleType} disabled={playerEliminated} />

          {hasError && !playerEliminated && (
            <p className="text-center text-[#ff4444] text-xs mt-2">Delete the wrong character to continue</p>
          )}
        </div>
      </div>

      {/* Countdown chip — bottom right */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
        <motion.div
          animate={countdown <= 5 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.4, repeat: countdown <= 5 ? Infinity : 0 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold font-mono"
          style={{
            borderColor: barColor,
            color: barColor,
            backgroundColor: `${barColor}12`,
          }}
        >
          💀 {countdown}s
        </motion.div>
      </div>

      <EliminationOverlay visible={showElimination} eliminatedName={eliminatedInfo?.name ?? null} eliminatedCharacterId={eliminatedInfo?.character_id ?? null} />
    </div>
  )
}
