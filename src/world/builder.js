import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function createBuilder() {
  const groups = new Map()
  const colliders = []
  const loose = []

  const keyFor = (material, cast, receive) => `${material.uuid}|${cast ? 1 : 0}|${receive ? 1 : 0}`

  function push(geometry, material, cast, receive) {
    const key = keyFor(material, cast, receive)
    let group = groups.get(key)
    if (!group) {
      group = { material, cast, receive, geometries: [] }
      groups.set(key, group)
    }
    group.geometries.push(geometry)
  }

  function box(w, h, d, cx, cy, cz, material, options = {}) {
    const { collide = true, cast = false, receive = true, rotY = 0 } = options
    const geometry = new THREE.BoxGeometry(w, h, d)
    if (rotY) geometry.rotateY(rotY)
    geometry.translate(cx, cy, cz)
    push(geometry, material, cast, receive)
    if (collide) {
      const bounds = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position)
      colliders.push(bounds)
    }
    return geometry
  }

  function shape(geometry, material, options = {}) {
    const { collide = false, cast = false, receive = true } = options
    push(geometry, material, cast, receive)
    if (collide) colliders.push(new THREE.Box3().setFromBufferAttribute(geometry.attributes.position))
    return geometry
  }

  function instanced(geometry, material, matrices, options = {}) {
    const { cast = false, receive = true } = options
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    loose.push(mesh)
    return mesh
  }

  function object(node) {
    loose.push(node)
    return node
  }

  function collider(min, max) {
    colliders.push(new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)))
  }

  function commit(scene) {
    for (const group of groups.values()) {
      const merged = mergeGeometries(group.geometries, false)
      const mesh = new THREE.Mesh(merged, group.material)
      mesh.castShadow = group.cast
      mesh.receiveShadow = group.receive
      scene.add(mesh)
      group.geometries.forEach((geometry) => geometry.dispose())
    }
    loose.forEach((node) => scene.add(node))
    groups.clear()
    loose.length = 0
    return colliders
  }

  return { box, shape, instanced, object, collider, commit, colliders }
}
