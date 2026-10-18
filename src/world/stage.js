import * as THREE from 'three'
import { materials as M } from './materials.js'

export const STAGE = { x0: 11, x1: 20, z0: -10, z1: 10, top: 1.2 }
export const TRUSS_Y = 9

export function trussAlongZ(b, x, z0, z1, y) {
  const s = 0.5
  const length = z1 - z0
  const cz = (z0 + z1) / 2
  for (const dx of [-s / 2, s / 2]) {
    for (const dy of [-s / 2, s / 2]) {
      b.box(0.1, 0.1, length, x + dx, y + dy, cz, M.truss, { collide: false })
    }
  }
  const steps = Math.floor(length / 1.2)
  for (let i = 0; i <= steps; i++) {
    const z = z0 + (i * length) / steps
    b.box(s, 0.07, 0.07, x, y - s / 2, z, M.truss, { collide: false })
    b.box(s, 0.07, 0.07, x, y + s / 2, z, M.truss, { collide: false })
    b.box(0.07, s, 0.07, x - s / 2, y, z, M.truss, { collide: false })
    b.box(0.07, s, 0.07, x + s / 2, y, z, M.truss, { collide: false })
  }
}

export function buildStage(b) {
  const w = STAGE.x1 - STAGE.x0
  const d = STAGE.z1 - STAGE.z0
  const cx = (STAGE.x0 + STAGE.x1) / 2
  const cz = (STAGE.z0 + STAGE.z1) / 2

  b.box(w, STAGE.top, d, cx, STAGE.top / 2, cz, M.stage)
  b.box(0.06, 0.1, d, STAGE.x0 - 0.03, STAGE.top - 0.05, cz, M.stageEdge, { collide: false })

  const rise = 0.2
  const run = 0.28
  for (let i = 0; i < 6; i++) {
    const top = (i + 1) * rise
    const x0 = STAGE.x0 + i * run
    b.box(13 - x0, top, 1.5, (x0 + 13) / 2, top / 2, -10.75, M.stage)
  }
  b.box(1.7, STAGE.top, 1.5, 13.65, STAGE.top / 2, -10.75, M.stage)
  b.box(0.08, 1.0, 3.2, 14.46, STAGE.top + 0.5, -11.46, M.metal, { collide: false })
  b.box(1.7, 1.0, 0.08, 13.65, STAGE.top + 0.5, -11.46, M.metal, { collide: false })

  for (const z of [-8.6, 8.6]) {
    b.box(1.6, 1.1, 1.4, 12.2, STAGE.top + 0.55, z, M.speaker)
    b.box(1.5, 0.9, 0.06, 12.2, STAGE.top + 0.55, z + (z > 0 ? -0.72 : 0.72), M.grille, { collide: false })
    b.box(1.6, 0.9, 1.4, 12.2, STAGE.top + 1.55, z, M.speaker)
    b.box(1.5, 0.7, 0.06, 12.2, STAGE.top + 1.55, z + (z > 0 ? -0.72 : 0.72), M.grille, { collide: false })
  }

  for (const z of [-4.5, 0, 4.5]) {
    const monitor = new THREE.BoxGeometry(0.8, 0.45, 0.6)
    monitor.rotateZ(-0.35)
    monitor.translate(11.8, STAGE.top + 0.22, z)
    b.shape(monitor, M.speaker, { collide: true })
  }

  b.box(0.2, 10.2, d, 19.8, STAGE.top + 5.1, cz, M.rubber)

  trussAlongZ(b, 12.5, -10.5, 10.5, TRUSS_Y)
  trussAlongZ(b, 17, -10.5, 10.5, TRUSS_Y)
  for (const x of [12.5, 17]) {
    for (const z of [-9, -3, 3, 9]) {
      b.box(0.06, 11.4 - TRUSS_Y, 0.06, x, (TRUSS_Y + 11.4) / 2, z, M.darkMetal, { collide: false })
    }
  }
}
