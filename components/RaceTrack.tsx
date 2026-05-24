'use client'

import Image from 'next/image'
import { getCharacter } from '@/data/characters'

interface Racer {
  id: string
  name: string
  character_id: string
  isPlayer: boolean
  progress: number
  eliminated: boolean
}

interface Props {
  racers: Racer[]
}

export default function RaceTrack({ racers }: Props) {
  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="relative">
        {/* Finish line */}
        <div className="absolute right-10 sm:right-12 top-0 bottom-0 w-px border-r-2 border-dashed border-[#ffaa00] opacity-50" />
        <div className="absolute right-8 sm:right-10 -top-4 sm:-top-5 text-[#ffaa00] text-xs sm:text-sm font-bold">🦄</div>

        {/* Lanes */}
        <div className="space-y-2 sm:space-y-3 pr-10 sm:pr-12">
          {racers.map((racer) => {
            const char = getCharacter(racer.character_id)
            const clampedProgress = Math.min(racer.progress, 97)

            return (
              <div key={racer.id} className="flex items-center gap-1.5 sm:gap-3">
                {/* Name label */}
                <div className="w-10 sm:w-16 flex-shrink-0 text-right">
                  <p className={`text-[9px] sm:text-[10px] font-semibold truncate ${racer.isPlayer ? 'text-white' : 'text-white/30'}`}>
                    {racer.isPlayer ? 'YOU' : racer.name.split(' ')[0]}
                  </p>
                </div>

                {/* Track */}
                <div className="relative flex-1 h-8 sm:h-10 bg-white/3 rounded-lg border border-white/5 overflow-hidden">
                  {/* Track dashes */}
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 31px)' }} />

                  {/* Progress fill */}
                  <div className="absolute left-0 top-0 h-full rounded-lg transition-all duration-100"
                    style={{
                      width: `${clampedProgress}%`,
                      background: racer.eliminated
                        ? 'rgba(255,68,68,0.05)'
                        : racer.isPlayer
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.03)',
                    }} />

                  {/* Avatar */}
                  <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-100"
                    style={{ left: `calc(${clampedProgress}% - 14px)` }}>
                    <div
                      className={`relative rounded-full overflow-hidden border flex-shrink-0 ${
                        racer.eliminated
                          ? 'border-[#ff4444]/50 grayscale opacity-40'
                          : racer.isPlayer
                          ? 'border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                          : 'border-white/20'
                      }`}
                      style={{
                        width: 28,
                        height: 28,
                        ...(!racer.eliminated && !racer.isPlayer && char ? { borderColor: `${char.color}80` } : {}),
                      }}
                    >
                      {char ? (
                        <Image src={char.image} alt={char.name} fill className="object-cover object-top" sizes="28px" />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs">?</div>
                      )}
                    </div>
                    {racer.eliminated && (
                      <div className="absolute -top-1 -right-1 text-[10px]">💀</div>
                    )}
                  </div>
                </div>

                {/* % */}
                <div className="w-7 sm:w-10 flex-shrink-0">
                  <p className={`text-[10px] sm:text-xs font-mono font-bold ${racer.eliminated ? 'text-[#ff4444]' : racer.isPlayer ? 'text-white' : 'text-white/30'}`}>
                    {racer.eliminated ? '💀' : `${Math.round(racer.progress)}%`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
