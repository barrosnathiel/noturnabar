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

  return { tick, dismissHelp, notice }
}
