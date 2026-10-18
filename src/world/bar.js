import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { materials as M, bottleColors } from './materials.js'

export function buildBar(b) {
  const x0 = -10
  const x1 = -2
  const w = x1 - x0
  const cx = (x0 + x1) / 2

  b.box(w, 1.02, 0.8, cx, 0.51, 10, M.wood)
  b.box(w + 0.3, 0.08, 1.0, cx, 1.06, 10, M.counter)
  b.box(w, 0.1, 0.12, cx, 0.18, 9.52, M.metal, { collide: false })

  b.box(w, 2.9, 0.25, cx, 1.45, 12.3, M.wood)
  for (const y of [1.25, 1.85, 2.45]) {
    b.box(w - 0.4, 0.06, 0.34, cx, y, 12.05, M.counter, { collide: false })
  }

  const bottle = new THREE.CylinderGeometry(0.045, 0.05, 0.3, 7)
  for (const color of bottleColors) {
    const matrices = []
    for (let i = 0; i < 14; i++) {
      const shelf = i % 3
      const y = [1.25, 1.85, 2.45][shelf] + 0.18
      const x = x0 + 0.5 + ((i * 0.53 + bottleColors.indexOf(color) * 0.17) % (w - 1))
      matrices.push(new THREE.Matrix4().makeTranslation(x, y, 12.02))
    }
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, dithering: true })
    b.instanced(bottle, material, matrices, { receive: false })
  }

  const seat = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 12)
  seat.translate(0, 0.76, 0)
  const post = new THREE.CylinderGeometry(0.045, 0.06, 0.72, 8)
  post.translate(0, 0.36, 0)
  const foot = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12)
  foot.translate(0, 0.02, 0)
  const stool = mergeGeometries([seat, post, foot], false)
  const stools = []
  for (let i = 0; i < 6; i++) {
    const x = x0 + 0.9 + i * 1.25
    stools.push(new THREE.Matrix4().makeTranslation(x, 0, 9.2))
    b.collider([x - 0.2, 0, 9.0], [x + 0.2, 0.8, 9.4])
  }
  b.instanced(stool, M.stool, stools, { receive: true })
}
