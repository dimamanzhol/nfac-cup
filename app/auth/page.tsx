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
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }
    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-grid" style={{ background: '#0a0a0a' }}>

      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, #ff4444, transparent)' }} />
        <div className="relative z-10">
          <span className="text-white font-black text-2xl tracking-tighter">TypeWar</span>
        </div>
        <div className="relative z-10">
          <p className="text-5xl font-black text-white leading-tight tracking-tighter mb-6">
            Type or die.<br />
            <span className="text-[#ff4444]">Last founder<br />standing wins.</span>
          </p>
          <p className="text-white/30 text-sm">The Kazakh startup battle royale</p>
        </div>
        <div className="relative z-10 flex gap-3 flex-wrap">
          {['🔥 120 WPM', '⚡ Realtime', '🦄 Unicorn'].map((tag) => (
            <span key={tag} className="text-xs text-white/20 border border-white/10 px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col min-h-screen">

        {/* Mobile-only brand header */}
        <div className="lg:hidden flex flex-col items-center pt-12 pb-6 px-6 relative overflow-hidden">
          <div className="absolute inset-0 blur-[80px] opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #ff4444, transparent 70%)' }} />
          <h1 className="text-5xl font-black tracking-tighter text-white mb-1 relative z-10">TypeWar</h1>
          <p className="text-white/40 text-sm relative z-10">Type or die. Last founder standing wins.</p>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Join the arena'}
              </h2>
              <p className="text-white/40 text-sm">
                {mode === 'signin' ? 'Sign in to your account' : 'Create your founder account'}
              </p>
            </div>

            <div className="lg:hidden mb-6">
              <h2 className="text-xl font-bold text-white text-center">
                {mode === 'signin' ? 'Welcome back' : 'Join the arena'}
              </h2>
            </div>

            {/* Toggle */}
            <div className="flex mb-5 p-1 bg-white/5 border border-white/10 rounded-xl">
              {(['signin', 'signup'] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    mode === m ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white'
                  }`}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">Username</label>
                  <input type="text" placeholder="yourhandle" value={username}
                    onChange={(e) => setUsername(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-base"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">Email</label>
                <input type="email" placeholder="you@startup.kz" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-base"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">Password</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-base"
                />
              </div>

              {error && (
                <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-xl px-4 py-3">
                  <p className="text-[#ff4444] text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-all disabled:opacity-40 text-sm tracking-wide mt-1">
                {loading ? '...' : mode === 'signin' ? 'ENTER THE ARENA' : 'JOIN THE ECOSYSTEM'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
