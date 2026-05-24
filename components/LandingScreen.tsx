'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/game'
import { CHARACTERS } from '@/data/characters'

interface Props {
  user: { username: string; total_wins: number; best_wpm: number } | null
}

export default function LandingScreen({ user }: Props) {
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function createRoom() {
    setCreating(true)
    setError('')
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth'); return }
    const code = generateRoomCode()
    const { error } = await supabase.from('rooms').insert({ code, host_id: authUser.id, status: 'lobby' })
    if (error) { setError(error.message); setCreating(false); return }
    const { data: room } = await supabase.from('rooms').select('id').eq('code', code).single()
    await supabase.from('players').insert({ room_id: room?.id, user_id: authUser.id, name: user?.username ?? 'Anonymous', is_host: true })
    router.push(`/room/${code}`)
  }

  async function joinRoom() {
    const code = joinCode.trim().toUpperCase()
    if (!code || code.length !== 4) { setError('Enter a 4-character room code'); return }
    setJoining(true)
    setError('')
    router.push(`/room/${code}`)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] blur-[100px] sm:blur-[120px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #ff4444 0%, transparent 70%)' }} />

      {/* Top nav */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-white/5 relative z-10">
        <span className="font-black text-white text-lg tracking-tighter">TypeWar</span>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Stats — hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="text-white/50">@{user.username}</span>
              <span className="text-white/20">·</span>
              <span className="text-white/40">{user.best_wpm} <span className="text-white/60">WPM</span></span>
              <span className="text-white/20">·</span>
              <span className="text-[#ffaa00]">{user.total_wins} 🦄</span>
            </div>
            {/* Username only on mobile */}
            <span className="sm:hidden text-white/40 text-sm">@{user.username}</span>

            <button onClick={() => router.push('/leaderboard')}
              className="text-xs text-white/30 border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-lg hover:border-white/20 hover:text-white/60 transition-all">
              Board
            </button>
            <button onClick={signOut} className="text-xs text-white/20 hover:text-white/40 transition-colors hidden sm:block">
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-sm sm:max-w-xl"
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-7xl sm:text-8xl font-black tracking-tighter text-white mb-2 sm:mb-3 text-glow-red leading-none"
          >
            TypeWar
          </motion.h1>
          <p className="text-white/40 text-sm sm:text-base mb-1 sm:mb-2">Multiplayer battle royale typing game</p>
          <p className="text-white/20 text-xs sm:text-sm mb-6">Type or die — last founder standing wins the 🦄</p>

          {/* Character showcase */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-10 w-full">
            {CHARACTERS.map((char, i) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative rounded-xl overflow-hidden border cursor-default"
                style={{ borderColor: `${char.color}40` }}
              >
                {/* Portrait */}
                <div className="relative w-full aspect-[3/4] bg-[#0d0d0d]">
                  <Image
                    src={char.image}
                    alt={char.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 25vw, 130px"
                  />
                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
                  {/* Color glow at bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: char.color, boxShadow: `0 0 12px ${char.color}` }}
                  />
                  {/* Emoji badge */}
                  <div className="absolute top-1.5 left-1.5 text-sm">{char.emoji}</div>
                </div>
                {/* Name */}
                <div className="p-1.5 bg-[#0d0d0d]">
                  <p className="text-[9px] sm:text-[10px] font-bold text-white/70 leading-tight truncate">
                    {char.nameEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* User stats on mobile (below characters) */}
          {user && (
            <div className="sm:hidden flex items-center justify-center gap-3 text-xs mb-6 text-white/40">
              <span>{user.best_wpm} WPM</span>
              <span className="text-white/15">·</span>
              <span className="text-[#ffaa00]">{user.total_wins} unicorns</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5 sm:space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/solo')}
              className="w-full relative overflow-hidden rounded-xl sm:rounded-2xl py-4 font-black text-base sm:text-lg text-white transition-all glow-red"
              style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc2222 100%)' }}
            >
              VS AI 🤖
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/word-drop')}
              className="w-full rounded-xl sm:rounded-2xl py-4 font-black text-base sm:text-lg text-white transition-all border border-[#ffaa00]/30 hover:border-[#ffaa00]/60"
              style={{ background: 'linear-gradient(135deg, #1a1200 0%, #0d0a00 100%)' }}
            >
              WORD DROP ☄️
            </motion.button>

            <div className="flex items-center gap-3 py-0.5">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-white/20 text-xs">or play with friends</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={createRoom}
              disabled={creating}
              className="w-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all disabled:opacity-40 text-sm tracking-wide"
            >
              {creating ? 'CREATING...' : 'CREATE ROOM'}
            </motion.button>

            <div className="flex gap-2">
              <input
                type="text" placeholder="CODE" value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                className="flex-1 bg-white/5 border border-white/10 focus:border-white/30 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3.5 sm:py-4 text-white placeholder-white/20 font-mono text-center text-base sm:text-lg tracking-[0.3em] focus:outline-none transition-all uppercase min-w-0"
              />
              <button onClick={joinRoom} disabled={joining}
                className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all disabled:opacity-40 text-sm shrink-0">
                {joining ? '...' : 'JOIN'}
              </button>
            </div>
          </div>

          {error && <p className="text-[#ff4444] text-sm mt-3">{error}</p>}

          <button onClick={signOut} className="sm:hidden mt-6 text-white/20 text-xs hover:text-white/40 transition-colors">
            sign out
          </button>
        </motion.div>
      </div>

      <div className="text-center pb-4 sm:pb-6 relative z-10">
        <p className="text-white/10 text-xs">Built at nFactorial Incubator · 2026</p>
      </div>
    </div>
  )
}
