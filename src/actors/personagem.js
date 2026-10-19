import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as clonarEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js'

export const PERSONAGENS = [
  { id: 'Alien', nome: 'alien' },
  { id: 'Cactoro', nome: 'cacto' },
  { id: 'Yeti', nome: 'yeti' },
  { id: 'Ninja', nome: 'ninja' },
  { id: 'Frog', nome: 'sapo' },
  { id: 'Dino', nome: 'dino' },
  { id: 'Orc', nome: 'orc' },
  { id: 'Bunny', nome: 'coelho' }
]

export const IDS = PERSONAGENS.map((p) => p.id)
const ALTURA = 1.75
const OSSOS = [
  'Hips', 'Torso', 'Abdomen', 'Head', 'Neck',
  'UpperArmL', 'LowerArmL', 'UpperArmR', 'LowerArmR',
  'UpperLegL', 'LowerLegL', 'UpperLegR', 'LowerLegR'
]

const semPonto = (nome) => nome.replace(/\./g, '')

const loader = new GLTFLoader()
const cache = new Map()

export function carregarPersonagem(id) {
  if (cache.has(id)) return cache.get(id)
  const promessa = new Promise((resolve) => {
    loader.load(
      `modelos/personagens/${id}.glb`,
      (gltf) => {
        const caixa = new THREE.Box3().setFromObject(gltf.scene)
        const alto = caixa.max.y - caixa.min.y || 1
        resolve({ id, cena: gltf.scene, animacoes: gltf.animations || [], escala: ALTURA / alto })
      },
      undefined,
      () => resolve(null)
    )
  })
  cache.set(id, promessa)
  return promessa
}

