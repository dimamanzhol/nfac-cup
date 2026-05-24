import { NextResponse } from 'next/server'
import { generateTypingText } from '@/lib/claude'

export async function POST() {
  const text = await generateTypingText()
  return NextResponse.json({ text })
}
