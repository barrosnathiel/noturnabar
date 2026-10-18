import * as THREE from 'three'
import { playerBox, overlaps, TOL } from './collision.js'

export const PLAYER = {
  radius: 0.3,
  height: 1.8,
  eye: 1.7,
  walk: 3.5,
  run: 6.5,
  accel: 14,
  damping: 11,
  gravity: -22,
  jump: 6.2,
  step: 0.45,
  maxFall: 24
}

const EPS = 0.0015

export function createPlayer(world, spawn) {
  const position = new THREE.Vector3().copy(spawn)
  const velocity = new THREE.Vector3()
  const box = new THREE.Box3()
  const probe = new THREE.Box3()
  const point = { x: 0, y: 0, z: 0 }
  const hits = []
  const probeHits = []
  let onGround = false
  let grounded = false

  const refresh = () => playerBox(box, position, PLAYER.radius, PLAYER.height)

  function canStandAt(y) {
    point.x = position.x
    point.y = y + EPS
    point.z = position.z
    playerBox(probe, point, PLAYER.radius - 0.02, PLAYER.height)
    const candidates = world.query(probe, probeHits).slice()
    for (const collider of candidates) {
      if (!overlaps(probe, collider)) continue
      if (collider.max.y > y + PLAYER.step) return false
    }
    return true
  }

  function resolveHorizontal(axis, delta) {
    if (delta === 0) return
    position[axis] += delta
    refresh()

    let target = null
    const climbable = grounded && velocity.y <= 0
    for (const collider of world.query(box, hits)) {
      if (!climbable) break
      if (!overlaps(box, collider)) continue
      const rise = collider.max.y - position.y
      if (rise > TOL && rise <= PLAYER.step && (target === null || collider.max.y > target)) {
        target = collider.max.y
      }
    }
    if (target !== null && canStandAt(target)) {
      position.y = target + EPS
      if (velocity.y < 0) velocity.y = 0
      onGround = true
      refresh()
    }

    const candidates = world.query(box, hits).slice()
    for (const collider of candidates) {
      if (!overlaps(box, collider)) continue
      if (collider.max.y <= position.y + 0.06) continue
      if (collider.min.y >= position.y + PLAYER.height - 0.02) continue
      const penX = Math.min(box.max.x - collider.min.x, collider.max.x - box.min.x)
      const penZ = Math.min(box.max.z - collider.min.z, collider.max.z - box.min.z)
      const out = penX <= penZ ? 'x' : 'z'
      const outMin = box.max[out] - collider.min[out]
      const outMax = collider.max[out] - box.min[out]
      if (outMin <= outMax) {
        position[out] -= outMin + EPS
        if (velocity[out] > 0) velocity[out] = 0
      } else {
        position[out] += outMax + EPS
        if (velocity[out] < 0) velocity[out] = 0
      }
      refresh()
    }
  }

  function resolveVertical(delta) {
    position.y += delta
    refresh()
    const candidates = world.query(box, hits).slice()
    for (const collider of candidates) {
      if (!overlaps(box, collider)) continue
      const lift = collider.max.y - position.y
      if (delta <= 0 && lift > 0 && lift <= Math.abs(delta) + 0.06) {
        position.y = collider.max.y
        velocity.y = 0
        onGround = true
      } else if (delta > 0 && collider.min.y > position.y) {
        position.y = collider.min.y - PLAYER.height - EPS
        velocity.y = 0
      }
      refresh()
    }
  }

  function groundCheck() {
    if (velocity.y > 0.1) return
    point.x = position.x
    point.y = position.y - 0.09
    point.z = position.z
    playerBox(probe, point, PLAYER.radius - 0.02, 0.11)
    const candidates = world.query(probe, hits).slice()
    let best = null
    for (const collider of candidates) {
      if (!overlaps(probe, collider, 0.001)) continue
      if (collider.max.y > position.y + 0.02) continue
      if (best === null || collider.max.y > best) best = collider.max.y
    }
    if (best === null) return
    position.y = best
    velocity.y = 0
    onGround = true
    refresh()
  }

  function update(dt, input, forward, right) {
    const speed = (input.run ? PLAYER.run : PLAYER.walk) * (input.scale ?? 1)
    const wishX = forward.x * input.forward + right.x * input.strafe
    const wishZ = forward.z * input.forward + right.z * input.strafe
    const length = Math.hypot(wishX, wishZ)

    if (length > 0) {
      const blend = Math.min(1, PLAYER.accel * dt)
      velocity.x += ((wishX / length) * speed - velocity.x) * blend
      velocity.z += ((wishZ / length) * speed - velocity.z) * blend
    } else {
      const drop = Math.max(0, 1 - PLAYER.damping * dt)
      velocity.x *= drop
      velocity.z *= drop
    }

    if (input.jump && onGround) {
      velocity.y = PLAYER.jump
      onGround = false
    }

    velocity.y = Math.max(velocity.y + PLAYER.gravity * dt, -PLAYER.maxFall)

    grounded = onGround
    onGround = false
    resolveHorizontal('x', velocity.x * dt)
    resolveHorizontal('z', velocity.z * dt)
    resolveVertical(velocity.y * dt)
    groundCheck()

    if (position.y < -8) {
      position.copy(spawn)
      velocity.set(0, 0, 0)
      refresh()
    }
  }

  refresh()
  return { position, velocity, update, isOnGround: () => onGround }
}
