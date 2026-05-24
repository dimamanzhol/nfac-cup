'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">TypeWar</h1>
          <p className="text-[#666] text-sm">The Kazakh Startup Battle Royale</p>
        </div>

        <div className="flex mb-6 border border-[#222] rounded-lg overflow-hidden">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                mode === m ? 'bg-white text-black' : 'text-[#666] hover:text-white'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#555]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#555]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#555]"
          />

          {error && <p className="text-[#ff4444] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-[#eee] transition-colors disabled:opacity-50"
          >
            {loading ? '...' : mode === 'signin' ? 'ENTER THE ARENA' : 'JOIN THE ECOSYSTEM'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
