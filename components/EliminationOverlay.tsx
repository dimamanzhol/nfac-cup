'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { getCharacter } from '@/data/characters'

interface Props {
  eliminatedName: string | null
  eliminatedCharacterId: string | null
  visible: boolean
}

export default function EliminationOverlay({ eliminatedName, eliminatedCharacterId, visible }: Props) {
  const char = getCharacter(eliminatedCharacterId)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-center px-6 sm:px-8"
          >
            <p className="text-[#ff4444] text-4xl sm:text-5xl font-black tracking-tighter mb-3 sm:mb-4">BURNT OUT!</p>
            {char && (
              <p className="text-white text-xl sm:text-2xl font-bold mb-2">
                {char.emoji} {char.name}
              </p>
            )}
            <p className="text-[#888] text-base sm:text-lg">
              @{eliminatedName} ran out of runway and went bankrupt.
            </p>
            <p className="text-[#444] text-sm mt-3 sm:mt-4">Series A dreams... crushed.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
