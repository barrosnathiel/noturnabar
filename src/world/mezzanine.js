import * as THREE from 'three'
import { materials as M } from './materials.js'

export const DECK_Y = 4.0
const SLAB = 0.3
const RAIL_H = 1.1

function railAlongX(b, x0, x1, z) {
  const w = x1 - x0
  const cx = (x0 + x1) / 2
  b.box(w, 0.08, 0.1, cx, DECK_Y + RAIL_H, z, M.metal, { collide: false })
  b.box(w, 0.06, 0.08, cx, DECK_Y + 0.55, z, M.metal, { collide: false })
  b.collider([x0, DECK_Y, z - 0.09], [x1, DECK_Y + RAIL_H, z + 0.09])
  for (let x = x0; x <= x1 + 0.01; x += 1.4) {
    b.box(0.07, RAIL_H, 0.07, x, DECK_Y + RAIL_H / 2, z, M.metal, { collide: false })
  }
}

function railAlongZ(b, z0, z1, x) {
  const d = z1 - z0
  const cz = (z0 + z1) / 2
  b.box(0.1, 0.08, d, x, DECK_Y + RAIL_H, cz, M.metal, { collide: false })
  b.box(0.08, 0.06, d, x, DECK_Y + 0.55, cz, M.metal, { collide: false })
  b.collider([x - 0.09, DECK_Y, z0], [x + 0.09, DECK_Y + RAIL_H, z1])
  for (let z = z0; z <= z1 + 0.01; z += 1.4) {
    b.box(0.07, RAIL_H, 0.07, x, DECK_Y + RAIL_H / 2, z, M.metal, { collide: false })
  }
}

function stairRun(b, zBase, direction) {
  const steps = 20
  const rise = DECK_Y / steps
  const run = 0.3
  for (let i = 0; i < steps; i++) {
    const top = (i + 1) * rise
    const za = zBase + direction * i * run
    const zb = zBase + direction * (i + 1) * run
    const cz = (za + zb) / 2
    b.box(2.5, top, run, -12.75, top / 2, cz, M.pit)
  }
  const zTop = zBase + direction * steps * run
  b.box(2.5, DECK_Y, 1.6, -12.75, DECK_Y / 2, zTop + direction * 0.8, M.pit)
  const cz = (zBase + zTop) / 2
  const length = Math.abs(zTop - zBase)
  b.box(0.1, 0.08, length, -11.5, DECK_Y / 2 + RAIL_H * 0.72, cz, M.metal, { collide: false, rotY: 0 })
  b.collider([-11.6, 0, Math.min(zBase, zTop)], [-11.4, DECK_Y + RAIL_H, Math.max(zBase, zTop)])
  for (let i = 0; i <= steps; i += 4) {
    const z = zBase + direction * i * run
    const h = RAIL_H + i * rise
    b.box(0.07, h, 0.07, -11.5, h / 2, z, M.metal, { collide: false })
  }
}

export function buildMezzanine(b) {
  b.box(2, SLAB, 25, -15, DECK_Y - SLAB / 2, 0, M.pit)
  b.box(22, SLAB, 4, -3, DECK_Y - SLAB / 2, 10.5, M.pit)
  b.box(22, SLAB, 4, -3, DECK_Y - SLAB / 2, -10.5, M.pit)

  railAlongX(b, -14, 8, 8.5)
  railAlongX(b, -14, 8, -8.5)
  railAlongZ(b, 8.5, 12.5, 8)
  railAlongZ(b, -12.5, -8.5, 8)
  railAlongZ(b, -5.5, 5.5, -14)

  stairRun(b, 1, 1)
  stairRun(b, -1, -1)

  const pillar = new THREE.BoxGeometry(0.22, DECK_Y - SLAB, 0.22)
  const matrices = []
  for (const z of [9, -9]) {
    for (let x = -12; x <= 7; x += 4.75) {
      matrices.push(new THREE.Matrix4().makeTranslation(x, (DECK_Y - SLAB) / 2, z))
    }
  }
  b.instanced(pillar, M.metal, matrices, { cast: false, receive: true })
  for (const z of [9, -9]) {
    for (let x = -12; x <= 7; x += 4.75) {
      b.collider([x - 0.13, 0, z - 0.13], [x + 0.13, DECK_Y - SLAB, z + 0.13])
    }
  }
}
