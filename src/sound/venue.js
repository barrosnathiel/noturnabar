const NEAR = 5
const FAR = 46

export function createVenueSound(iframe, speakers) {
  let player = null
  let ready = false
  let unlocked = false
  let current = -1

  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)

  window.onYouTubeIframeAPIReady = () => {
    player = new window.YT.Player(iframe, {
      events: {
        onReady: () => {
          ready = true
          player.setVolume(0)
          player.playVideo()
        }
      }
    })
  }

  function unlock() {
    if (!ready || unlocked) return
    unlocked = true
    try {
      player.unMute()
      player.playVideo()
    } catch (error) {
      unlocked = false
    }
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
    if (best >= FAR) return 0.18
    const fade = 1 - (best - NEAR) / (FAR - NEAR)
    return 0.18 + Math.pow(fade, 1.4) * 0.82
  }

  function update(position) {
    if (!ready || !unlocked) return
    const target = Math.round(loudness(position) * 100)
    if (target === current) return
    current = target
    player.setVolume(target)
  }

  return { update, unlock, isReady: () => ready, volumeFor: (position) => Math.round(loudness(position) * 100) }
}
