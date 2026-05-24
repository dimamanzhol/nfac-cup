'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    <div className="min-h-screen bg-[#0a0a0a] bg-grid flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-2xl">
        {/* Room code */}
        <div className="text-center mb-6 sm:mb-10">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Room Code</p>
          <button
            onClick={copyCode}
            className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-white hover:text-white/70 transition-colors"
          >
            {room.code}
          </button>
          <p className="text-white/25 text-xs mt-1">{copied ? 'Copied!' : 'tap to copy'}</p>
          <p className="text-white/15 text-xs mt-1">{players.length}/10 founders</p>
        </div>

        {/* Character selection */}
        <div className="mb-6 sm:mb-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Choose Your Founder</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHARACTERS.map((char) => {
              const selectedBy = players.find((p) => p.character_id === char.id)
              const isMe = me?.character_id === char.id
              const takenByOther = selectedBy && selectedBy.user_id !== userId

              return (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: takenByOther ? 1 : 1.04 }}
                  whileTap={{ scale: takenByOther ? 1 : 0.96 }}
                  onClick={() => !takenByOther && selectCharacter(char.id)}
                  className={`relative flex flex-col items-center rounded-xl border overflow-hidden transition-all ${
                    isMe
                      ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                      : takenByOther
                      ? 'border-[#1a1a1a] opacity-40 cursor-not-allowed'
                      : 'border-[#222] hover:border-[#444] cursor-pointer'
                  }`}
                  style={isMe ? { borderColor: char.color, boxShadow: `0 0 20px ${char.color}30` } : {}}
                >
                  {/* Character image */}
                  <div className="relative w-full aspect-[3/4] bg-[#0d0d0d]">
                    <Image
                      src={char.image}
                      alt={char.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                    {isMe && (
                      <div
                        className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: char.color, color: '#000' }}
                      >
                        ✓ YOU
                      </div>
                    )}
                    {takenByOther && selectedBy && (
                      <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-[#ff4444] text-white">
                        TAKEN
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 w-full">
                    <p className="font-bold text-white text-xs leading-tight">{char.name}</p>
                    <p className="text-[#555] text-[10px] mt-1 leading-relaxed line-clamp-2">{char.bio}</p>
                    {takenByOther && selectedBy && (
                      <p className="text-[#ff4444] text-[10px] mt-1">@{selectedBy.name}</p>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Players list */}
        <div className="mb-6 sm:mb-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">In the Arena</p>
          <div className="space-y-2">
            {players.map((p) => {
              const char = getCharacter(p.character_id)
              return (
                <div key={p.user_id} className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white/3 rounded-xl border border-white/8">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">@{p.name}</span>
                    {p.is_host && <span className="text-[#ffaa00] text-xs font-bold">HOST</span>}
                  </div>
                  {char ? (
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/15">
                        <Image src={char.image} alt={char.name} fill className="object-cover object-top" sizes="28px" />
                      </div>
                      <span className="text-xs text-white/50 hidden sm:block">{char.name}</span>
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">selecting...</span>
                  )}
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
