export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function calcWPM(charsTyped: number, startTime: number): number {
  const minutes = (Date.now() - startTime) / 60000
  if (minutes === 0) return 0
  return Math.round(charsTyped / 5 / minutes)
}

export function calcProgress(typed: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((typed / total) * 100))
}

export interface ValuationStage {
  label: string
  valuation: string
  color: string
}

export function getValuationStage(progress: number): ValuationStage {
  if (progress >= 100) return { label: '🦄 UNICORN STATUS', valuation: '$1B VALUATION', color: '#ffaa00' }
  if (progress >= 76) return { label: 'Series B', valuation: '$500M — Approaching the Valley...', color: '#00aaff' }
  if (progress >= 46) return { label: 'Series A', valuation: '$100M – $250M Valuation', color: '#00ff88' }
  if (progress >= 16) return { label: 'Seed Round', valuation: '$10M – $50M Valuation', color: '#aa00ff' }
  return { label: 'Pre-seed', valuation: '$0M – $5M Valuation', color: '#666666' }
}
