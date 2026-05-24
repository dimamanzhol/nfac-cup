'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CHARACTERS } from '@/data/characters'
import type { Difficulty } from '@/app/solo/SoloClient'

interface Props {
  username: string
  onStart: (characterId: string, difficulty: Difficulty) => Promise<void>
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: 'easy',   label: 'INTERN',   desc: '30–55 WPM bots',   color: '#00ff88' },
  { id: 'medium', label: 'FOUNDER',  desc: '65–90 WPM bots',   color: '#00aaff' },
  { id: 'hard',   label: 'UNICORN',  desc: '100–135 WPM bots', color: '#ff4444' },
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <button onClick={() => router.push('/')} className="text-[#444] text-xs hover:text-[#666] transition-colors mb-4 block mx-auto">← Back</button>
          <p className="text-[#ff4444] text-xs uppercase tracking-[0.3em] mb-2">Solo Mode</p>
          <h1 className="text-4xl font-black tracking-tighter text-white">VS AI</h1>
          <p className="text-[#555] text-sm mt-2">Race against 3 simulated founders. Last one typing wins.</p>
        </div>

        {/* Character pick */}
        <div className="mb-8">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-3">Choose Your Founder</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHARACTERS.map((char) => {
              const isSelected = selectedChar === char.id
              return (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedChar(char.id)}
                  className={`relative flex flex-col items-center rounded-xl border overflow-hidden transition-all ${
                    isSelected ? 'border-white' : 'border-[#222] hover:border-[#444]'
                  }`}
                  style={isSelected ? { borderColor: char.color, boxShadow: `0 0 20px ${char.color}30` } : {}}
                >
                  <div className="relative w-full aspect-[3/4] bg-[#0d0d0d]">
                    <Image src={char.image} alt={char.name} fill className="object-cover object-top" sizes="(max-width: 640px) 50vw, 25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full text-black" style={{ backgroundColor: char.color }}>
                        ✓ YOU
                      </div>
                    )}
                  </div>
                  <div className="p-3 w-full">
                    <p className="font-bold text-white text-xs leading-tight">{char.name}</p>
                    <p className="text-[#555] text-[10px] mt-1 leading-relaxed line-clamp-2">{char.bio}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-8">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-3">Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`py-4 px-3 rounded-xl border text-center transition-all ${
                  difficulty === d.id ? 'border-current bg-white/5' : 'border-[#222] hover:border-[#333]'
                }`}
                style={difficulty === d.id ? { borderColor: d.color, color: d.color } : { color: '#555' }}
              >
                <p className="font-black text-sm">{d.label}</p>
                <p className="text-[10px] mt-1 opacity-70">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={!selectedChar || loading}
          className="w-full bg-white text-black font-black py-4 rounded-xl text-lg hover:bg-[#eee] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'LOADING BATTLEFIELD...' : 'START RACE'}
        </motion.button>
      </div>
    </div>
  )
}
