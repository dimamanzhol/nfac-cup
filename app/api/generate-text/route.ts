import { NextResponse } from 'next/server'
import { FALLBACK_TEXTS } from '@/data/fallbackTexts'

export async function POST() {
  const text = FALLBACK_TEXTS[Math.floor(Math.random() * FALLBACK_TEXTS.length)]
  return NextResponse.json({ text })
}
