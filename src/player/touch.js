const DEAD_ZONE = 0.14
const LOOK_SPEED = 0.0038

export function createTouchInput() {
  const supported = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches
  const state = { forward: 0, strafe: 0, run: false, jump: false }
  const look = { dx: 0, dy: 0 }
  if (!supported) {
    return { supported, state, consumeLook: () => look, engaged: () => false }
  }

  const stick = document.getElementById('stick')
  const knob = document.getElementById('knob')
  const jump = document.getElementById('jump')
  const run = document.getElementById('run')
  const full = document.getElementById('full')

  const radius = 52
  let stickId = null
  let lookId = null
  let lastX = 0
  let lastY = 0
  let touched = false

  document.body.classList.add('touch')

  const setKnob = (x, y) => {
    knob.style.transform = `translate(${x}px, ${y}px)`
  }

  stick.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    try { stick.setPointerCapture(event.pointerId) } catch (error) { void error }
    stickId = event.pointerId
    touched = true
    moveStick(event)
  })

  const moveStick = (event) => {
    const rect = stick.getBoundingClientRect()
    let dx = event.clientX - (rect.left + rect.width / 2)
    let dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy)
    if (length > radius) {
      dx = (dx / length) * radius
      dy = (dy / length) * radius
    }
    setKnob(dx, dy)
    const nx = dx / radius
    const ny = dy / radius
    state.strafe = Math.abs(nx) > DEAD_ZONE ? nx : 0
    state.forward = Math.abs(ny) > DEAD_ZONE ? -ny : 0
  }

  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId !== stickId) return
    event.preventDefault()
    moveStick(event)
  })

  const releaseStick = (event) => {
    if (event.pointerId !== stickId) return
    stickId = null
    state.forward = 0
    state.strafe = 0
    setKnob(0, 0)
  }
  stick.addEventListener('pointerup', releaseStick)
  stick.addEventListener('pointercancel', releaseStick)

  const hold = (element, onDown, onUp) => {
    element.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      try { element.setPointerCapture(event.pointerId) } catch (error) { void error }
      touched = true
      onDown()
    })
    const release = () => onUp && onUp()
    element.addEventListener('pointerup', release)
    element.addEventListener('pointercancel', release)
  }

  hold(jump, () => {
    state.jump = true
    jump.classList.add('on')
  }, () => {
    state.jump = false
    jump.classList.remove('on')
  })

  run.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    touched = true
    state.run = !state.run
    run.classList.toggle('on', state.run)
  })

  full.addEventListener('pointerdown', async (event) => {
    event.preventDefault()
    touched = true
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {})
      }
    } catch (error) {
      full.textContent = 'SEM TELA CHEIA'
    }
  })

  window.addEventListener('pointerdown', (event) => {
    if (lookId !== null) return
    if (event.target instanceof Element && event.target.closest('#touch')) return
    lookId = event.pointerId
    lastX = event.clientX
    lastY = event.clientY
    touched = true
  })

  window.addEventListener('pointermove', (event) => {
    if (event.pointerId !== lookId) return
    look.dx += (event.clientX - lastX) * LOOK_SPEED
    look.dy += (event.clientY - lastY) * LOOK_SPEED
    lastX = event.clientX
    lastY = event.clientY
  })

  const endLook = (event) => {
    if (event.pointerId === lookId) lookId = null
  }
  window.addEventListener('pointerup', endLook)
  window.addEventListener('pointercancel', endLook)

  const syncOrientation = () => {
    const portrait = window.matchMedia('(orientation: portrait)').matches
    document.body.classList.toggle('portrait', portrait)
  }
  syncOrientation()
  window.addEventListener('resize', syncOrientation)
  window.addEventListener('orientationchange', syncOrientation)

  function consumeLook() {
    const out = { dx: look.dx, dy: look.dy }
    look.dx = 0
    look.dy = 0
    return out
  }

  return { supported, state, consumeLook, engaged: () => touched }
}
