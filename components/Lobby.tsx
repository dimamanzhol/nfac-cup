'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { CHARACTERS, getCharacter } from '@/data/characters'

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
  onGameStart: (text: string) => void
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
}

export default function Lobby({ room, players, userId, channel, onGameStart, setPlayers }: Props) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const isHost = room.host_id === userId
  const me = players.find((p) => p.user_id === userId)
  const allChosen = players.length > 0 && players.every((p) => p.character_id)

  async function selectCharacter(characterId: string) {
    await supabase
      .from('players')
      .update({ character_id: characterId })
      .eq('room_id', room.id)
      .eq('user_id', userId)

    setPlayers((prev) =>
      prev.map((p) => (p.user_id === userId ? { ...p, character_id: characterId } : p))
    )

    channel?.send({
      type: 'broadcast',
      event: 'character_selected',
      payload: { user_id: userId, character_id: characterId },
    })
  }

  async function startGame() {
    if (!allChosen) { setError('All players must select a character first.'); return }
    setStarting(true)
    setError('')

    const res = await fetch('/api/generate-text', { method: 'POST' })
    const { text } = await res.json()

    await supabase.from('rooms').update({ status: 'playing', text }).eq('id', room.id)

    channel?.send({
      type: 'broadcast',
      event: 'game_started',
      payload: { text },
    })

    onGameStart(text)
    setStarting(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Room code */}
        <div className="text-center mb-10">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-2">Room Code</p>
          <button
            onClick={copyCode}
            className="text-6xl font-black font-mono tracking-widest text-white hover:text-[#ccc] transition-colors"
          >
            {room.code}
          </button>
          <p className="text-[#444] text-xs mt-1">{copied ? 'Copied!' : 'click to copy'}</p>
          <p className="text-[#333] text-xs mt-2">{players.length}/10 founders in the arena</p>
        </div>

        {/* Character selection */}
        <div className="mb-8">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-3">Choose Your Founder</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHARACTERS.map((char) => {
              const selectedBy = players.find((p) => p.character_id === char.id)
              const isMe = me?.character_id === char.id
              const takenByOther = selectedBy && selectedBy.user_id !== userId

              return (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: takenByOther ? 1 : 1.02 }}
                  whileTap={{ scale: takenByOther ? 1 : 0.98 }}
                  onClick={() => !takenByOther && selectCharacter(char.id)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    isMe
                      ? 'border-white bg-white/10'
                      : takenByOther
                      ? 'border-[#222] opacity-40 cursor-not-allowed'
                      : 'border-[#222] hover:border-[#444] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{char.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{char.name}</p>
                      <p className="text-[#555] text-xs mt-1 leading-relaxed">{char.bio}</p>
                      {takenByOther && selectedBy && (
                        <p className="text-[#ff4444] text-xs mt-1">Selected by @{selectedBy.name}</p>
                      )}
                      {isMe && (
                        <p className="text-[#00ff88] text-xs mt-1 font-semibold">✓ Your founder</p>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Players list */}
        <div className="mb-8">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-3">In the Arena</p>
          <div className="space-y-2">
            {players.map((p) => {
              const char = getCharacter(p.character_id)
              return (
                <div key={p.user_id} className="flex items-center justify-between px-4 py-2 bg-[#111] rounded-lg border border-[#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">@{p.name}</span>
                    {p.is_host && <span className="text-[#ffaa00] text-xs">HOST</span>}
                  </div>
                  <span className="text-sm">
                    {char ? `${char.emoji} ${char.name}` : <span className="text-[#444] text-xs">selecting...</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Start button / waiting */}
        {isHost ? (
          <div>
            {error && <p className="text-[#ff4444] text-sm mb-3 text-center">{error}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startGame}
              disabled={starting || !allChosen}
              className="w-full bg-white text-black font-black py-4 rounded-lg text-lg hover:bg-[#eee] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {starting ? 'LAUNCHING...' : allChosen ? 'START GAME' : 'WAITING FOR ALL FOUNDERS...'}
            </motion.button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[#555] text-sm">
              {me?.character_id
                ? 'Waiting for host to start the game...'
                : 'Select your founder to get ready'}
            </p>
            <div className="flex justify-center gap-1 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-[#333] rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
