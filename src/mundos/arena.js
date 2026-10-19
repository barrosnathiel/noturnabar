import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createBuilder } from '../world/builder.js'
import { materials as M } from '../world/materials.js'
import { buildScreen } from '../world/screen.js'
import { carregar, espalhar } from './modelos.js'

const PALCO = { x0: 12, x1: 34, z0: -30, z1: 30, topo: 2.8 }
const PISTA = { x0: -90, x1: 34, z0: -55, z1: 55 }

function trelica(b, x, z, altura) {
  const s = 1.5
  for (const dx of [-s / 2, s / 2]) {
    for (const dz of [-s / 2, s / 2]) {
      b.box(0.2, altura, 0.2, x + dx, altura / 2, z + dz, M.truss, { collide: false })
    }
  }
  for (let y = 1.8; y < altura; y += 2.6) {
    b.box(s, 0.12, 0.12, x, y, z - s / 2, M.truss, { collide: false })
    b.box(s, 0.12, 0.12, x, y, z + s / 2, M.truss, { collide: false })
    b.box(0.12, 0.12, s, x - s / 2, y, z, M.truss, { collide: false })
    b.box(0.12, 0.12, s, x + s / 2, y, z, M.truss, { collide: false })
  }
  b.collider([x - 1, 0, z - 1], [x + 1, altura, z + 1])
}

function pilhaDeSom(b, x, z) {
  for (let i = 0; i < 12; i++) {
    const largura = 3.2 - i * 0.08
    b.box(2.7, 1.5, largura, x, 3.6 + i * 1.54, z, M.speaker, { collide: false })
    b.box(0.1, 1.25, largura - 0.35, x - 1.42, 3.6 + i * 1.54, z, M.grille, { collide: false })
  }
  b.box(3.2, 3.6, 3.6, x, 1.8, z, M.darkMetal)
  b.collider([x - 1.6, 0, z - 1.8], [x + 1.6, 22, z + 1.8])
}

const MAT = {
  casco: new THREE.MeshStandardMaterial({ color: 0x4d5666, roughness: 0.62, metalness: 0.55, dithering: true }),
  carga: new THREE.MeshStandardMaterial({ color: 0x56606f, roughness: 0.78, metalness: 0.25, dithering: true }),
  tambor: new THREE.MeshStandardMaterial({ color: 0x3f4856, roughness: 0.7, metalness: 0.4, dithering: true }),
  torre: new THREE.MeshStandardMaterial({ color: 0x161c28, roughness: 0.9, metalness: 0.2, dithering: true }),
  baliza: new THREE.MeshBasicMaterial({ color: 0xff5a6e })
}

function skyline(grupo) {
  const blocos = []
  const balizas = []
  let semente = 7
  const sorte = () => {
    semente = (semente * 1103515245 + 12345) % 2147483648
    return semente / 2147483648
  }
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + sorte() * 0.08
    const r = 125 + sorte() * 85
    const largura = 9 + sorte() * 16
    const altura = 20 + sorte() * 72
    const g = new THREE.BoxGeometry(largura, altura, largura * (0.7 + sorte() * 0.7))
    g.translate(Math.cos(a) * r, altura / 2, Math.sin(a) * r)
    blocos.push(g)
    if (sorte() > 0.45) {
      const b = new THREE.SphereGeometry(0.9, 6, 5)
      b.translate(Math.cos(a) * r, altura + 1.4, Math.sin(a) * r)
      balizas.push(b)
    }
  }
  const cidade = new THREE.Mesh(mergeGeometries(blocos, false), MAT.torre)
  blocos.forEach((b) => b.dispose())
  cidade.frustumCulled = false
  grupo.add(cidade)
  if (balizas.length) {
    const luzes = new THREE.Mesh(mergeGeometries(balizas, false), MAT.baliza)
    balizas.forEach((b) => b.dispose())
    luzes.frustumCulled = false
    grupo.add(luzes)
  }
}

async function adornar(grupo) {
  const [antena, caixa, lona, barril] = await Promise.all([
    carregar('Prop_SatelliteDish'),
    carregar('Prop_Crate_Large'),
    carregar('Prop_Crate_Tarp_Large'),
    carregar('Prop_Barrel1')
  ])
  if (!grupo.parent) return

  if (antena) {
    grupo.add(espalhar(antena, [
      { x: -118, z: -64, escala: 9, giro: 0.5 },
      { x: -96, z: 78, escala: 7, giro: -0.9 },
      { x: 62, z: -82, escala: 8, giro: 2.3 },
      { x: 78, z: 56, escala: 6.5, giro: -2.1 },
      { x: -10, z: -104, escala: 7.5, giro: 1.2 },
      { x: 20, z: 96, escala: 6, giro: 3.1 }
    ]))
  }

  const pilhas = []
  const tampados = []
  for (let i = 0; i < 16; i++) {
    const lado = i % 2 === 0 ? -1 : 1
    const x = -84 + Math.floor(i / 2) * 11
    const base = { x, z: lado * 62, escala: 2.6, giro: (i % 3) * 0.4 }
    pilhas.push(base)
    if (i % 3 !== 1) pilhas.push({ ...base, z: lado * 68, escala: 2.4, giro: i * 0.3 })
    if (i % 4 === 0) tampados.push({ x: x + 4, z: lado * 65, escala: 2.8, giro: i * 0.2 })
  }
  if (caixa) grupo.add(espalhar(caixa, pilhas))
  if (lona) grupo.add(espalhar(lona, tampados))

  if (barril) {
    const tambores = []
    for (let i = 0; i < 22; i++) {
      const lado = i % 2 === 0 ? -1 : 1
      tambores.push({
        x: -78 + i * 7.4,
        z: lado * (57 + (i % 3) * 2.5),
        escala: 2.2,
        giro: i * 0.7
      })
    }
    grupo.add(espalhar(barril, tambores))
  }
}

