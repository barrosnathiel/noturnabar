import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as clonarEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js'

export const PERSONAGENS = [
  { id: 'Alien', nome: 'alien' },
  { id: 'Cactoro', nome: 'cactoro' },
  { id: 'Yeti', nome: 'yeti' },
  { id: 'Ninja', nome: 'ninja' },
  { id: 'Cat', nome: 'gato' },
  { id: 'Dog', nome: 'cachorro' },
  { id: 'Wizard', nome: 'mago' },
  { id: 'Mushnub', nome: 'cogumelo' }
]

export const IDS = PERSONAGENS.map((p) => p.id)
const ALTURA = 1.75
const loader = new GLTFLoader()
const cache = new Map()

export function carregarPersonagem(id) {
  if (cache.has(id)) return cache.get(id)
  const promessa = new Promise((resolve) => {
    loader.load(
      `modelos/personagens/${id}.gltf`,
      (gltf) => {
        const caixa = new THREE.Box3().setFromObject(gltf.scene)
        const alto = caixa.max.y - caixa.min.y || 1
        resolve({ cena: gltf.scene, animacoes: gltf.animations || [], escala: ALTURA / alto })
      },
      undefined,
      () => resolve(null)
    )
  })
  cache.set(id, promessa)
  return promessa
}

export function criarPersonagem(modelo) {
  const root = new THREE.Group()
  const corpo = clonarEsqueleto(modelo.cena)
  corpo.scale.setScalar(modelo.escala)
  corpo.traverse((no) => {
    if (!no.isMesh && !no.isSkinnedMesh) return
    no.frustumCulled = false
    no.castShadow = false
    no.receiveShadow = false
    if (no.material) {
      no.material = no.material.clone()
      no.material.dithering = true
    }
  })
  root.add(corpo)

  const mixer = new THREE.AnimationMixer(corpo)
  const acoes = {}
  for (const trilha of modelo.animacoes) {
    acoes[trilha.name] = mixer.clipAction(trilha)
  }
  const pegar = (...nomes) => {
    for (const nome of nomes) if (acoes[nome]) return acoes[nome]
    return null
  }

  const parado = pegar('Idle', 'Idle_Loop')
  const andando = pegar('Walk', 'Walk_Loop')
  const correndo = pegar('Run', 'Run_Loop') || andando
  const dancando = pegar('Dance', 'Dance_Loop')
  let atual = null

  function trocar(acao, escalaTempo = 1) {
    if (!acao) return
    acao.timeScale = escalaTempo
    if (acao === atual) return
    acao.reset().fadeIn(0.25).play()
    if (atual) atual.fadeOut(0.25)
    atual = acao
  }

  trocar(parado)

  function update(dt, speed, danca) {
    if (danca && danca !== 'nada' && speed < 0.6) {
      trocar(dancando || parado, 1)
    } else if (speed > 3.9 && correndo) {
      trocar(correndo, Math.min(1.6, speed / 5))
    } else if (speed > 0.6) {
      trocar(andando, Math.min(1.8, 0.7 + speed / 3.4))
    } else {
      trocar(parado, 1)
    }
    mixer.update(dt)
  }

  return { root, update, kind: modelo.id }
}
