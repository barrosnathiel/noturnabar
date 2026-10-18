import * as THREE from 'three'
import { tubo, bolha, juntar } from './corpo.js'

const SKINS = {
  et: {
    body: 0x6aa179,
    limb: 0x639873,
    head: 0x7fb68c,
    detail: 0x14181b,
    build: {
      hip: 0.15,
      shoulder: 0.27,
      chest: 0.23,
      waist: 0.18,
      torso: 0.54,
      legLength: 0.78,
      armLength: 0.64,
      limb: 0.063,
      headSize: 0.27,
      stride: 1.15
    }
  },
  porco: {
    body: 0xefa3b8,
    limb: 0xe59ab0,
    head: 0xf4b6c8,
    detail: 0x7d4455,
    build: {
      hip: 0.18,
      shoulder: 0.33,
      chest: 0.29,
      waist: 0.3,
      torso: 0.46,
      legLength: 0.62,
      armLength: 0.5,
      limb: 0.088,
      headSize: 0.26,
      stride: 0.8
    }
  }
}

export const SKIN_NAMES = Object.keys(SKINS)
const V = (x, y, z) => new THREE.Vector3(x, y, z)
const cache = new Map()

function medidas(b) {
  return {
    quadrilY: b.legLength,
    peitoY: b.legLength + b.torso * 0.62,
    ombroY: b.legLength + b.torso * 0.8,
    coxa: b.legLength * 0.5,
    canela: b.legLength * 0.5 - 0.06,
    braco: b.armLength * 0.48,
    ante: b.armLength * 0.52
  }
}

function troncoGeo(b, m, gordo) {
  const pecas = [
    tubo(V(0, m.quadrilY - 0.06, 0), V(0, m.quadrilY + b.torso * 0.34, 0), b.hip * 1.12, b.waist, 18),
    bolha(V(0, m.quadrilY + b.torso * 0.3, 0), b.waist, V(1, gordo ? 1.04 : 0.92, gordo ? 1 : 0.86), 18),
    tubo(V(0, m.quadrilY + b.torso * 0.3, 0), V(0, m.ombroY + 0.04, 0), b.waist * 0.96, b.chest * 0.8, 18),
    bolha(V(0, m.quadrilY + b.torso * 0.62, 0), b.chest, V(1, gordo ? 0.9 : 1.04, gordo ? 0.95 : 0.8), 18),
    tubo(V(0, m.ombroY, 0), V(0, m.quadrilY + b.torso + 0.1, 0), b.chest * 0.58, b.limb * 1.5, 14)
  ]
  for (const lado of [-1, 1]) {
    pecas.push(bolha(V(lado * b.hip, m.quadrilY, 0), b.limb * 1.62, V(1, 0.94, 1), 12))
  }
  if (gordo) {
    const rabo = new THREE.TorusGeometry(0.07, 0.022, 7, 16, Math.PI * 1.6)
    rabo.rotateY(Math.PI / 2)
    rabo.translate(0, m.quadrilY + b.torso * 0.34, -b.waist * 1.02)
    pecas.push(rabo)
  }
  return juntar(pecas)
}

function cabecaGeo(b, kind) {
  const pecas = []
  if (kind === 'porco') {
    pecas.push(bolha(V(0, 0, 0), b.headSize, V(1.04, 0.95, 1), 18))
    pecas.push(tubo(V(0, -0.05, b.headSize * 0.5), V(0, -0.05, b.headSize * 1.05), 0.118, 0.1, 14))
    pecas.push(bolha(V(0, -0.05, b.headSize * 1.03), 0.1, V(1, 0.92, 0.52), 14))
    for (const lado of [-1, 1]) {
      const orelha = new THREE.ConeGeometry(0.085, 0.2, 7)
      orelha.scale(1, 1, 0.5)
      orelha.rotateZ(lado * 0.32)
      orelha.rotateX(-0.3)
      orelha.translate(lado * 0.16, b.headSize * 0.78, -0.02)
      pecas.push(orelha)
    }
  } else {
    pecas.push(bolha(V(0, 0.03, 0), b.headSize, V(1, 1.1, 0.92), 20))
    pecas.push(bolha(V(0, -b.headSize * 0.52, 0.01), b.headSize * 0.72, V(0.88, 0.94, 0.92), 16))
  }
  return juntar(pecas)
}

function rostoGeo(b, kind) {
  const pecas = []
  if (kind === 'et') {
    for (const lado of [-1, 1]) {
      const olho = new THREE.SphereGeometry(0.085, 14, 12)
      olho.scale(0.6, 1.5, 0.42)
      olho.rotateZ(lado * 0.42)
      olho.translate(lado * 0.125, 0.05, b.headSize * 0.82)
      pecas.push(olho)
    }
  } else {
    for (const lado of [-1, 1]) {
      const olho = new THREE.SphereGeometry(0.033, 10, 8)
      olho.translate(lado * 0.125, 0.075, b.headSize * 0.78)
      pecas.push(olho)
      const nariz = new THREE.CylinderGeometry(0.019, 0.019, 0.05, 8)
      nariz.rotateX(Math.PI / 2)
      nariz.translate(lado * 0.04, -0.05, b.headSize * 1.09)
      pecas.push(nariz)
    }
  }
  return juntar(pecas)
}

