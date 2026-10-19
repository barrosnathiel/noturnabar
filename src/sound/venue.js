export function createVenueSound(iframe, speakers, ligado = true, alcance = {}) {
  const NEAR = alcance.perto ?? 5
  const FAR = alcance.longe ?? 46
  const PISO = alcance.piso ?? 0.18
  if (!ligado) {
    return {
      update: () => {},
      unlock: () => {},
      isReady: () => false,
      isOn: () => false,
      volumeFor: () => 0,
      tempo: () => NaN
    }
  }

  let player = null
  let ready = false
  let current = -1
  let mutedCache = true
  let checkedAt = 0

  function criarPlayer() {
    player = new window.YT.Player(iframe, {
      events: {
        onReady: () => {
          ready = true
          player.setVolume(50)
          player.playVideo()
        }
      }
    })
  }

  if (window.YT && window.YT.Player) {
    criarPlayer()
  } else {
    const anterior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof anterior === 'function') anterior()
      criarPlayer()
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  }

  function unlock() {
    if (!ready) return
    try {
      player.unMute()
      player.playVideo()
    } catch (error) {
      void error
    }
  }

  function isOn() {
    if (!ready) return false
    const now = performance.now()
    if (now - checkedAt > 400) {
      checkedAt = now
      try {
        mutedCache = player.isMuted()
      } catch (error) {
        mutedCache = true
      }
    }
    return !mutedCache
  }

  function loudness(position) {
    let best = Infinity
    for (const speaker of speakers) {
      const dx = position.x - speaker.x
      const dy = position.y - speaker.y
      const dz = position.z - speaker.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (distance < best) best = distance
    }
    if (best <= NEAR) return 1
    if (best >= FAR) return PISO
    const fade = 1 - (best - NEAR) / (FAR - NEAR)
    return PISO + Math.pow(fade, 1.4) * (1 - PISO)
  }

  function update(position) {
    if (!ready) return
    const target = Math.round(loudness(position) * 100)
    if (target === current) return
    current = target
    try {
      player.setVolume(target)
    } catch (error) {
      void error
    }
  }

  function tempo() {
    if (!ready) return NaN
    try {
      return player.getCurrentTime()
    } catch (error) {
      return NaN
    }
  }

  return {
    update,
    unlock,
    isReady: () => ready,
    isOn,
    tempo,
    volumeFor: (position) => Math.round(loudness(position) * 100)
  }
}
