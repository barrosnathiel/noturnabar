import * as THREE from 'three'
import { materials as M } from './materials.js'

export const HALL = { x0: -20, x1: -16 }
export const ROOM = { x0: -20, x1: 20, z0: -12.5, z1: 12.5, height: 12 }
export const PIT = { x0: 2, x1: 11, z0: -8, z1: 8, depth: 0.4 }

export function buildShell(b) {
  const slab = 0.5

  b.box(22, slab, 25, -9, -slab / 2, 0, M.floor)
  b.box(9, slab, 25, 15.5, -slab / 2, 0, M.floor)
  b.box(9, slab, 4.5, 6.5, -slab / 2, 10.25, M.floor)
  b.box(9, slab, 4.5, 6.5, -slab / 2, -10.25, M.floor)
  b.box(9, slab, 16, 6.5, -PIT.depth - slab / 2, 0, M.pit)

  const wallH = ROOM.height
  b.box(0.3, wallH, 25.6, -20.15, wallH / 2, 0, M.wall)
  b.box(0.3, wallH, 25.6, 20.15, wallH / 2, 0, M.wall)
  b.box(40.6, wallH, 0.3, 0, wallH / 2, 12.65, M.wall)
  b.box(40.6, wallH, 0.3, 0, wallH / 2, -12.65, M.wall)
  b.box(40.6, 0.3, 25.6, 0, wallH + 0.15, 0, M.ceiling)

  for (let x = -18; x <= 18; x += 4) {
    b.box(0.3, 0.8, 25, x, wallH - 0.6, 0, M.darkMetal, { collide: false })
  }
  for (const z of [-7.5, 0, 7.5]) {
    b.box(40, 0.4, 0.3, 0, wallH - 1.2, z, M.darkMetal, { collide: false })
  }

  const duct = new THREE.CylinderGeometry(0.45, 0.45, 34, 12, 1, true)
  duct.rotateZ(Math.PI / 2)
  duct.translate(-1, 9.8, -11.2)
  b.shape(duct, M.metal)

}
