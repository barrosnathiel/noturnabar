import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { clone as clonarEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js'

const loader = new GLTFLoader()
const cache = new Map()

function ajustar(material) {
  const novo = new THREE.MeshStandardMaterial({
    color: material.color ? material.color.clone() : new THREE.Color(0x8d93a0),
    map: material.map || null,
    roughness: 0.78,
    metalness: material.map ? 0.12 : 0.4,
    dithering: true
  })
  if (novo.map) novo.map.colorSpace = THREE.SRGBColorSpace
  return novo
}

function achatar(cena) {
  const grupos = new Map()
  cena.updateMatrixWorld(true)
  cena.traverse((no) => {
    if (!no.isMesh) return
    const materiais = Array.isArray(no.material) ? no.material : [no.material]
    const material = materiais[0]
    const chave = material ? material.uuid : 'sem'
    const g = no.geometry.clone()
    g.applyMatrix4(no.matrixWorld)
    for (const nome of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(nome)) g.deleteAttribute(nome)
    }
    if (!g.attributes.uv) {
      const vazio = new Float32Array(g.attributes.position.count * 2)
      g.setAttribute('uv', new THREE.BufferAttribute(vazio, 2))
    }
    if (!grupos.has(chave)) grupos.set(chave, { material, pecas: [] })
    grupos.get(chave).pecas.push(g)
  })
  if (grupos.size === 0) return null

  const caixa = new THREE.Box3()
  const partes = []
  for (const { material, pecas } of grupos.values()) {
    const unido = pecas.length === 1 ? pecas[0] : mergeGeometries(pecas, false)
    if (pecas.length > 1) pecas.forEach((p) => p.dispose())
    unido.computeBoundingBox()
    caixa.union(unido.boundingBox)
    partes.push({ geometria: unido, material: ajustar(material || {}) })
  }

  const dx = -(caixa.min.x + caixa.max.x) / 2
  const dy = -caixa.min.y
  const dz = -(caixa.min.z + caixa.max.z) / 2
  for (const parte of partes) {
    parte.geometria.translate(dx, dy, dz)
    parte.geometria.computeBoundingBox()
  }
  return partes
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

const animados = new Map()

export function carregarAnimado(nome) {
  if (animados.has(nome)) return animados.get(nome)
  const promessa = new Promise((resolve) => {
    loader.load(
      `modelos/${nome}.gltf`,
      (gltf) => {
        gltf.scene.traverse((no) => {
          if (!no.isMesh && !no.isSkinnedMesh) return
          no.material = ajustar(no.material)
          no.frustumCulled = false
          no.castShadow = false
          no.receiveShadow = false
        })
        resolve({ cena: gltf.scene, animacoes: gltf.animations || [] })
      },
      undefined,
      () => resolve(null)
    )
  })
  animados.set(nome, promessa)
  return promessa
}

export function instanciarAnimado(modelo, nomeAnimacao) {
  const copia = clonarEsqueleto(modelo.cena)
  const mixer = new THREE.AnimationMixer(copia)
  const trilha =
    modelo.animacoes.find((a) => a.name === nomeAnimacao) || modelo.animacoes[0]
  if (trilha) {
    const acao = mixer.clipAction(trilha)
    acao.timeScale = 0.7 + Math.random() * 0.5
    acao.play()
  }
  return { objeto: copia, mixer }
}

export function espalhar(partes, lugares, materialForcado) {
  const grupo = new THREE.Group()
  const matriz = new THREE.Matrix4()
  const quat = new THREE.Quaternion()
  const escala = new THREE.Vector3()
  const pos = new THREE.Vector3()
  const eixo = new THREE.Vector3(0, 1, 0)

  for (const parte of partes) {
    const malha = new THREE.InstancedMesh(
      parte.geometria,
      materialForcado || parte.material,
      lugares.length
    )
    lugares.forEach((l, i) => {
      pos.set(l.x, l.y || 0, l.z)
      quat.setFromAxisAngle(eixo, l.giro || 0)
      const s = l.escala || 1
      escala.set(s, s, s)
      matriz.compose(pos, quat, escala)
      malha.setMatrixAt(i, matriz)
    })
    malha.instanceMatrix.needsUpdate = true
    malha.castShadow = false
    malha.receiveShadow = false
    malha.frustumCulled = false
    grupo.add(malha)
  }
  return grupo
}
