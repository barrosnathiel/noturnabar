import * as THREE from 'three'

const MAX_PITCH = THREE.MathUtils.degToRad(85)

export function createControls(camera, canvas, touch) {
  const input = { forward: 0, strafe: 0, run: false, jump: false, scale: 1 }
  const keys = new Set()
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  let yaw = -Math.PI / 2
  let pitch = 0
  let locked = false
  const listeners = []
  const failures = []

  camera.rotation.order = 'YXZ'

  const onMouseMove = (event) => {
    if (!locked) return
    yaw -= event.movementX * 0.0022
    pitch -= event.movementY * 0.0022
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch))
  }

  const onKey = (event, down) => {
    if (down) keys.add(event.code)
    else keys.delete(event.code)
    if (event.code === 'Space' && down) event.preventDefault()
  }

  function lock(raw) {
    const request = raw
      ? canvas.requestPointerLock({ unadjustedMovement: true })
      : canvas.requestPointerLock()
    Promise.resolve(request).catch(() => {
      if (raw) lock(false)
      else failures.forEach((fn) => fn())
    })
  }

  canvas.addEventListener('click', () => {
    if (!touch.supported && !locked) lock(true)
  })
  document.addEventListener('pointerlockerror', () => {
    failures.forEach((fn) => fn())
  })
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas
    listeners.forEach((fn) => fn(locked))
  })
  document.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', (e) => onKey(e, true))
  window.addEventListener('keyup', (e) => onKey(e, false))
  window.addEventListener('blur', () => keys.clear())

  function sample() {
    if (touch.supported) {
      const move = touch.consumeLook()
      yaw -= move.dx
      pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch - move.dy))
      input.forward = touch.state.forward
      input.strafe = touch.state.strafe
      input.run = touch.state.run
      input.jump = touch.state.jump
      input.scale = Math.min(1, Math.hypot(input.forward, input.strafe))
      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
      right.set(Math.cos(yaw), 0, -Math.sin(yaw))
      return input
    }
    input.scale = 1
    input.forward = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0)
    input.strafe = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0)
    input.run = keys.has('ShiftLeft') || keys.has('ShiftRight')
    input.jump = keys.has('Space')
    if (!locked) {
      input.forward = 0
      input.strafe = 0
      input.jump = false
    }
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
    right.set(Math.cos(yaw), 0, -Math.sin(yaw))
    return input
  }

  function apply() {
    camera.rotation.y = yaw
    camera.rotation.x = pitch
  }

  function setAngles(nextYaw, nextPitch = pitch) {
    yaw = nextYaw
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, nextPitch))
  }

  return {
    sample,
    apply,
    setAngles,
    forward,
    right,
    isLocked: () => locked || (touch.supported && touch.engaged()),
    onLockChange: (fn) => listeners.push(fn),
    onLockError: (fn) => failures.push(fn)
  }
}
