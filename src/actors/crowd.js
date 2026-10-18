import * as THREE from 'three'
import { createAvatar, SKIN_NAMES } from './avatar.js'

export function createCrowd(scene) {
  const people = new Map()

  function spawn(id, kind = SKIN_NAMES[Math.floor(Math.random() * SKIN_NAMES.length)]) {
    if (people.has(id)) return people.get(id)
    const avatar = createAvatar(kind)
    const person = {
      avatar,
      target: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      yaw: 0,
      targetYaw: 0,
      speed: 0
    }
    scene.add(avatar.root)
    people.set(id, person)
    return person
  }

  function place(id, x, y, z, yaw) {
    const person = people.get(id) || spawn(id)
    person.previous.copy(person.target)
    person.target.set(x, y, z)
    person.targetYaw = yaw
    const delta = person.target.distanceTo(person.previous)
    person.speed = delta / 0.1
  }

  function remove(id) {
    const person = people.get(id)
    if (!person) return
    scene.remove(person.avatar.root)
    people.delete(id)
  }

  function update(dt) {
    for (const person of people.values()) {
      const root = person.avatar.root
      root.position.lerp(person.target, Math.min(1, dt * 9))
      let diff = person.targetYaw - person.yaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      person.yaw += diff * Math.min(1, dt * 9)
      root.rotation.y = person.yaw + Math.PI
      person.avatar.update(dt, person.speed)
      person.speed *= Math.max(0, 1 - dt * 3)
    }
  }

  return { spawn, place, remove, update, count: () => people.size }
}