function segmento(comprimento, r0, r1, junta, ponta) {
  const pecas = [
    bolha(V(0, 0, 0), junta, null, 14),
    tubo(V(0, -comprimento, 0), V(0, 0, 0), r1, r0, 14)
  ]
  if (ponta) pecas.push(ponta)
  return juntar(pecas)
}

function montar(kind) {
  if (cache.has(kind)) return cache.get(kind)
  const skin = SKINS[kind]
  const b = skin.build
  const m = medidas(b)
  const gordo = kind === 'porco'
  const t = b.limb

  const pe = gordo
    ? bolha(V(0, -m.canela + 0.02, 0.01), t * 1.22, V(1, 0.58, 1.3), 12)
    : bolha(V(0, -m.canela + 0.02, 0.06), t * 1.5, V(0.86, 0.5, 1.95), 14)
  const mao = bolha(V(0, -m.ante + 0.01, 0), t * 1.45, V(0.8, 1.15, 0.7), 12)

  const built = {
    skin,
    b,
    m,
    geo: {
      tronco: troncoGeo(b, m, gordo),
      cabeca: cabecaGeo(b, kind),
      rosto: rostoGeo(b, kind),
      coxa: segmento(m.coxa, t * 1.42, t * 1.18, t * 1.5),
      canela: segmento(m.canela, t * 1.16, t * 0.92, t * 1.2, pe),
      braco: segmento(m.braco, t * 1.24, t * 1.0, t * 1.86),
      ante: segmento(m.ante, t * 0.98, t * 0.8, t * 1.02, mao)
    },
    mat: {
      corpo: new THREE.MeshStandardMaterial({ color: skin.body, roughness: 0.76, dithering: true }),
      membro: new THREE.MeshStandardMaterial({ color: skin.limb, roughness: 0.78, dithering: true }),
      cabeca: new THREE.MeshStandardMaterial({ color: skin.head, roughness: 0.7, dithering: true }),
      rosto: new THREE.MeshStandardMaterial({ color: skin.detail, roughness: 0.35, dithering: true })
    }
  }
  cache.set(kind, built)
  return built
}

