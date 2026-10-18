import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const SKINS = {
  et: {
    body: 0x6aa179,
    dark: 0x4a7557,
    head: 0x7fb68c,
    detail: 0x14181b,
    build: { torso: 0.46, shoulder: 0.34, limb: 0.085, legLength: 0.78, headSize: 0.3, stride: 1.25 }
  },
  porco: {
    body: 0xefa3b8,
    dark: 0xd98ba0,
    head: 0xf4b6c8,
    detail: 0x8e4f63,
    build: { torso: 0.6, shoulder: 0.44, limb: 0.13, legLength: 0.66, headSize: 0.28, stride: 0.85 }
  }
}

export const SKIN_NAMES = Object.keys(SKINS)

const material = (color, rough = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, dithering: true })

const cache = new Map()

function parts(kind) {
  if (cache.has(kind)) return cache.get(kind)
  const skin = SKINS[kind]
  const b = skin.build

  const torso = new THREE.CapsuleGeometry(b.shoulder * 0.62, b.torso, 4, 10)
  torso.translate(0, b.legLength + b.torso / 2 + 0.1, 0)

  const headPieces = []
  if (kind === 'et') {
    const skull = new THREE.SphereGeometry(b.headSize, 14, 12)
    skull.scale(1, 1.12, 0.92)
    headPieces.push(skull)
    const neck = new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8)
    neck.translate(0, -b.headSize - 0.02, 0)
    headPieces.push(neck)
  } else {
    const skull = new THREE.SphereGeometry(b.headSize, 14, 12)
    skull.scale(1.05, 0.95, 1)
    headPieces.push(skull)
    const snout = new THREE.CylinderGeometry(0.11, 0.13, 0.16, 10)
    snout.rotateX(Math.PI / 2)
    snout.translate(0, -0.04, b.headSize * 0.92)
    headPieces.push(snout)
    for (const side of [-1, 1]) {
      const ear = new THREE.ConeGeometry(0.09, 0.17, 4)
      ear.translate(side * 0.17, b.headSize * 0.78, -0.02)
      headPieces.push(ear)
    }
    const neck = new THREE.CylinderGeometry(0.1, 0.12, 0.12, 8)
    neck.translate(0, -b.headSize - 0.01, 0)
    headPieces.push(neck)
  }
  const head = mergeGeometries(headPieces, false)
  headPieces.forEach((piece) => piece.dispose())

  const arm = new THREE.CapsuleGeometry(b.limb * 0.78, 0.46, 3, 7)
  arm.translate(0, -0.29, 0)
  const leg = new THREE.CapsuleGeometry(b.limb, b.legLength - 0.16, 3, 7)
  leg.translate(0, -(b.legLength - 0.06) / 2, 0)

  const built = {
    skin,
    geometries: { torso, head, arm, leg },
    materials: {
      body: material(skin.body),
      dark: material(skin.dark),
      head: material(skin.head, 0.72),
      detail: material(skin.detail, 0.4)
    }
  }
  cache.set(kind, built)
  return built
}

export function createAvatar(kind) {
  const { skin, geometries, materials } = parts(kind)
  const b = skin.build
  const root = new THREE.Group()

  const torso = new THREE.Mesh(geometries.torso, materials.body)
  torso.castShadow = false
  root.add(torso)

  const headPivot = new THREE.Group()
  headPivot.position.y = b.legLength + b.torso + b.headSize * 0.78
  const head = new THREE.Mesh(geometries.head, materials.head)
  headPivot.add(head)
  root.add(headPivot)

  if (kind === 'et') {
    const eye = new THREE.SphereGeometry(0.075, 10, 8)
    eye.scale(1, 1.5, 0.55)
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(eye, materials.detail)
      mesh.position.set(side * 0.13, 0.02, b.headSize * 0.84)
      mesh.rotation.z = side * 0.4
      headPivot.add(mesh)
    }
  } else {
    const eye = new THREE.SphereGeometry(0.035, 8, 6)
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(eye, materials.detail)
      mesh.position.set(side * 0.13, 0.07, b.headSize * 0.82)
      headPivot.add(mesh)
    }
  }

  const limbs = { arms: [], legs: [] }
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * b.shoulder, b.legLength + b.torso - 0.04, 0)
    shoulder.add(new THREE.Mesh(geometries.arm, materials.dark))
    root.add(shoulder)
    limbs.arms.push(shoulder)

    const hip = new THREE.Group()
    hip.position.set(side * b.shoulder * 0.52, b.legLength + 0.04, 0)
    hip.add(new THREE.Mesh(geometries.leg, materials.dark))
    root.add(hip)
    limbs.legs.push(hip)
  }

  let phase = Math.random() * Math.PI * 2

  function update(dt, speed) {
    const moving = Math.min(speed / 3.5, 1.6)
    phase += dt * (3.2 + moving * 4.4)
    const swing = Math.sin(phase) * 0.55 * moving * b.stride
    const counter = Math.sin(phase + Math.PI) * 0.42 * moving
    limbs.legs[0].rotation.x = swing
    limbs.legs[1].rotation.x = -swing
    limbs.arms[0].rotation.x = counter * -1
    limbs.arms[1].rotation.x = counter
    torso.position.y = Math.abs(Math.sin(phase)) * 0.035 * moving
    headPivot.position.y =
      b.legLength + b.torso + b.headSize * 0.78 + Math.abs(Math.sin(phase)) * 0.03 * moving
    root.rotation.z = Math.sin(phase) * 0.02 * moving
  }

  return { root, update, kind }
}