export const arena = {
  nome: 'arena',
  titulo: 'arena',
  fundo: 0x05070e,
  construir() {
    const grupo = new THREE.Group()
    const b = createBuilder()

    const largura = PISTA.x1 - PISTA.x0
    const fundo = PISTA.z1 - PISTA.z0
    b.box(largura + 24, 0.7, fundo + 24, (PISTA.x0 + PISTA.x1) / 2, -0.35, 0, M.pit)
    b.box(PALCO.x1 - PALCO.x0, PALCO.topo, PALCO.z1 - PALCO.z0, (PALCO.x0 + PALCO.x1) / 2, PALCO.topo / 2, 0, M.stage)
    b.box(0.25, 0.16, PALCO.z1 - PALCO.z0, PALCO.x0 - 0.12, PALCO.topo - 0.08, 0, M.stageEdge, { collide: false })

    for (const z of [PISTA.z0 + 6, PISTA.z1 - 6]) {
      b.box(largura - 10, 1.15, 0.26, (PISTA.x0 + PISTA.x1) / 2 - 4, 0.58, z, M.darkMetal)
    }
    b.box(0.26, 1.15, fundo - 12, PISTA.x0 + 6, 0.58, 0, M.darkMetal)
    b.box(0.26, 1.25, 62, 7, 0.62, 0, M.metal)

    b.collider([PISTA.x0 - 4, 0, PISTA.z0 - 4], [PISTA.x0, 30, PISTA.z1 + 4])
    b.collider([PISTA.x1, 0, PISTA.z0 - 4], [PISTA.x1 + 4, 30, PISTA.z1 + 4])
    b.collider([PISTA.x0 - 4, 0, PISTA.z0 - 4], [PISTA.x1 + 4, 30, PISTA.z0])
    b.collider([PISTA.x0 - 4, 0, PISTA.z1], [PISTA.x1 + 4, 30, PISTA.z1 + 4])

    for (const z of [-33, 33]) {
      trelica(b, 10, z, 42)
      trelica(b, 33, z, 42)
      b.box(24, 0.7, 0.7, 21.5, 41.2, z, M.truss, { collide: false })
    }
    for (const x of [14, 21, 28]) {
      b.box(0.5, 0.5, 67, x, 40.2, 0, M.truss, { collide: false })
    }

    pilhaDeSom(b, 8.5, -27)
    pilhaDeSom(b, 8.5, 27)

    const colliders = b.commit(grupo)

    const telao = buildScreen(grupo, {
      largura: 40,
      altura: 22.5,
      centro: new THREE.Vector3(33.2, 17, 0),
      moldura: 1.4,
      brilho: 1400
    })
    for (const lado of [-22, 22]) {
      buildScreen(grupo, {
        largura: 14,
        altura: 7.9,
        centro: new THREE.Vector3(33.2, 11, lado),
        moldura: 0.8,
        brilho: 320
      })
    }

    grupo.add(new THREE.AmbientLight(0x1b2234, 0.5))
    const ceu = new THREE.HemisphereLight(0x2a3650, 0x080a12, 0.45)
    grupo.add(ceu)

    const palcoLuz = new THREE.PointLight(0xc8d8ff, 2600, 80, 1.7)
    palcoLuz.position.set(22, 14, 0)
    grupo.add(palcoLuz)

    for (const z of [-26, 26]) {
      const lateral = new THREE.PointLight(0x9fb4e0, 900, 60, 1.8)
      lateral.position.set(14, 10, z)
      grupo.add(lateral)
    }

    const pista = new THREE.PointLight(0x7f90bd, 1800, 90, 1.7)
    pista.position.set(-30, 18, 0)
    grupo.add(pista)

    skyline(grupo)
    adornar(grupo)

    for (let i = 0; i < 5; i++) {
      const x = -78 + i * 26
      for (const lado of [-1, 1]) {
        const poste = new THREE.PointLight(0xffd9a0, 300, 34, 1.8)
        poste.position.set(x, 7.5, lado * 60)
        grupo.add(poste)
      }
    }

    const estrelas = new THREE.BufferGeometry()
    const pontos = []
    for (let i = 0; i < 700; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 110 + Math.random() * 60
      pontos.push(Math.cos(a) * r, 30 + Math.random() * 90, Math.sin(a) * r)
    }
    estrelas.setAttribute('position', new THREE.Float32BufferAttribute(pontos, 3))
    grupo.add(
      new THREE.Points(
        estrelas,
        new THREE.PointsMaterial({ color: 0xcdd8f0, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 0.8 })
      )
    )

    return {
      grupo,
      colliders,
      telao,
      spawn: new THREE.Vector3(-70, 0, 0),
      olhar: -Math.PI / 2,
      portais: [
        {
          destino: 'lobby',
          rotulo: 'lobby',
          caixa: new THREE.Box3(
            new THREE.Vector3(PISTA.x0 - 1, 0, -4),
            new THREE.Vector3(PISTA.x0 + 3, 3.4, 4)
          )
        }
      ]
    }
  }
}
