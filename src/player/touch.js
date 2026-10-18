const DEAD_ZONE = 0.14
const DRAG_SPEED = 0.0038
const RADIUS = 52

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

  const stick = document.getElementById('stick')
  const knob = stick.querySelector('.knob')
  const hint = document.getElementById('hint')
  const jump = document.getElementById('jump')
  const run = document.getElementById('run')
  const full = document.getElementById('full')

  let movePointer = null
  let originX = 0
  let originY = 0
  let dragPointer = null
  let lastX = 0
  let lastY = 0
  let touched = false
  const ios = isIOS()

  document.body.classList.add('touch')
  if (ios) document.body.classList.add('ios')

  const onControl = (target) => target instanceof Element && target.closest('#jump, #run, #full')

  function placeStick(x, y) {
    originX = x
    originY = y
    stick.style.left = `${x}px`
    stick.style.top = `${y}px`
    stick.classList.add('on')
    knob.style.transform = 'translate(0px, 0px)'
    if (hint) hint.style.display = 'none'
  }

  function moveStick(x, y) {
    let dx = x - originX
    let dy = y - originY
    const length = Math.hypot(dx, dy)
    if (length > RADIUS) {
      dx = (dx / length) * RADIUS
      dy = (dy / length) * RADIUS
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`
    const nx = dx / RADIUS
    const ny = dy / RADIUS
    state.strafe = Math.abs(nx) > DEAD_ZONE ? nx : 0
    state.forward = Math.abs(ny) > DEAD_ZONE ? -ny : 0
  }

  function dropStick() {
    movePointer = null
    state.forward = 0
    state.strafe = 0
    stick.classList.remove('on')
    knob.style.transform = 'translate(0px, 0px)'
  }

  window.addEventListener('pointerdown', (event) => {
    touched = true
    if (!ios) immersive()
    if (onControl(event.target)) return
    const left = event.clientX < window.innerWidth / 2
    if (left && movePointer === null) {
      movePointer = event.pointerId
      placeStick(event.clientX, event.clientY)
      return
    }
    if (!left && dragPointer === null) {
      dragPointer = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
    }
  })

  window.addEventListener('pointermove', (event) => {
    if (event.pointerId === movePointer) {
      moveStick(event.clientX, event.clientY)
      return
    }
    if (event.pointerId !== dragPointer) return
    drag.dx += (event.clientX - lastX) * DRAG_SPEED
    drag.dy += (event.clientY - lastY) * DRAG_SPEED
    lastX = event.clientX
    lastY = event.clientY
  })

  const release = (event) => {
    if (event.pointerId === movePointer) dropStick()
    if (event.pointerId === dragPointer) dragPointer = null
  }
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)

  jump.addEventListener('pointerdown', (event) => {
    event.preventDefault()
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

  function updateFullLabel(ok) {
    if (ios) return
    full.textContent = ok ? 'SAIR DA TELA CHEIA' : 'SEM TELA CHEIA'
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
