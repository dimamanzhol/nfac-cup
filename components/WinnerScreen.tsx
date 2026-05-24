'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getCharacter } from '@/data/characters'
import { getValuationStage } from '@/lib/game'

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

interface Props {
  winner: Player
  players: Player[]
  roomId: string
  userId: string
}

export default function WinnerScreen({ winner, players, roomId, userId }: Props) {
  const router = useRouter()
  const winnerChar = getCharacter(winner.character_id)

  // Sort: winner first, then by progress desc
  const ranked = [...players].sort((a, b) => {
    if (a.user_id === winner.user_id) return -1
    if (b.user_id === winner.user_id) return 1
    return b.progress - a.progress
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center w-full max-w-xl"
      >
        {/* Unicorn reveal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-[#ffaa00] text-xs uppercase tracking-[0.3em] mb-4 font-semibold">
            🦄 UNICORN FOUNDER DETECTED 🦄
          </p>
          <div className="relative w-48 h-64 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-[#ffaa00] shadow-[0_0_40px_rgba(255,170,0,0.3)]">
            {winnerChar ? (
              <Image src={winnerChar.image} alt={winnerChar.name} fill className="object-cover object-top" sizes="192px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">🏆</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            {winnerChar?.name ?? winner.name}
          </h1>
          <p className="text-[#ffaa00] text-lg font-bold mb-1">
            has officially built a $1B Unicorn!
          </p>
          <p className="text-[#555] text-sm mb-2">@{winner.name} · {winner.wpm} WPM</p>
        </motion.div>

        {/* Cap table / leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 w-full"
        >
          <p className="text-[#555] text-xs uppercase tracking-widest mb-4">Cap Table — Final Standings</p>
          <div className="space-y-2">
            {ranked.map((p, i) => {
              const char = getCharacter(p.character_id)
              const isWinner = p.user_id === winner.user_id
              const stage = getValuationStage(p.progress)
              const dropoutLabel = isWinner ? '🦄 UNICORN — $1B' : `Bankrupt at ${stage.label}`

              return (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    isWinner
                      ? 'border-[#ffaa00] bg-[#ffaa0015]'
                      : 'border-[#1a1a1a] bg-[#111]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#555] text-sm w-4">#{i + 1}</span>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#333] flex-shrink-0">
                      {char ? (
                        <Image src={char.image} alt={char.name} fill className="object-cover object-top" sizes="32px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm bg-[#222]">👤</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">@{p.name}</p>
                      <p className="text-xs text-[#555]">{char?.name ?? 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: isWinner ? '#ffaa00' : stage.color }}>
                      {dropoutLabel}
                    </p>
                    <p className="text-xs text-[#555]">{p.wpm} WPM</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 flex gap-3"
        >
          <button
            onClick={() => router.push(`/room/${roomId}`)}
            className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-[#eee] transition-colors"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 border border-[#333] text-white font-semibold py-3 rounded-lg hover:border-[#555] transition-colors"
          >
            HOME
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