function harmonicos(t, estilo) {
  if (estilo === 'maos') {
    const w = 2.9
    const alto = -2.5 + Math.sin(w * t) * 0.4 + Math.sin(w * 3 * t) * 0.1
    return {
      bracoE: alto, bracoD: alto + Math.sin(w * t + 0.9) * 0.12,
      abreE: -0.5 - Math.sin(w * t) * 0.16, abreD: 0.5 + Math.sin(w * t) * 0.16,
      anteE: -0.5 + Math.sin(w * t) * 0.3, anteD: -0.5 + Math.sin(w * t + 0.7) * 0.3,
      pernaE: Math.sin(w * t) * 0.08, pernaD: Math.sin(w * t) * 0.08,
      joelhoE: 0.16, joelhoD: 0.16,
      incl: Math.sin(w * 0.5 * t) * 0.08, sobe: Math.max(0, Math.sin(w * t)) * 0.09,
      cabeca: Math.sin(w * t) * 0.14
    }
  }
  if (estilo === 'jamal') {
    const tempos = [0.26, 0.26, 0.16, 0.16, 0.16]
    const ciclo = 3.5
    const voltas = Math.floor(t / ciclo)
    const fase = (t % ciclo) / ciclo
    let inicio = 0
    let i = 0
    while (i < tempos.length - 1 && fase >= inicio + tempos[i]) {
      inicio += tempos[i]
      i++
    }
    const dentro = (fase - inicio) / tempos[i]
    const lado = (voltas * tempos.length + i) % 2 === 0 ? 1 : -1
    const corte = Math.min(1, dentro / 0.4)
    const suave = corte * corte * (3 - 2 * corte)
    const marca = -lado + lado * 2 * suave
    const dir = Math.max(0, marca)
    const esq = Math.max(0, -marca)
    return {
      bracoD: 0.12 + dir * 1.32, bracoE: 0.12 + esq * 1.32,
      abreD: 0.16 + dir * 0.3, abreE: -0.16 - esq * 0.3,
      anteD: 0.35 + dir * 1.15, anteE: 0.35 + esq * 1.15,
      pernaD: -dir * 0.62 + esq * 0.16,
      pernaE: -esq * 0.62 + dir * 0.16,
      joelhoD: dir * 0.55,
      joelhoE: esq * 0.55,
      incl: marca * 0.16, sobe: Math.abs(marca) * 0.05,
      cabeca: marca * 0.12
    }
  }
  if (estilo === 'solto') {
    const w = 3.4
    return {
      bracoE: Math.sin(w * t) * 1.1 + Math.sin(w * 1.7 * t + 0.8) * 0.42,
      bracoD: Math.sin(w * t + 2.3) * 1.1 + Math.sin(w * 1.7 * t + 2.9) * 0.42,
      abreE: -0.4 - Math.sin(w * 1.3 * t) * 0.3, abreD: 0.4 + Math.sin(w * 1.3 * t + 1.7) * 0.3,
      anteE: -0.8 - Math.sin(w * 2.1 * t) * 0.5, anteD: -0.8 - Math.sin(w * 2.1 * t + 1.9) * 0.5,
      pernaE: Math.sin(w * t + 0.5) * 0.26, pernaD: Math.sin(w * t + 2.8) * 0.26,
      joelhoE: 0.3 + Math.max(0, Math.sin(w * t + 0.5)) * 0.5,
      joelhoD: 0.3 + Math.max(0, Math.sin(w * t + 2.8)) * 0.5,
      incl: Math.sin(w * 0.7 * t) * 0.2, sobe: Math.abs(Math.sin(w * t)) * 0.08,
      cabeca: Math.sin(w * 1.3 * t) * 0.2
    }
  }
  const w = 2.2
  return {
    bracoE: Math.sin(w * t) * 0.62 + Math.sin(w * 2 * t + 0.6) * 0.16,
    bracoD: Math.sin(w * t + 0.42) * 0.62 + Math.sin(w * 2 * t + 1.9) * 0.16,
    abreE: -0.32 - Math.sin(w * t) * 0.14, abreD: 0.32 + Math.sin(w * t + 0.42) * 0.14,
    anteE: -0.45 - Math.sin(w * t) * 0.24, anteD: -0.45 - Math.sin(w * t + 0.5) * 0.24,
    pernaE: Math.sin(w * t) * 0.14, pernaD: -Math.sin(w * t) * 0.11,
    joelhoE: 0.18 + Math.max(0, Math.sin(w * t)) * 0.3,
    joelhoD: 0.18 + Math.max(0, -Math.sin(w * t)) * 0.3,
    incl: Math.sin(w * t) * 0.12, sobe: Math.abs(Math.cos(w * t)) * 0.05,
    cabeca: Math.sin(w * t + 0.3) * 0.1
  }
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
  })
  root.add(corpo)

  const ossos = {}
  const base = {}
  corpo.traverse((no) => {
    if (!no.isBone) return
    const chave = semPonto(no.name)
    if (!OSSOS.includes(chave)) return
    ossos[chave] = no
    base[chave] = { quat: no.quaternion.clone(), y: no.position.y }
  })

  const mixer = new THREE.AnimationMixer(corpo)
  const acoes = {}
  for (const trilha of modelo.animacoes) acoes[trilha.name] = mixer.clipAction(trilha)
  const parado = acoes.Idle || null
  const andando = acoes.Walk || parado
  const correndo = acoes.Run || andando
  let atual = null
  let dancando = false
  let relogio = Math.random() * 8

  function trocar(acao, escalaTempo = 1) {
    if (!acao) return
    acao.timeScale = escalaTempo
    if (acao === atual) return
    acao.reset().fadeIn(0.25).play()
    if (atual) atual.fadeOut(0.25)
    atual = acao
  }

  const giro = new THREE.Quaternion()
  const euler = new THREE.Euler()

  function poe(nome, x, z = 0, y = 0) {
    const osso = ossos[nome]
    if (!osso) return
    euler.set(x, y, z)
    giro.setFromEuler(euler)
    osso.quaternion.copy(base[nome].quat).multiply(giro)
  }

  function poeNoPai(nome, x, y = 0, z = 0) {
    const osso = ossos[nome]
    if (!osso) return
    euler.set(x, y, z)
    giro.setFromEuler(euler)
    osso.quaternion.copy(base[nome].quat).premultiply(giro)
  }

  function dancar(t, estilo) {
    const p = harmonicos(t, estilo)
    poe('UpperArmL', p.bracoE, p.abreE)
    poe('UpperArmR', p.bracoD, p.abreD)
    poe('LowerArmL', p.anteE)
    poe('LowerArmR', p.anteD)
    poeNoPai('UpperLegL', p.pernaE)
    poeNoPai('UpperLegR', p.pernaD)
    poeNoPai('LowerLegL', p.joelhoE)
    poeNoPai('LowerLegR', p.joelhoD)
    poe('Torso', 0, p.incl)
    poe('Head', 0, p.cabeca)
    if (ossos.Hips) ossos.Hips.position.y = base.Hips.y + p.sobe / modelo.escala
  }

  function update(dt, speed, danca) {
    relogio += dt
    const querDancar = danca && danca !== 'nada' && speed < 0.6
    if (querDancar) {
      if (!dancando) {
        dancando = true
        if (atual) {
          atual.fadeOut(0.2)
          atual = null
        }
      }
      mixer.update(dt)
      dancar(relogio, danca)
      return
    }
    if (dancando) {
      dancando = false
      for (const nome of OSSOS) {
        if (!ossos[nome]) continue
        ossos[nome].quaternion.copy(base[nome].quat)
        ossos[nome].position.y = base[nome].y
      }
    }
    if (speed > 3.9 && correndo) trocar(correndo, Math.min(1.5, speed / 5.2))
    else if (speed > 0.6) trocar(andando, Math.min(1.7, 0.75 + speed / 3.6))
    else trocar(parado, 1)
    mixer.update(dt)
  }

  trocar(parado)
  return { root, update, kind: modelo.id }
}
