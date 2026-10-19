export function createHud() {
  const fpsEl = document.getElementById('fps')
  const helpEl = document.getElementById('help')
  let frames = 0
  let elapsed = 0
  let dismissed = false

  function tick(dt) {
    frames++
    elapsed += dt
    if (frames >= 30) {
      fpsEl.textContent = `${Math.round(frames / elapsed)} fps`
      frames = 0
      elapsed = 0
    }
  }

  function dismissHelp() {
    if (dismissed) return
    dismissed = true
    helpEl.classList.add('hidden')
    setTimeout(() => helpEl.remove(), 400)
  }

  function notice(text) {
    if (dismissed) return
    helpEl.innerHTML = `<div class="t">CASA DE SHOW</div>${text}`
  }

  const onlineEl = document.getElementById('online')
  let ultimoOnline = -1

  function online(total) {
    if (!onlineEl) return
    if (total === ultimoOnline) return
    ultimoOnline = total
    if (total < 1) {
      onlineEl.style.display = 'none'
      return
    }
    onlineEl.style.display = 'block'
    onlineEl.textContent = total === 1 ? '1 na casa' : `${total} na casa`
  }

  const soundEl = document.getElementById('sound')
  let lastSound = null

  function soundState(ready, on) {
    if (!soundEl) return
    const show = ready && !on
    if (show === lastSound) return
    lastSound = show
    soundEl.style.display = show ? 'block' : 'none'
  }

  const salaEl = document.getElementById('sala')

  function sala(texto) {
    if (!salaEl) return
    salaEl.textContent = texto
    salaEl.style.display = 'block'
  }

  return { tick, dismissHelp, notice, soundState, sala, online }
}
