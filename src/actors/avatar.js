import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const SKINS = {
  et: {
    body: 0x6aa179,
    limb: 0x5b8f6b,
    head: 0x7fb68c,
    detail: 0x14181b,
    build: {
      hip: 0.17,
      shoulder: 0.26,
      chest: 0.24,
      waist: 0.17,
      torso: 0.52,
      legLength: 0.76,
      armLength: 0.62,
      limbThick: 0.058,
      headSize: 0.27,
      stride: 1.2
    }
  },
  porco: {
    body: 0xefa3b8,
    limb: 0xdf90a7,
    head: 0xf4b6c8,
    detail: 0x7d4455,
    build: {
      hip: 0.2,
      shoulder: 0.28,
      chest: 0.3,
      waist: 0.31,
      torso: 0.46,
      legLength: 0.6,
      armLength: 0.46,
      limbThick: 0.085,
      headSize: 0.26,
      stride: 0.8
    }
  }
}

export const SKIN_NAMES = Object.keys(SKINS)

const material = (color, roughness) =>
  new THREE.MeshStandardMaterial({ color, roughness, dithering: true })

const cache = new Map()

function torsoGeometry(b, kind) {
  const pieces = []
  const chest = new THREE.SphereGeometry(b.chest, 14, 12)
  chest.scale(1, kind === 'porco' ? 0.95 : 1.15, kind === 'porco' ? 0.88 : 0.72)
  chest.translate(0, b.legLength + b.torso * 0.62, 0)
  pieces.push(chest)

  const belly = new THREE.SphereGeometry(b.waist, 14, 12)
  belly.scale(1, kind === 'porco' ? 1.05 : 0.95, kind === 'porco' ? 1 : 0.8)
  belly.translate(0, b.legLength + b.torso * 0.2, 0)
  pieces.push(belly)

  const neck = new THREE.CylinderGeometry(b.limbThick * 1.1, b.limbThick * 1.35, 0.1, 10)
  neck.translate(0, b.legLength + b.torso + 0.02, 0)
  pieces.push(neck)

  for (const side of [-1, 1]) {
    const shoulder = new THREE.SphereGeometry(b.limbThick * 1.7, 10, 8)
    shoulder.translate(side * b.shoulder, b.legLength + b.torso * 0.78, 0)
    pieces.push(shoulder)
  }

  if (kind === 'porco') {
    const tail = new THREE.TorusGeometry(0.07, 0.022, 6, 12, Math.PI * 1.5)
    tail.rotateY(Math.PI / 2)
    tail.translate(0, b.legLength + b.torso * 0.34, -b.waist - 0.03)
    pieces.push(tail)
  }

  const merged = mergeGeometries(pieces, false)
  pieces.forEach((piece) => piece.dispose())
  return merged
}

function headGeometry(b, kind) {
  const pieces = []
  if (kind === 'et') {
    const cranium = new THREE.SphereGeometry(b.headSize, 16, 14)
    cranium.scale(1, 1.08, 0.94)
    pieces.push(cranium)
    const jaw = new THREE.SphereGeometry(b.headSize * 0.74, 14, 12)
    jaw.scale(0.88, 0.92, 0.9)
    jaw.translate(0, -b.headSize * 0.52, 0.02)
    pieces.push(jaw)
  } else {
    const skull = new THREE.SphereGeometry(b.headSize, 16, 14)
    skull.scale(1.04, 0.94, 1)
    pieces.push(skull)
    const snout = new THREE.CylinderGeometry(0.1, 0.125, 0.17, 12)
    snout.rotateX(Math.PI / 2)
    snout.translate(0, -0.05, b.headSize * 0.9)
    pieces.push(snout)
    const cheek = new THREE.SphereGeometry(b.headSize * 0.62, 12, 10)
    cheek.scale(1.1, 0.82, 0.9)
    cheek.translate(0, -0.07, b.headSize * 0.38)
    pieces.push(cheek)
    for (const side of [-1, 1]) {
      const ear = new THREE.ConeGeometry(0.085, 0.19, 5)
      ear.scale(1, 1, 0.55)
      ear.rotateZ(side * 0.3)
      ear.rotateX(-0.25)
      ear.translate(side * 0.16, b.headSize * 0.82, -0.03)
      pieces.push(ear)
    }
  }
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((piece) => piece.dispose())
  return merged
}

function faceGeometry(b, kind) {
  const pieces = []
  if (kind === 'et') {
    for (const side of [-1, 1]) {
      const eye = new THREE.SphereGeometry(0.082, 12, 10)
      eye.scale(0.62, 1.45, 0.42)
      eye.rotateZ(side * 0.42)
      eye.translate(side * 0.125, 0.015, b.headSize * 0.84)
      pieces.push(eye)
    }
  } else {
    for (const side of [-1, 1]) {
      const eye = new THREE.SphereGeometry(0.032, 10, 8)
      eye.translate(side * 0.125, 0.075, b.headSize * 0.8)
      pieces.push(eye)
      const nostril = new THREE.CylinderGeometry(0.019, 0.019, 0.04, 7)
      nostril.rotateX(Math.PI / 2)
      nostril.translate(side * 0.042, -0.05, b.headSize * 0.98)
      pieces.push(nostril)
    }
  }
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((piece) => piece.dispose())
  return merged
}

