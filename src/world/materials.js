import * as THREE from 'three'

const std = (color, roughness, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, dithering: true })

export const materials = {
  floor: std(0x26262b, 0.92),
  pit: std(0x1d1d22, 0.95),
  wall: std(0x33333a, 0.96),
  ceiling: std(0x1a1a1f, 0.98),
  stage: std(0x121214, 0.88),
  stageEdge: std(0x4a4a52, 0.6, 0.3),
  metal: std(0x72727c, 0.42, 0.85),
  darkMetal: std(0x2b2b31, 0.5, 0.75),
  truss: std(0x3c3c44, 0.45, 0.8),
  speaker: std(0x131315, 0.85),
  grille: std(0x0b0b0d, 0.7, 0.2),
  wood: std(0x3a2a1d, 0.85),
  counter: std(0x6d4c31, 0.6),
  stool: std(0x1b1b20, 0.8),
  door: std(0x2c2c33, 0.8),
  rubber: std(0x101013, 0.95),
  lampBody: std(0x1f1f24, 0.6, 0.4)
}

export const bottleColors = [0x1f3a25, 0x43200f, 0x16263a, 0x3a3014, 0x33131d]