export function createAvatar(kind) {
  const { b, m, geo, mat } = montar(kind)
  const root = new THREE.Group()

  const corpo = new THREE.Group()
  root.add(corpo)
  corpo.add(new THREE.Mesh(geo.tronco, mat.corpo))

  const pescoco = new THREE.Group()
  pescoco.position.y = m.quadrilY + b.torso + b.headSize * 0.8
  pescoco.add(new THREE.Mesh(geo.cabeca, mat.cabeca))
  pescoco.add(new THREE.Mesh(geo.rosto, mat.rosto))
  corpo.add(pescoco)

  const pernas = []
  const joelhos = []
  const bracos = []
  const cotovelos = []

  for (const lado of [-1, 1]) {
    const quadril = new THREE.Group()
    quadril.position.set(lado * b.hip, m.quadrilY, 0)
    quadril.add(new THREE.Mesh(geo.coxa, mat.membro))
    corpo.add(quadril)
    pernas.push(quadril)

    const joelho = new THREE.Group()
    joelho.position.y = -m.coxa
    joelho.add(new THREE.Mesh(geo.canela, mat.membro))
    quadril.add(joelho)
    joelhos.push(joelho)

    const ombro = new THREE.Group()
    ombro.position.set(lado * b.shoulder, m.ombroY, 0)
    ombro.add(new THREE.Mesh(geo.braco, mat.membro))
    corpo.add(ombro)
    bracos.push(ombro)

    const cotovelo = new THREE.Group()
    cotovelo.position.y = -m.braco
    cotovelo.add(new THREE.Mesh(geo.ante, mat.membro))
    ombro.add(cotovelo)
    cotovelos.push(cotovelo)
  }

  let relogio = Math.random() * 10
  let fase = Math.random() * Math.PI * 2

  function pose(p) {
    bracos[0].rotation.x = p.bracoE
    bracos[1].rotation.x = p.bracoD
    bracos[0].rotation.z = p.abreE
    bracos[1].rotation.z = p.abreD
    cotovelos[0].rotation.x = p.anteE
    cotovelos[1].rotation.x = p.anteD
    pernas[0].rotation.x = p.pernaE
    pernas[1].rotation.x = p.pernaD
    joelhos[0].rotation.x = p.joelhoE
    joelhos[1].rotation.x = p.joelhoD
    corpo.rotation.z = p.incl
    corpo.position.y = p.sobe
    pescoco.rotation.z = p.cabeca
  }

  function dancar(t, estilo) {
    if (estilo === 'maos') {
      const w = 2.9
      const alto = -2.45 + Math.sin(w * t) * 0.38 + Math.sin(w * 3 * t) * 0.1
      pose({
        bracoE: alto,
        bracoD: alto + Math.sin(w * t + 0.9) * 0.12,
        abreE: -0.5 - Math.sin(w * t) * 0.14,
        abreD: 0.5 + Math.sin(w * t) * 0.14,
        anteE: -0.45 + Math.sin(w * t) * 0.3,
        anteD: -0.45 + Math.sin(w * t + 0.7) * 0.3,
        pernaE: Math.sin(w * t) * 0.08,
        pernaD: Math.sin(w * t) * 0.08,
        joelhoE: -0.14,
        joelhoD: -0.14,
        incl: Math.sin(w * 0.5 * t) * 0.07,
        sobe: Math.max(0, Math.sin(w * t)) * 0.08,
        cabeca: Math.sin(w * t) * 0.12
      })
      return
    }
    if (estilo === 'solto') {
      const w = 3.4
      pose({
        bracoE: Math.sin(w * t) * 1.05 + Math.sin(w * 1.7 * t + 0.8) * 0.4,
        bracoD: Math.sin(w * t + 2.3) * 1.05 + Math.sin(w * 1.7 * t + 2.9) * 0.4,
        abreE: -0.36 - Math.sin(w * 1.3 * t) * 0.26,
        abreD: 0.36 + Math.sin(w * 1.3 * t + 1.7) * 0.26,
        anteE: -0.75 - Math.sin(w * 2.1 * t) * 0.45,
        anteD: -0.75 - Math.sin(w * 2.1 * t + 1.9) * 0.45,
        pernaE: Math.sin(w * t + 0.5) * 0.24,
        pernaD: Math.sin(w * t + 2.8) * 0.24,
        joelhoE: -0.3 - Math.max(0, Math.sin(w * t + 0.5)) * 0.45,
        joelhoD: -0.3 - Math.max(0, Math.sin(w * t + 2.8)) * 0.45,
        incl: Math.sin(w * 0.7 * t) * 0.18 + Math.sin(w * 1.9 * t) * 0.05,
        sobe: Math.abs(Math.sin(w * t)) * 0.07,
        cabeca: Math.sin(w * 1.3 * t) * 0.18
      })
      return
    }
    const w = 2.2
    pose({
      bracoE: Math.sin(w * t) * 0.6 + Math.sin(w * 2 * t + 0.6) * 0.15,
      bracoD: Math.sin(w * t + 0.42) * 0.6 + Math.sin(w * 2 * t + 1.9) * 0.15,
      abreE: -0.3 - Math.sin(w * t) * 0.12,
      abreD: 0.3 + Math.sin(w * t + 0.42) * 0.12,
      anteE: -0.45 - Math.sin(w * t) * 0.22,
      anteD: -0.45 - Math.sin(w * t + 0.5) * 0.22,
      pernaE: Math.sin(w * t) * 0.13,
      pernaD: -Math.sin(w * t) * 0.1,
      joelhoE: -0.18 - Math.max(0, Math.sin(w * t)) * 0.26,
      joelhoD: -0.18 - Math.max(0, -Math.sin(w * t)) * 0.26,
      incl: Math.sin(w * t) * 0.11 + Math.sin(w * 2 * t + 1.1) * 0.03,
      sobe: Math.abs(Math.cos(w * t)) * 0.045,
      cabeca: Math.sin(w * t + 0.3) * 0.09
    })
  }

  function update(dt, speed, acao) {
    relogio += dt
    if (acao && acao !== 'nada' && speed < 0.6) {
      dancar(relogio, acao)
      return
    }
    const gait = Math.min(speed / 3.5, 1.5)
    fase += dt * (2.6 + gait * 5)
    const swing = Math.sin(fase)
    const passo = swing * 0.56 * gait * b.stride
    pose({
      bracoE: -swing * 0.44 * gait,
      bracoD: swing * 0.44 * gait,
      abreE: -0.15 - gait * 0.04,
      abreD: 0.15 + gait * 0.04,
      anteE: -0.24 - Math.max(0, swing) * 0.3 * gait,
      anteD: -0.24 - Math.max(0, -swing) * 0.3 * gait,
      pernaE: passo,
      pernaD: -passo,
      joelhoE: -0.1 - Math.max(0, -swing) * 0.62 * gait,
      joelhoD: -0.1 - Math.max(0, swing) * 0.62 * gait,
      incl: swing * 0.025 * gait,
      sobe: Math.abs(Math.cos(fase)) * 0.038 * gait,
      cabeca: -swing * 0.045 * gait
    })
  }

  update(0, 0, 'nada')
  return { root, update, kind }
}
