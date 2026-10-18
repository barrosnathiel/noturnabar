const DEAD_ZONE = 0.14
const DRAG_SPEED = 0.0038
const STICK_SPEED = 2.6

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function createTouchInput() {
  const supported = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches
  const state = { forward: 0, strafe: 0, run: false, jump: false }
  const drag = { dx: 0, dy: 0 }
  const rate = { x: 0, y: 0 }
  if (!supported) {
    return { supported, state, rate, consumeDrag: () => drag, engaged: () => false }
  }

  const moveStick = document.getElementById('stick')
  const lookStick = document.getElementById('look')
  const jump = document.getElementById('jump')
  const run = document.getElementById('run')
  const full = document.getElementById('full')

  let dragId = null
  let lastX = 0
  let lastY = 0
  let touched = false
  const ios = isIOS()

  document.body.classList.add('touch')
  if (ios) document.body.classList.add('ios')

  function bindStick(element, radius, onMove, onRelease) {
    const knob = element.querySelector('.knob')
    let pointer = null

    const place = (event) => {
      const rect = element.getBoundingClientRect()
      let dx = event.clientX - (rect.left + rect.width / 2)
      let dy = event.clientY - (rect.top + rect.height / 2)
      const length = Math.hypot(dx, dy)
      if (length > radius) {
        dx = (dx / length) * radius
        dy = (dy / length) * radius
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`
      const nx = dx / radius
      const ny = dy / radius
      onMove(Math.abs(nx) > DEAD_ZONE ? nx : 0, Math.abs(ny) > DEAD_ZONE ? ny : 0)
    }

    element.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      try { element.setPointerCapture(event.pointerId) } catch (error) { void error }
      pointer = event.pointerId
      touched = true
      place(event)
    })
    element.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointer) return
      event.preventDefault()
      place(event)
    })
    const release = (event) => {
      if (event.pointerId !== pointer) return
      pointer = null
      knob.style.transform = 'translate(0px, 0px)'
      onRelease()
    }
    element.addEventListener('pointerup', release)
    element.addEventListener('pointercancel', release)
  }

  bindStick(moveStick, 52, (x, y) => {
    state.strafe = x
    state.forward = -y
  }, () => {
    state.forward = 0
    state.strafe = 0
  })

  bindStick(lookStick, 46, (x, y) => {
    rate.x = x * STICK_SPEED
    rate.y = y * STICK_SPEED
  }, () => {
    rate.x = 0
    rate.y = 0
  })

  jump.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    try { jump.setPointerCapture(event.pointerId) } catch (error) { void error }
    touched = true
    state.jump = true
    jump.classList.add('on')
  })
  const dropJump = () => {
    state.jump = false
    jump.classList.remove('on')
  }
  jump.addEventListener('pointerup', dropJump)
  jump.addEventListener('pointercancel', dropJump)

  run.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    touched = true
    state.run = !state.run
    run.classList.toggle('on', state.run)
  })

  async function goFullscreen() {
    const root = document.documentElement
    if (!root.requestFullscreen) return false
    if (document.fullscreenElement) return true
    try {
      await root.requestFullscreen({ navigationUI: 'hide' })
      return true
    } catch (error) {
      return false
    }
  }

  async function lockLandscape() {
    if (!screen.orientation || !screen.orientation.lock) return false
    try {
      await screen.orientation.lock('landscape')
      return true
    } catch (error) {
      return false
    }
  }

  let attempts = 0
  async function immersive() {
    if (attempts >= 3 || document.fullscreenElement) return
    attempts++
    const ok = await goFullscreen()
    if (ok) {
      attempts = 3
      await lockLandscape()
    }
    updateFullLabel(ok)
  }

  function updateFullLabel(ok) {
    if (ios) return
    full.textContent = ok ? 'SAIR DA TELA CHEIA' : 'SEM TELA CHEIA'
  }

  full.addEventListener('pointerdown', async (event) => {
    event.preventDefault()
    touched = true
    if (ios) {
      document.body.classList.add('ios-help')
      setTimeout(() => document.body.classList.remove('ios-help'), 6000)
      return
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      full.textContent = 'TELA CHEIA'
      return
    }
    const ok = await goFullscreen()
    if (ok) await lockLandscape()
    updateFullLabel(ok)
  })

  window.addEventListener('pointerdown', (event) => {
    touched = true
    if (!ios) immersive()
    if (dragId !== null) return
    if (event.target instanceof Element && event.target.closest('#touch')) return
    dragId = event.pointerId
    lastX = event.clientX
    lastY = event.clientY
  })

  window.addEventListener('pointermove', (event) => {
    if (event.pointerId !== dragId) return
    drag.dx += (event.clientX - lastX) * DRAG_SPEED
    drag.dy += (event.clientY - lastY) * DRAG_SPEED
    lastX = event.clientX
    lastY = event.clientY
  })

  const endDrag = (event) => {
    if (event.pointerId === dragId) dragId = null
  }
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)

  const syncOrientation = () => {
    document.body.classList.toggle('portrait', window.matchMedia('(orientation: portrait)').matches)
  }
  syncOrientation()
  window.addEventListener('resize', syncOrientation)
  window.addEventListener('orientationchange', syncOrientation)
  document.addEventListener('fullscreenchange', () => updateFullLabel(!!document.fullscreenElement))

  function consumeDrag() {
    const out = { dx: drag.dx, dy: drag.dy }
    drag.dx = 0
    drag.dy = 0
    return out
  }

  return { supported, state, rate, consumeDrag, engaged: () => touched, ios }
}