function legGeometry(b, kind) {
  const pieces = []
  const thigh = new THREE.CapsuleGeometry(b.limbThick * 1.15, b.legLength * 0.45, 4, 8)
  thigh.translate(0, -b.legLength * 0.3, 0)
  pieces.push(thigh)
  const shin = new THREE.CapsuleGeometry(b.limbThick * 0.88, b.legLength * 0.4, 4, 8)
  shin.translate(0, -b.legLength * 0.72, 0)
  pieces.push(shin)
  if (kind === 'porco') {
    const hoof = new THREE.CylinderGeometry(b.limbThick * 1.15, b.limbThick * 1.3, 0.09, 8)
    hoof.translate(0, -b.legLength + 0.04, 0)
    pieces.push(hoof)
  } else {
    const foot = new THREE.SphereGeometry(b.limbThick * 1.5, 10, 8)
    foot.scale(0.9, 0.55, 1.9)
    foot.translate(0, -b.legLength + 0.03, 0.05)
    pieces.push(foot)
  }
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((piece) => piece.dispose())
  return merged
}

function armGeometry(b) {
  const pieces = []
  const upper = new THREE.CapsuleGeometry(b.limbThick, b.armLength * 0.45, 4, 8)
  upper.translate(0, -b.armLength * 0.27, 0)
  pieces.push(upper)
  const fore = new THREE.CapsuleGeometry(b.limbThick * 0.82, b.armLength * 0.42, 4, 8)
  fore.translate(0, -b.armLength * 0.68, 0)
  pieces.push(fore)
  const hand = new THREE.SphereGeometry(b.limbThick * 1.45, 10, 8)
  hand.scale(0.8, 1.1, 0.7)
  hand.translate(0, -b.armLength + 0.01, 0)
  pieces.push(hand)
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((piece) => piece.dispose())
  return merged
}

function parts(kind) {
  if (cache.has(kind)) return cache.get(kind)
  const skin = SKINS[kind]
  const b = skin.build
  const built = {
    skin,
    geometries: {
      torso: torsoGeometry(b, kind),
      head: headGeometry(b, kind),
      face: faceGeometry(b, kind),
      leg: legGeometry(b, kind),
      arm: armGeometry(b)
    },
    materials: {
      body: material(skin.body, 0.78),
      limb: material(skin.limb, 0.8),
      head: material(skin.head, 0.72),
      detail: material(skin.detail, 0.35)
    }
  }
  cache.set(kind, built)
  return built
}

export function createAvatar(kind) {
  const { skin, geometries, materials } = parts(kind)
  const b = skin.build
  const root = new THREE.Group()

  const body = new THREE.Group()
  root.add(body)
  body.add(new THREE.Mesh(geometries.torso, materials.body))

  const headPivot = new THREE.Group()
  headPivot.position.y = b.legLength + b.torso + b.headSize * 0.72
  headPivot.add(new THREE.Mesh(geometries.head, materials.head))
  headPivot.add(new THREE.Mesh(geometries.face, materials.detail))
  body.add(headPivot)

  const legs = []
  const arms = []
  for (const side of [-1, 1]) {
    const hip = new THREE.Group()
    hip.position.set(side * b.hip, b.legLength, 0)
    hip.add(new THREE.Mesh(geometries.leg, materials.limb))
    root.add(hip)
    legs.push(hip)

    const shoulder = new THREE.Group()
    shoulder.position.set(side * b.shoulder, b.legLength + b.torso * 0.78, 0)
    shoulder.add(new THREE.Mesh(geometries.arm, materials.limb))
    body.add(shoulder)
    arms.push(shoulder)
  }

  let phase = Math.random() * Math.PI * 2

  function update(dt, speed) {
    const gait = Math.min(speed / 3.5, 1.5)
    phase += dt * (2.6 + gait * 5)
    const swing = Math.sin(phase)
    const legSwing = swing * 0.62 * gait * b.stride
    legs[0].rotation.x = legSwing
    legs[1].rotation.x = -legSwing
    arms[0].rotation.x = -swing * 0.5 * gait
    arms[1].rotation.x = swing * 0.5 * gait
    arms[0].rotation.z = 0.16 + gait * 0.05
    arms[1].rotation.z = -0.16 - gait * 0.05
    const bob = Math.abs(Math.cos(phase)) * 0.045 * gait
    body.position.y = bob
    body.rotation.z = swing * 0.035 * gait
    headPivot.rotation.z = -swing * 0.05 * gait
  }

  update(0, 0)
  return { root, update, kind }
}
