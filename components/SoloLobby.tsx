'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CHARACTERS } from '@/data/characters'
import type { Difficulty } from '@/app/solo/SoloClient'

interface Props {
  username: string
  onStart: (characterId: string, difficulty: Difficulty) => Promise<void>
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; wpm: string; color: string }[] = [
  { id: 'easy',   label: 'INTERN',   desc: 'Just joined the ecosystem',    wpm: '30–55 WPM',   color: '#00ff88' },
  { id: 'medium', label: 'FOUNDER',  desc: 'Series A, ready to compete',   wpm: '65–90 WPM',   color: '#00aaff' },
  { id: 'hard',   label: 'UNICORN',  desc: 'No mercy. Brutal pace.',       wpm: '100–135 WPM', color: '#ff4444' },
]

export default function SoloLobby({ username, onStart }: Props) {
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    if (!selectedChar) return
    setLoading(true)
    await onStart(selectedChar, difficulty)
    setLoading(false)
  }

  const selectedDiff = DIFFICULTIES.find(d => d.id === difficulty)!

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] blur-[120px] opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${selectedDiff.color} 0%, transparent 70%)`, transition: 'background 0.5s' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm">
            ← Back
          </button>
          <div className="text-center">
            <p className="text-[#ff4444] text-xs uppercase tracking-[0.3em] font-semibold mb-1">Solo Mode</p>
            <h1 className="text-3xl font-black tracking-tighter text-white">VS AI</h1>
          </div>
          <div className="text-sm text-white/20">@{username}</div>
        </div>

        {/* Character grid */}
        <div className="mb-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">Choose Your Founder</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHARACTERS.map((char, i) => {
              const isSelected = selectedChar === char.id
              return (
                <motion.button
                  key={char.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedChar(char.id)}
                  className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                    isSelected ? 'border-white/50' : 'border-white/8 hover:border-white/20'
                  }`}
                  style={isSelected ? {
                    borderColor: char.color,
                    boxShadow: `0 0 24px ${char.color}30, 0 0 60px ${char.color}10`
                  } : {}}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[3/4] bg-[#0d0d0d]">
                    <Image src={char.image} alt={char.name} fill className="object-cover object-top" sizes="(max-width: 640px) 50vw, 25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-black text-xs font-black"
                        style={{ backgroundColor: char.color }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-[#0d0d0d]">
                    <p className="font-bold text-white text-xs leading-tight">{char.name}</p>
                    <p className="text-white/30 text-[10px] mt-1 leading-relaxed line-clamp-2">{char.bio}</p>
                  </div>

                  {/* Selected border glow */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ boxShadow: `inset 0 0 0 1px ${char.color}` }} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => {
              const isActive = difficulty === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`relative py-4 px-3 rounded-2xl border text-center transition-all ${
                    isActive ? 'border-current' : 'border-white/8 hover:border-white/15'
                  }`}
                  style={isActive ? {
                    borderColor: d.color,
                    background: `${d.color}08`,
                    boxShadow: `0 0 20px ${d.color}15`
                  } : {}}
                >
                  <p className={`font-black text-sm mb-1 ${isActive ? '' : 'text-white/40'}`}
                    style={isActive ? { color: d.color } : {}}>{d.label}</p>
                  <p className={`text-[10px] font-mono ${isActive ? 'text-white/60' : 'text-white/20'}`}>{d.wpm}</p>
                  <p className={`text-[9px] mt-1 ${isActive ? 'text-white/40' : 'text-white/15'}`}>{d.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Start button */}
        <AnimatePresence mode="wait">
          <motion.button
            key={selectedChar ?? 'none'}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!selectedChar || loading}
            className="w-full py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={selectedChar ? {
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
              color: '#000',
              boxShadow: '0 0 40px rgba(255,255,255,0.1)'
            } : {
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {loading ? 'LOADING BATTLEFIELD...' : selectedChar ? 'START RACE →' : 'SELECT A FOUNDER FIRST'}
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  )
}
