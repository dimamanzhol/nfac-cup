'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/game'

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
    const { error } = await supabase.from('rooms').insert({
      code,
      host_id: authUser.id,
      status: 'lobby',
    })
    if (error) { setError(error.message); setCreating(false); return }

    // Join as host player
    await supabase.from('players').insert({
      room_id: (await supabase.from('rooms').select('id').eq('code', code).single()).data?.id,
      user_id: authUser.id,
      name: user?.username ?? 'Anonymous',
      is_host: true,
    })

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-7xl font-black tracking-tighter text-white mb-2">TypeWar</h1>
          <p className="text-[#555] text-base">Multiplayer battle royale typing game</p>
          <p className="text-[#333] text-xs mt-1">Type or die. Last founder standing wins the 🦄</p>
        </div>

        {/* User stats */}
        {user && (
          <div className="flex items-center justify-center gap-6 mb-10 text-sm">
            <span className="text-white font-semibold">@{user.username}</span>
            <span className="text-[#555]">|</span>
            <span className="text-[#666]">Best: <span className="text-white">{user.best_wpm} WPM</span></span>
            <span className="text-[#555]">|</span>
            <span className="text-[#666]">Wins: <span className="text-[#ffaa00]">{user.total_wins} 🦄</span></span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={createRoom}
            disabled={creating}
            className="w-full bg-white text-black font-bold py-4 rounded-lg text-lg hover:bg-[#eee] transition-colors disabled:opacity-50"
          >
            {creating ? 'CREATING...' : 'CREATE ROOM'}
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              className="flex-1 bg-[#111] border border-[#333] rounded-lg px-4 py-4 text-white placeholder-[#444] font-mono text-center text-lg tracking-widest focus:outline-none focus:border-[#555] uppercase"
            />
            <button
              onClick={joinRoom}
              disabled={joining}
              className="bg-[#111] border border-[#333] text-white font-bold px-6 py-4 rounded-lg hover:border-[#555] transition-colors disabled:opacity-50"
            >
              {joining ? '...' : 'JOIN'}
            </button>
          </div>

          <button
            onClick={() => router.push('/leaderboard')}
            className="w-full border border-[#222] text-[#666] font-semibold py-3 rounded-lg hover:border-[#333] hover:text-white transition-colors text-sm"
          >
            LEADERBOARD
          </button>
        </div>

        {error && (
          <p className="text-[#ff4444] text-sm mt-4">{error}</p>
        )}

        <button
          onClick={signOut}
          className="mt-8 text-[#333] text-xs hover:text-[#666] transition-colors"
        >
          sign out
        </button>
      </motion.div>
    </div>
  )
}
