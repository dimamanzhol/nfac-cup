let ctx: AudioContext | null = null

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Mechanical keyboard click — filtered noise burst
export function playClick() {
  try {
    const c = ac()
    const len = Math.floor(c.sampleRate * 0.018)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = c.createBufferSource()
    src.buffer = buf
    const filt = c.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = 3500
    filt.Q.value = 0.8
    const gain = c.createGain()
    gain.gain.value = 0.25
    src.connect(filt)
    filt.connect(gain)
    gain.connect(c.destination)
    src.start()
  } catch {}
}

// Wrong key — short buzz
export function playError() {
  try {
    const c = ac()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 120
    gain.gain.setValueAtTime(0.18, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.07)
  } catch {}
}

// Word destroyed / correct — satisfying pop
export function playPop() {
  try {
    const c = ac()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.frequency.setValueAtTime(350, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.06)
    gain.gain.setValueAtTime(0.25, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.12)
  } catch {}
}

// Someone eliminated — low thud
export function playElimination() {
  try {
    const c = ac()
    const len = Math.floor(c.sampleRate * 0.35)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5)
    }
    const src = c.createBufferSource()
    src.buffer = buf
    const filt = c.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = 140
    const gain = c.createGain()
    gain.gain.value = 1.8
    src.connect(filt)
    filt.connect(gain)
    gain.connect(c.destination)
    src.start()
  } catch {}
}

// Win fanfare — ascending chime
export function playWin() {
  try {
    const c = ac()
    const notes = [523, 659, 784, 1047, 1319] // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = c.currentTime + i * 0.11
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.35)
    })
  } catch {}
}

// Game over — descending sad tones
export function playGameOver() {
  try {
    const c = ac()
    const notes = [440, 370, 311, 261] // A4 F#4 D#4 C4
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = c.currentTime + i * 0.15
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
  } catch {}
}
