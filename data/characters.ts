export interface Character {
  id: string
  name: string
  nameEn: string
  bio: string
  color: string
  emoji: string
}

export const CHARACTERS: Character[] = [
  {
    id: 'arman',
    name: 'Арман Сулейменов',
    nameEn: 'Arman Suleimenov',
    bio: 'The OG. Types code at 120 WPM while delivering a motivational speech about building products in 48 hours.',
    color: '#ff4444',
    emoji: '🔥',
  },
  {
    id: 'erzat',
    name: 'Ерзат Дулат',
    nameEn: 'Erzat Dulat',
    bio: 'The Hyper-Growth machine. Unmatched speed when typing technical text. Seed rounds closed before lunch.',
    color: '#00ff88',
    emoji: '⚡',
  },
  {
    id: 'arlan',
    name: 'Арлан Рахметжанов',
    nameEn: 'Arlan Rakhmetzhanov',
    bio: 'The AI Alchemist. Generates code prompts instantly. Watch out for typos — models hallucinate.',
    color: '#00aaff',
    emoji: '🤖',
  },
  {
    id: 'dosjan',
    name: 'Досжан Жусупов',
    nameEn: 'Dosjan Zhussupov',
    bio: 'The DeepTech Pioneer. High precision, zero tolerance for typos. PhD-level keystroke accuracy.',
    color: '#aa00ff',
    emoji: '🔬',
  },
  {
    id: 'askhat',
    name: 'Асхат Омаров',
    nameEn: 'Askhat Omarov',
    bio: 'The Ecosystem Builder. Extreme endurance. Has been moving towards an IPO since 2019.',
    color: '#ffaa00',
    emoji: '🏗️',
  },
]

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]))

export function getCharacter(id: string | null): Character | null {
  if (!id) return null
  return CHARACTER_MAP[id] ?? null
}
