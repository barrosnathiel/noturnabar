import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const loader = new GLTFLoader()
const cache = new Map()

function achatar(cena) {
  const pecas = []
  cena.updateMatrixWorld(true)
  cena.traverse((no) => {
    if (!no.isMesh) return
    const g = no.geometry.clone()
    g.applyMatrix4(no.matrixWorld)
    for (const nome of Object.keys(g.attributes)) {
      if (nome !== 'position' && nome !== 'normal') g.deleteAttribute(nome)
    }
    pecas.push(g)
  })
  if (pecas.length === 0) return null
  const unido = pecas.length === 1 ? pecas[0] : mergeGeometries(pecas, false)
  if (pecas.length > 1) pecas.forEach((p) => p.dispose())
  unido.computeBoundingBox()
  const caixa = unido.boundingBox
  unido.translate(-(caixa.min.x + caixa.max.x) / 2, -caixa.min.y, -(caixa.min.z + caixa.max.z) / 2)
  unido.computeBoundingBox()
  return unido
}

export function carregar(nome) {
  if (cache.has(nome)) return cache.get(nome)
  const promessa = new Promise((resolve) => {
    loader.load(
      `modelos/${nome}.gltf`,
      (gltf) => resolve(achatar(gltf.scene)),
      undefined,
      () => resolve(null)
    )
  })
  cache.set(nome, promessa)
  return promessa
}

export function espalhar(geometria, material, lugares) {
  const malha = new THREE.InstancedMesh(geometria, material, lugares.length)
  const matriz = new THREE.Matrix4()
  const quat = new THREE.Quaternion()
  const escala = new THREE.Vector3()
  const pos = new THREE.Vector3()
  lugares.forEach((l, i) => {
    pos.set(l.x, l.y || 0, l.z)
    quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), l.giro || 0)
    const s = l.escala || 1
    escala.set(s, s, s)
    matriz.compose(pos, quat, escala)
    malha.setMatrixAt(i, matriz)
  })
  malha.instanceMatrix.needsUpdate = true
  malha.castShadow = false
  malha.receiveShadow = false
  return malha
}
