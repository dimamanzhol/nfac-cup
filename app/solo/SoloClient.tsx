'use client'

import { useState } from 'react'
import { CHARACTERS } from '@/data/characters'
import SoloLobby from '@/components/SoloLobby'
import SoloGame from '@/components/SoloGame'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Bot {
  id: string
  name: string
  character_id: string
  wpm: number          // target WPM
  progress: number
  eliminated: boolean
}

export interface Props {
  userId: string
  username: string
}

// Bot WPM ranges per difficulty
const BOT_SPEEDS: Record<Difficulty, [number, number]> = {
  easy:   [30, 55],
  medium: [65, 90],
  hard:   [100, 135],
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function SoloClient({ userId, username }: Props) {
  const [phase, setPhase] = useState<'lobby' | 'game'>('lobby')
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [text, setText] = useState('')
  const [bots, setBots] = useState<Bot[]>([])

  async function startGame(charId: string, diff: Difficulty) {
    setCharacterId(charId)
    setDifficulty(diff)

    // Fetch AI-generated text
    const res = await fetch('/api/generate-text', { method: 'POST' })
    const { text: generatedText } = await res.json()
    setText(generatedText)

    // Build bots from remaining characters
    const botChars = CHARACTERS.filter((c) => c.id !== charId)
    const [min, max] = BOT_SPEEDS[diff]
    const generatedBots: Bot[] = botChars.map((c) => ({
      id: c.id,
      name: c.name,
      character_id: c.id,
      wpm: randomBetween(min, max),
      progress: 0,
      eliminated: false,
    }))

    setBots(generatedBots)
    setPhase('game')
  }

  if (phase === 'game' && characterId && text) {
    return (
      <SoloGame
        userId={userId}
        username={username}
        characterId={characterId}
        difficulty={difficulty}
        text={text}
        initialBots={bots}
        onRestart={() => setPhase('lobby')}
      />
    )
  }

  return (
    <SoloLobby
      username={username}
      onStart={startGame}
    />
  )
}
