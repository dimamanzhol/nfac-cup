'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Props {
  text: string
  typedCount: number
  onType: (count: number, isError: boolean) => void
  disabled: boolean
}

export default function TypingArea({ text, typedCount, onType, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputValueRef = useRef('')

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      if (e.key === 'Backspace') {
        if (typedCount > 0) {
          const newCount = typedCount - 1
          inputValueRef.current = inputValueRef.current.slice(0, -1)
          onType(newCount, false)
        }
        e.preventDefault()
        return
      }

      if (e.key.length !== 1) return

      const expected = text[typedCount]
      if (!expected) return

      if (e.key === expected) {
        const newCount = typedCount + 1
        inputValueRef.current += e.key
        onType(newCount, false)
      } else {
        onType(typedCount, true)
      }
      e.preventDefault()
    },
    [disabled, typedCount, text, onType]
  )

  const correctText = text.slice(0, typedCount)
  const currentChar = text[typedCount]
  const remainingText = text.slice(typedCount + 1)

  return (
    <div className="w-full">
      {/* Text display */}
      <div
        className="font-mono text-lg leading-relaxed mb-6 p-6 bg-[#111] rounded-lg border border-[#1a1a1a] select-none cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-[#00ff88]">{correctText}</span>
        {currentChar && (
          <span className="bg-white text-black rounded px-0.5">{currentChar}</span>
        )}
        <span className="text-[#555]">{remainingText}</span>
      </div>

      {/* Hidden input to capture keypresses */}
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        readOnly
        value=""
        onChange={() => {}}
        className="opacity-0 absolute w-0 h-0"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {disabled && (
        <p className="text-center text-[#ff4444] text-sm font-semibold">
          You have been eliminated. Watch the survivors.
        </p>
      )}
    </div>
  )
}
