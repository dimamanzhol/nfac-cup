import Anthropic from '@anthropic-ai/sdk'
import { FALLBACK_TEXTS } from '@/data/fallbackTexts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateTypingText(): Promise<string> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content:
            'Generate a single typing paragraph between 150-200 characters. The text must be engineering jargon mixed with local Kazakh tech flavor. Themes: Raising a seed round from MOST Ventures or Shanyrak VC, pitching at Digital Bridge or Astana Hub, getting accepted into Silkroad Innovation Hub in Silicon Valley, or scaling an MVP out of Almaty. Output only the paragraph text, no quotes, no extra explanation.',
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (text.length >= 100) return text
    return FALLBACK_TEXTS[Math.floor(Math.random() * FALLBACK_TEXTS.length)]
  } catch {
    return FALLBACK_TEXTS[Math.floor(Math.random() * FALLBACK_TEXTS.length)]
  }
}
