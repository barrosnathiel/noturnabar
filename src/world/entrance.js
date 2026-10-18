import { materials as M } from './materials.js'

const H = 12
const DOOR_W = 1.1
const DOOR_H = 2.2

function doorway(b, axis, fixed, from, to, center) {
  const a0 = center - DOOR_W / 2
  const a1 = center + DOOR_W / 2
  if (axis === 'x') {
    b.box(a0 - from, H, 0.25, (from + a0) / 2, H / 2, fixed, M.wall)
    b.box(to - a1, H, 0.25, (a1 + to) / 2, H / 2, fixed, M.wall)
    b.box(DOOR_W, H - DOOR_H, 0.25, center, DOOR_H + (H - DOOR_H) / 2, fixed, M.wall)
    b.box(DOOR_W - 0.06, DOOR_H, 0.08, center, DOOR_H / 2, fixed, M.door)
  } else {
    b.box(0.25, H, a0 - from, fixed, H / 2, (from + a0) / 2, M.wall)
    b.box(0.25, H, to - a1, fixed, H / 2, (a1 + to) / 2, M.wall)
    b.box(0.25, H - DOOR_H, DOOR_W, fixed, DOOR_H + (H - DOOR_H) / 2, center, M.wall)
    b.box(0.08, DOOR_H, DOOR_W - 0.06, fixed, DOOR_H / 2, center, M.door)
  }
}

export function buildEntrance(b) {
  b.box(0.25, H, 10, -16, H / 2, -7.5, M.wall)
  b.box(0.25, H, 10, -16, H / 2, 7.5, M.wall)
  b.box(0.25, H - 3.2, 5, -16, 3.2 + (H - 3.2) / 2, 0, M.wall)

  doorway(b, 'x', 6, -20, -16, -18)
  doorway(b, 'x', -6, -20, -16, -18)

  b.box(0.2, 3.0, 4.4, -19.9, 1.5, 0, M.door)
  b.box(0.1, 3.0, 0.1, -19.78, 1.5, 0, M.metal, { collide: false })

  for (const z of [-1.9, 1.9]) {
    b.box(0.28, 1.0, 0.28, -16.9, 0.5, z, M.darkMetal)
    b.box(0.08, 0.08, 1.0, -16.9, 0.95, z + (z > 0 ? -0.55 : 0.55), M.metal, { collide: false })
  }

  b.box(2.6, 0.04, 1.6, -18, 0.02, 0, M.rubber, { collide: false })
}
