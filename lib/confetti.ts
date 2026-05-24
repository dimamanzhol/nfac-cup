import confetti from 'canvas-confetti'

export function fireWinConfetti() {
  // Left burst
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors: ['#ffaa00', '#ff4444', '#ffffff', '#00ff88'],
  })
  // Right burst
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors: ['#ffaa00', '#ff4444', '#ffffff', '#00ff88'],
  })
  // Center shower after 300ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#ffaa00', '#ffffff'],
      gravity: 0.8,
    })
  }, 300)
}
