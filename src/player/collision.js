import * as THREE from 'three'

const CELL = 4
export const TOL = 0.004

export function overlaps(a, b, tol = TOL) {
  return (
    a.min.x < b.max.x - tol && a.max.x > b.min.x + tol &&
    a.min.y < b.max.y - tol && a.max.y > b.min.y + tol &&
    a.min.z < b.max.z - tol && a.max.z > b.min.z + tol
  )
}

export function createCollisionWorld(colliders) {
  const cells = new Map()
  const key = (ix, iz) => `${ix}:${iz}`

  colliders.forEach((box, index) => {
    const ix0 = Math.floor(box.min.x / CELL)
    const ix1 = Math.floor(box.max.x / CELL)
    const iz0 = Math.floor(box.min.z / CELL)
    const iz1 = Math.floor(box.max.z / CELL)
    for (let ix = ix0; ix <= ix1; ix++) {
      for (let iz = iz0; iz <= iz1; iz++) {
        const k = key(ix, iz)
        let bucket = cells.get(k)
        if (!bucket) cells.set(k, (bucket = []))
        bucket.push(index)
      }
    }
  })

  const seen = new Int32Array(colliders.length)
  let stamp = 0

  function query(box, out) {
    out.length = 0
    stamp++
    const ix0 = Math.floor(box.min.x / CELL)
    const ix1 = Math.floor(box.max.x / CELL)
    const iz0 = Math.floor(box.min.z / CELL)
    const iz1 = Math.floor(box.max.z / CELL)
    for (let ix = ix0; ix <= ix1; ix++) {
      for (let iz = iz0; iz <= iz1; iz++) {
        const bucket = cells.get(key(ix, iz))
        if (!bucket) continue
        for (const index of bucket) {
          if (seen[index] === stamp) continue
          seen[index] = stamp
          out.push(colliders[index])
        }
      }
    }
    return out
  }

  function anyOverlap(box, ignore, tol = TOL) {
    const candidates = query(box, scratch)
    for (const candidate of candidates) {
      if (candidate === ignore) continue
      if (overlaps(box, candidate, tol)) return true
    }
    return false
  }

  const scratch = []
  return { query, anyOverlap, count: colliders.length }
}

export function playerBox(target, position, radius, height) {
  return target.set(
    new THREE.Vector3(position.x - radius, position.y, position.z - radius),
    new THREE.Vector3(position.x + radius, position.y + height, position.z + radius)
  )
}
