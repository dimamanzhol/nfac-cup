'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { calcWPM, calcProgress, getValuationStage } from '@/lib/game'
import { getCharacter } from '@/data/characters'
import TypingArea from './TypingArea'
import EliminationOverlay from './EliminationOverlay'

interface Player {
  id: string
  user_id: string
  name: string
  progress: number
  wpm: number
  eliminated: boolean
  is_host: boolean
  character_id: string | null
}

interface Room {
  id: string
  code: string
  status: string
  host_id: string
  text: string | null
}

interface Props {
  room: Room
  players: Player[]
  userId: string
  channel: RealtimeChannel | null
  onGameOver: (winner: Player) => void
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
}

const ELIMINATION_INTERVAL = 30000 // 30 seconds

export default function GameScreen({ room, players, userId, channel, onGameOver, setPlayers }: Props) {
  const [typedCount, setTypedCount] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [countdown, setCountdown] = useState(30)
  const [eliminated, setEliminated] = useState(false)
  const [showElimination, setShowElimination] = useState(false)
  const [eliminatedInfo, setEliminatedInfo] = useState<{ name: string; character_id: string | null } | null>(null)
  const [hasError, setHasError] = useState(false)
  const startTimeRef = useRef(Date.now())
  const supabase = createClient()

  const text = room.text ?? ''
  const me = players.find((p) => p.user_id === userId)
  const isHost = room.host_id === userId
  const activePlayers = players.filter((p) => !p.eliminated)

  // Broadcast progress every 500ms
  useEffect(() => {
    if (eliminated) return
    const interval = setInterval(() => {
      const progress = calcProgress(typedCount, text.length)
      const currentWpm = calcWPM(typedCount, startTimeRef.current)
      channel?.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: {
          user_id: userId,
          progress,
          wpm: currentWpm,
          character_id: me?.character_id ?? null,
        },
      })
    }, 500)
    return () => clearInterval(interval)
  }, [typedCount, eliminated, channel, userId, text.length, me?.character_id])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 30
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Elimination logic — host runs it
  useEffect(() => {
    if (!isHost) return
    const interval = setInterval(async () => {
      const fresh = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('eliminated', false)
        .order('progress', { ascending: true })

      const active = fresh.data ?? []
      if (active.length <= 1) {
        // Game over
        const winner = active[0]
        if (winner) {
          await supabase.from('rooms').update({ status: 'finished' }).eq('id', room.id)
          const allPlayers = (await supabase.from('players').select('*').eq('room_id', room.id)).data ?? []
          const sorted = [...allPlayers].sort((a, b) => b.progress - a.progress)
          for (let i = 0; i < sorted.length; i++) {
            await supabase.from('game_results').insert({
              room_id: room.id,
              user_id: sorted[i].user_id,
              placement: i + 1,
              wpm: sorted[i].wpm,
              character_id: sorted[i].character_id,
            })
            if (i === 0) {
              await supabase.rpc('increment_wins', { uid: sorted[i].user_id })
            }
            await supabase.rpc('update_best_wpm', { uid: sorted[i].user_id, new_wpm: sorted[i].wpm })
            await supabase.rpc('increment_total_games', { uid: sorted[i].user_id })
          }
          channel?.send({ type: 'broadcast', event: 'game_over', payload: { winner } })
          onGameOver(winner as Player)
        }
        return
      }

      // Eliminate lowest progress player
      const loser = active[0]
      await supabase.from('players').update({ eliminated: true }).eq('id', loser.id)
      channel?.send({
        type: 'broadcast',
        event: 'player_eliminated',
        payload: { user_id: loser.user_id, name: loser.name, character_id: loser.character_id },
      })
    }, ELIMINATION_INTERVAL)
    return () => clearInterval(interval)
  }, [isHost, room.id, channel, supabase, onGameOver])

  // Handle elimination broadcast from channel
  useEffect(() => {
    if (!channel) return
    const sub = channel.on('broadcast', { event: 'player_eliminated' }, ({ payload }) => {
      setEliminatedInfo({ name: payload.name, character_id: payload.character_id })
      setShowElimination(true)
      setTimeout(() => setShowElimination(false), 3000)
      if (payload.user_id === userId) setEliminated(true)
    })
    return () => { sub.unsubscribe?.() }
  }, [channel, userId])

  const handleType = useCallback(
    (count: number, isError: boolean) => {
      setHasError(isError)
      if (!isError) {
        setTypedCount(count)
        setWpm(calcWPM(count, startTimeRef.current))

        const progress = calcProgress(count, text.length)
        setPlayers((prev) =>
          prev.map((p) =>
            p.user_id === userId ? { ...p, progress, wpm: calcWPM(count, startTimeRef.current) } : p
          )
        )

        // Self-complete check
        if (count >= text.length) {
          const finalWpm = calcWPM(count, startTimeRef.current)
          channel?.send({
            type: 'broadcast',
            event: 'progress_update',
            payload: { user_id: userId, progress: 100, wpm: finalWpm, character_id: me?.character_id ?? null },
          })
        }
      }
    },
    [text.length, userId, channel, me?.character_id, setPlayers]
  )

  const myProgress = calcProgress(typedCount, text.length)
  const myStage = getValuationStage(myProgress)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top leaderboard bar */}
      <div className="border-b border-[#1a1a1a] px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {players.map((p) => {
              const char = getCharacter(p.character_id)
              const stage = getValuationStage(p.progress)
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    p.eliminated
                      ? 'border-[#1a1a1a] text-[#333] bg-transparent'
                      : p.user_id === userId
                      ? 'border-white text-white bg-white/10'
                      : 'border-[#333] text-[#ccc]'
                  }`}
                >
                  <span>{char?.emoji ?? '👤'}</span>
                  <span className="max-w-[60px] sm:max-w-[80px] truncate">{p.name}</span>
                  {p.eliminated ? (
                    <span className="text-[#ff4444]">💀</span>
                  ) : (
                    <>
                      <div className="w-8 sm:w-12 h-1 bg-[#222] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${p.progress}%`, backgroundColor: stage.color }}
                        />
                      </div>
                      <span style={{ color: stage.color }}>{p.progress}%</span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="w-full max-w-3xl">
          {/* Valuation tracker */}
          <div className="mb-3 sm:mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/30 uppercase tracking-widest mb-0.5 sm:mb-1">Valuation</p>
              <p className="font-bold text-sm sm:text-lg" style={{ color: myStage.color }}>
                {myStage.label}
              </p>
              <p className="text-white/30 text-[10px] sm:text-xs hidden sm:block">{myStage.valuation}</p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[10px] sm:text-xs mb-0.5 sm:mb-1">WPM</p>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{wpm}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full mb-4 sm:mb-6 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: myStage.color }}
              animate={{ width: `${myProgress}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>

          {/* Typing area */}
          <TypingArea
            text={text}
            typedCount={typedCount}
            onType={handleType}
            disabled={eliminated}
          />

          {hasError && !eliminated && (
            <p className="text-center text-[#ff4444] text-xs mt-2">Delete the wrong character to continue</p>
          )}
        </div>
      </div>

      {/* Countdown timer */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center font-black text-base sm:text-xl font-mono ${
          countdown <= 5 ? 'border-[#ff4444] text-[#ff4444]' : 'border-white/10 text-white/20'
        }`}>
          {countdown}
        </div>
        <p className="text-white/15 text-[9px] sm:text-xs text-center mt-1">elim</p>
      </div>

      <EliminationOverlay
        visible={showElimination}
        eliminatedName={eliminatedInfo?.name ?? null}
        eliminatedCharacterId={eliminatedInfo?.character_id ?? null}
      />
    </div>
  )
}
