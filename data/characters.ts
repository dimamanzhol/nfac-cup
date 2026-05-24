export interface Character {
  id: string
  name: string
  nameEn: string
  bio: string
  color: string
  emoji: string
  image: string
}

export const CHARACTERS: Character[] = [
  {
    id: 'arman',
    name: 'Арман Сулейменов',
    nameEn: 'Arman Suleimenov',
    bio: 'The OG. Types code at 120 WPM while delivering a motivational speech about building products in 48 hours.',
    color: '#ff4444',
    emoji: '🔥',
    image: '/characters/arman-game.png',
  },
  {
    id: 'erzat',
    name: 'Ерзат Дулат',
    nameEn: 'Erzat Dulat',
    bio: 'The Hyper-Growth machine. Unmatched speed when typing technical text. Seed rounds closed before lunch.',
    color: '#00ff88',
    emoji: '⚡',
    image: '/characters/erzat-game.png',
  },
  {
    id: 'arlan',
    name: 'Арлан Рахметжанов',
    nameEn: 'Arlan Rakhmetzhanov',
    bio: 'The AI Alchemist. Generates code prompts instantly. Watch out for typos — models hallucinate.',
    color: '#00aaff',
    emoji: '🤖',
    image: '/characters/arlan-game.png',
  },
  {
    id: 'tigr',
    name: 'Тигр',
    nameEn: 'Tigr',
    bio: 'The Wildcard. Unpredictable typing speed. Known to go from zero to Series B in a single keystroke.',
    color: '#ffaa00',
    emoji: '🐯',
    image: '/characters/tigr-game.png',
  },
]

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]))

export function getCharacter(id: string | null): Character | null {
  if (!id) return null
  return CHARACTER_MAP[id] ?? null
}
